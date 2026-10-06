import type { PrismaClient } from '@prisma/client';

import { bostaEventSchema, bostaStateCode, mapBostaState, type ShopifyOrderPayload } from '../domain/bosta.js';
import { pointsForSubtotal, refundedSubtotal } from '../domain/loyalty.js';
import { ABANDONED_CART_MESSAGE, ORDER_MESSAGES, POINTS_MESSAGE, PRICE_DROP_MESSAGE } from '../domain/messages.js';
import { classifyPayment, PAYMENT_TAGS } from '../domain/payment.js';
import { isPriceDrop, minVariantPrice } from '../domain/pricing.js';
import { productGid } from '../lib/hmac.js';
import type { JobName } from '../queues/index.js';
import { cancelShipmentForOrder, createShipmentForOrder } from '../services/bosta.js';
import { awardOrderPoints } from '../services/loyaltyAward.js';
import { clawBackRedeemedCredit } from '../services/loyaltyClawback.js';
import { reverseOrderPoints } from '../services/loyaltyReversal.js';
import { pushToCustomer, sendLocalizedPush } from '../services/push.js';
import { addOrderTags, debitStoreCredit } from '../services/shopifyAdmin.js';

const ABANDONED_AFTER_MS = 60 * 60_000;
const ABANDONED_EXPIRES_MS = 24 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
/** Retention for rows that only exist to dedupe or sweep; business records (ledger, shipments) are kept. */
const RETENTION_MS = {
  processedWebhook: 30 * DAY_MS,
  abandonedCheckout: 7 * DAY_MS,
  pendingReversal: 30 * DAY_MS,
  cancelledOrder: 365 * DAY_MS,
};

export type JobHandler = (data: unknown) => Promise<void>;

/** Narrows the untyped queue payload to the shape each handler expects (webhook bodies are verified upstream). */
function typed<T>(handler: (data: T) => Promise<void>): JobHandler {
  return (data) => handler(data as T);
}

function validDate(value: string | null | undefined): Date | null {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
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
    if (points === 0 || order.cancelled_at) return;
    const awarded = await awardOrderPoints(prisma, { id: String(order.id), name: order.name, customerId, points });
    if (awarded > 0) await pushToCustomer(prisma, customerId, POINTS_MESSAGE(awarded));
  });

  /** After a reversal, take back any store credit that was already redeemed from the reversed points. */
  const reclaimCredit = async (orderId: string, key: string, outcome: { points: number; customerId: string | null }) => {
    if (outcome.customerId && outcome.points > 0) {
      await clawBackRedeemedCredit(
        prisma,
        { customerId: outcome.customerId, claimKey: `${orderId}:${key}`, reversedPoints: outcome.points },
        debitStoreCredit,
      );
    }
  };

  const onOrderCancelled = typed(async (order: { id: number }) => {
    const orderId = String(order.id);
    await prisma.cancelledOrder.upsert({ where: { orderId }, create: { orderId }, update: {} });
    await reclaimCredit(orderId, 'cancel', await reverseOrderPoints(prisma, orderId, 'cancel', 'all'));
    await cancelShipmentForOrder(prisma, orderId);
  });

  const onRefundCreated = typed(
    async (refund: { id: number; order_id: number; refund_line_items?: { subtotal?: string | number | null }[] }) => {
      const orderId = String(refund.order_id);
      const key = `refund:${refund.id}`;
      const points = pointsForSubtotal(refundedSubtotal(refund.refund_line_items ?? []));
      await reclaimCredit(orderId, key, await reverseOrderPoints(prisma, orderId, key, points));
    },
  );

  const onProductUpdated = typed(async (product: { id: number; title: string; variants: { price: string }[] }) => {
    const current = minVariantPrice(product.variants);
    if (current === null) return;

    const id = productGid(product.id);
    const previous = await prisma.productPrice.findUnique({ where: { productId: id } });
    if (previous && isPriceDrop(previous.minPrice.toNumber(), current)) {
      const wishlisted = await prisma.wishlistItem.findMany({ where: { productId: id }, select: { shopifyCustomerId: true } });
      const customerIds = [...new Set(wishlisted.map((w) => w.shopifyCustomerId))];
      if (customerIds.length > 0) {
        const devices = await prisma.deviceToken.findMany({ where: { shopifyCustomerId: { in: customerIds } } });
        await sendLocalizedPush(prisma, devices, PRICE_DROP_MESSAGE(product.title), { productId: id });
      }
    }
    // Recorded last: a push failure retries the whole job instead of silently dropping the notifications.
    await prisma.productPrice.upsert({
      where: { productId: id },
      create: { productId: id, minPrice: current },
      update: { minPrice: current },
    });
  });

  const onCheckoutUpdated = typed(async (checkout: { id: number; customer?: { id: number } | null; completed_at?: string | null }) => {
    const checkoutId = String(checkout.id);
    const shopifyCustomerId = checkout.customer ? String(checkout.customer.id) : null;
    const completedAt = validDate(checkout.completed_at);
    await prisma.abandonedCheckout.upsert({
      where: { checkoutId },
      create: { checkoutId, shopifyCustomerId, completedAt },
      update: { shopifyCustomerId: shopifyCustomerId ?? undefined, completedAt: completedAt ?? undefined },
    });
  });

  const onBostaStatus = typed(async (data: unknown) => {
    const parsed = bostaEventSchema.safeParse(data);
    if (!parsed.success) return; // A malformed event can never succeed, so retrying would only burn attempts.
    const event = parsed.data;
    const shipment = await prisma.shipmentMap.findFirst({
      where: { OR: [{ trackingNo: event.trackingNumber ?? '__none__' }, { bostaId: event._id ?? '__none__' }] },
    });
    if (!shipment || shipment.status === 'cancelled') return;

    const status = mapBostaState(bostaStateCode(event));
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
      // One failing push must not block the rest of the batch; it stays unnotified for the next sweep.
      try {
        if (checkout.shopifyCustomerId) await pushToCustomer(prisma, checkout.shopifyCustomerId, ABANDONED_CART_MESSAGE);
        await prisma.abandonedCheckout.update({ where: { checkoutId: checkout.checkoutId }, data: { notifiedAt: new Date() } });
      } catch (error) {
        console.error(`abandoned-checkout push failed for ${checkout.checkoutId}`, error);
      }
    }
  };

  /** Deletes dedupe and sweep rows past their useful life so those tables stay bounded. */
  const onCleanup: JobHandler = async () => {
    const before = (ms: number) => new Date(Date.now() - ms);
    await prisma.processedWebhook.deleteMany({ where: { processedAt: { lt: before(RETENTION_MS.processedWebhook) } } });
    await prisma.abandonedCheckout.deleteMany({ where: { createdAt: { lt: before(RETENTION_MS.abandonedCheckout) } } });
    await prisma.pendingReversal.deleteMany({ where: { createdAt: { lt: before(RETENTION_MS.pendingReversal) } } });
    await prisma.cancelledOrder.deleteMany({ where: { createdAt: { lt: before(RETENTION_MS.cancelledOrder) } } });
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
    'cron.cleanup': onCleanup,
  };
}
