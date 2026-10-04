import type { PrismaClient } from '@prisma/client';

import { buildDeliveryPayload, type ShopifyOrderPayload } from '../domain/bosta.js';
import { env } from '../lib/env.js';

interface BostaCreateResponse {
  _id?: string;
  trackingNumber?: string;
  data?: { _id?: string; trackingNumber?: string };
}

/**
 * Creates a Bosta delivery for the order once. Safe to call repeatedly: an existing
 * ShipmentMap row short-circuits, so retries and duplicate webhooks never double-ship.
 */
export async function createShipmentForOrder(
  prisma: PrismaClient,
  order: ShopifyOrderPayload,
  collectOnDelivery: boolean,
): Promise<'created' | 'exists' | 'skipped'> {
  const orderId = String(order.id);
  if (await prisma.shipmentMap.findUnique({ where: { orderId } })) return 'exists';
  if (!env.BOSTA_API_KEY) return 'skipped';

  const webhookUrl =
    env.PUBLIC_API_URL && env.BOSTA_WEBHOOK_SECRET
      ? `${env.PUBLIC_API_URL}/webhooks/bosta?secret=${encodeURIComponent(env.BOSTA_WEBHOOK_SECRET)}`
      : undefined;
  const payload = buildDeliveryPayload(order, collectOnDelivery, webhookUrl);
  if (!payload) return 'skipped';

  const response = await fetch(`${env.BOSTA_BASE_URL}/api/v2/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: env.BOSTA_API_KEY },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Bosta create delivery HTTP ${response.status}`);

  const json = (await response.json()) as BostaCreateResponse;
  const bostaId = json._id ?? json.data?._id ?? null;
  const trackingNo = json.trackingNumber ?? json.data?.trackingNumber ?? null;
  await prisma.shipmentMap.create({
    data: {
      orderId,
      orderName: order.name,
      shopifyCustomerId: order.customer ? String(order.customer.id) : null,
      bostaId,
      trackingNo,
      status: 'created',
    },
  });
  return 'created';
}
