import { Prisma, type PrismaClient } from '@prisma/client';

import { mapBostaState, type ShopifyOrderPayload } from '../domain/bosta.js';
import { pointsForSubtotal, refundedSubtotal } from '../domain/loyalty.js';
import { ABANDONED_CART_MESSAGE, ORDER_MESSAGES, POINTS_MESSAGE, PRICE_DROP_MESSAGE } from '../domain/messages.js';
import { classifyPayment, PAYMENT_TAGS } from '../domain/payment.js';
import { isPriceDrop, minVariantPrice } from '../domain/pricing.js';
import { productGid } from '../lib/hmac.js';
import type { JobName } from '../queues/index.js';
import { createShipmentForOrder } from '../services/bosta.js';
import { reverseOrderPoints } from '../services/loyaltyReversal.js';
import { pushToCustomer, sendLocalizedPush } from '../services/push.js';
import { addOrderTags } from '../services/shopifyAdmin.js';

const ABANDONED_AFTER_MS = 60 * 60_000;
const ABANDONED_EXPIRES_MS = 24 * 60 * 60_000;

export type JobHandler = (data: unknown) => Promise<void>;

/** Narrows the untyped queue payload to the shape each handler expects (webhook bodies are verified upstream). */
function typed<T>(handler: (data: T) => Promise<void>): JobHandler {
  return (data) => handler(data as T);
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function createHandlers(prisma: PrismaClient): Record<JobName, JobHandler> {
  const customerOf = (order: ShopifyOrderPayload) => (order.customer ? String(order.customer.id) : null);

  const onOrderCreated = typed(async (order: ShopifyOrderPayload) => {
    const method = classifyPayment(order.payment_gateway_names ?? []);
    await addOrderTags(order.id, [PAYMENT_TAGS[method]]);

    if (order.checkout_id) {
      await prisma.abandonedCheckout.updateMany({
        where: { checkoutId: String(order.checkout_id) },
        data: { completedAt: new Date() },
      });
    }

    const customerId = customerOf(order);
    if (method === 'COD') {
      await createShipmentForOrder(prisma, order, true);
      if (customerId) await pushToCustomer(prisma, customerId, ORDER_MESSAGES.confirmed(order.name));
    }
  });

  const onOrderPaid = typed(async (order: ShopifyOrderPayload) => {
    const customerId = customerOf(order);
    const method = classifyPayment(order.payment_gateway_names ?? []);

    if (method !== 'COD') {
      await createShipmentForOrder(prisma, order, false);
      if (customerId) await pushToCustomer(prisma, customerId, ORDER_MESSAGES.confirmed(order.name));
    }

    if (!customerId) return;
    const points = pointsForSubtotal(parseFloat(order.subtotal_price));
    if (points === 0) return;
    try {
      await prisma.pointsLedger.create({
        data: {
          shopifyCustomerId: customerId,
          points,
          type: 'EARN',
          orderId: String(order.id),
          note: `Order ${order.name}`,
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) return; // Already awarded for this order.
      throw error;
    }
    await pushToCustomer(prisma, customerId, POINTS_MESSAGE(points));
  });

  const onOrderCancelled = typed(async (order: { id: number }) => {
    await reverseOrderPoints(prisma, String(order.id), 'cancel', 'all');
  });

  const onRefundCreated = typed(
    async (refund: { id: number; order_id: number; refund_line_items?: { subtotal?: string | number | null }[] }) => {
      const points = pointsForSubtotal(refundedSubtotal(refund.refund_line_items ?? []));
      await reverseOrderPoints(prisma, String(refund.order_id), `refund:${refund.id}`, points);
    },
  );

  const onProductUpdated = typed(async (product: { id: number; title: string; variants: { price: string }[] }) => {
    const current = minVariantPrice(product.variants);
    if (current === null) return;

    const id = productGid(product.id);
    const previous = await prisma.productPrice.findUnique({ where: { productId: id } });
    await prisma.productPrice.upsert({
      where: { productId: id },
      create: { productId: id, minPrice: current },
      update: { minPrice: current },
    });
    if (!previous || !isPriceDrop(previous.minPrice.toNumber(), current)) return;

    const wishlisted = await prisma.wishlistItem.findMany({ where: { productId: id }, select: { shopifyCustomerId: true } });
    const customerIds = [...new Set(wishlisted.map((w) => w.shopifyCustomerId))];
    if (customerIds.length === 0) return;
    const devices = await prisma.deviceToken.findMany({ where: { shopifyCustomerId: { in: customerIds } } });
    await sendLocalizedPush(prisma, devices, PRICE_DROP_MESSAGE(product.title), { productId: id });
  });

  const onCheckoutUpdated = typed(async (checkout: { id: number; customer?: { id: number } | null; completed_at?: string | null }) => {
    const checkoutId = String(checkout.id);
    const shopifyCustomerId = checkout.customer ? String(checkout.customer.id) : null;
    await prisma.abandonedCheckout.upsert({
      where: { checkoutId },
      create: { checkoutId, shopifyCustomerId, completedAt: checkout.completed_at ? new Date(checkout.completed_at) : null },
      update: { shopifyCustomerId: shopifyCustomerId ?? undefined, completedAt: checkout.completed_at ? new Date(checkout.completed_at) : undefined },
    });
  });

  const onBostaStatus = typed(async (event: { trackingNumber?: string; _id?: string; state?: number | { code: number } }) => {
    const code = typeof event.state === 'object' ? event.state?.code : event.state;
    if (code === undefined) return;
    const shipment = await prisma.shipmentMap.findFirst({
      where: { OR: [{ trackingNo: event.trackingNumber ?? '__none__' }, { bostaId: event._id ?? '__none__' }] },
    });
    if (!shipment) return;

    const status = mapBostaState(code);
    if (shipment.status === status) return;
    await prisma.shipmentMap.update({ where: { id: shipment.id }, data: { status } });

    const template = ORDER_MESSAGES[status];
    if (template && shipment.shopifyCustomerId && shipment.orderName) {
      await pushToCustomer(prisma, shipment.shopifyCustomerId, template(shipment.orderName), { orderId: shipment.orderId });
    }
  });

  const onAbandonedSweep: JobHandler = async () => {
    const now = Date.now();
    const due = await prisma.abandonedCheckout.findMany({
      where: {
        notifiedAt: null,
        completedAt: null,
        shopifyCustomerId: { not: null },
        createdAt: { lt: new Date(now - ABANDONED_AFTER_MS), gt: new Date(now - ABANDONED_EXPIRES_MS) },
      },
      take: 200,
    });
    for (const checkout of due) {
      if (checkout.shopifyCustomerId) await pushToCustomer(prisma, checkout.shopifyCustomerId, ABANDONED_CART_MESSAGE);
      await prisma.abandonedCheckout.update({ where: { checkoutId: checkout.checkoutId }, data: { notifiedAt: new Date() } });
    }
  };

  return {
    'order.created': onOrderCreated,
    'order.paid': onOrderPaid,
    'order.cancelled': onOrderCancelled,
    'refund.created': onRefundCreated,
    'product.updated': onProductUpdated,
    'checkout.updated': onCheckoutUpdated,
    'bosta.status': onBostaStatus,
    'cron.abandoned-checkouts': onAbandonedSweep,
  };
}
