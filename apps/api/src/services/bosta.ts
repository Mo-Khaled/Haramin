import { Prisma, type PrismaClient } from '@prisma/client';

import { buildDeliveryPayload, type ShopifyOrderPayload } from '../domain/bosta.js';
import { env } from '../lib/env.js';

interface BostaCreateResponse {
  _id?: string;
  trackingNumber?: string;
  data?: { _id?: string; trackingNumber?: string };
}

const BOSTA_TIMEOUT_MS = 15_000;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function webhookUrl(): string | undefined {
  return env.PUBLIC_API_URL && env.BOSTA_WEBHOOK_SECRET
    ? `${env.PUBLIC_API_URL}/webhooks/bosta?secret=${encodeURIComponent(env.BOSTA_WEBHOOK_SECRET)}`
    : undefined;
}

/** Reserves the order's ShipmentMap row before calling the courier; null means another job already holds it. */
async function claimShipment(prisma: PrismaClient, order: ShopifyOrderPayload): Promise<{ id: string } | null> {
  try {
    return await prisma.shipmentMap.create({
      data: {
        orderId: String(order.id),
        orderName: order.name,
        shopifyCustomerId: order.customer ? String(order.customer.id) : null,
        status: 'creating',
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) return null;
    throw error;
  }
}

async function requestDelivery(apiKey: string, payload: unknown): Promise<BostaCreateResponse> {
  const response = await fetch(`${env.BOSTA_BASE_URL}/api/v2/deliveries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: apiKey },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(BOSTA_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Bosta create delivery HTTP ${response.status}`);
  return (await response.json()) as BostaCreateResponse;
}

/**
 * Creates a Bosta delivery for the order once. Safe to call repeatedly and concurrently: the ShipmentMap
 * row is claimed before the courier is called, so retries and duplicate webhooks never double-ship.
 * Cancelled orders never ship, and a cancellation that lands mid-call cancels the new delivery.
 */
export async function createShipmentForOrder(
  prisma: PrismaClient,
  order: ShopifyOrderPayload,
  collectOnDelivery: boolean,
): Promise<'created' | 'exists' | 'skipped'> {
  const orderId = String(order.id);
  if (order.cancelled_at || (await prisma.cancelledOrder.findUnique({ where: { orderId } }))) return 'skipped';
  if (await prisma.shipmentMap.findUnique({ where: { orderId } })) return 'exists';
  const payload = env.BOSTA_API_KEY && buildDeliveryPayload(order, collectOnDelivery, webhookUrl());
  if (!env.BOSTA_API_KEY || !payload) return 'skipped';

  const claim = await claimShipment(prisma, order);
  if (!claim) return 'exists';
  let created: BostaCreateResponse;
  try {
    created = await requestDelivery(env.BOSTA_API_KEY, payload);
  } catch (error) {
    await prisma.shipmentMap.delete({ where: { id: claim.id } }).catch(() => undefined); // Let the retry start clean.
    throw error;
  }

  await prisma.shipmentMap.update({
    where: { id: claim.id },
    data: {
      bostaId: created._id ?? created.data?._id ?? null,
      trackingNo: created.trackingNumber ?? created.data?.trackingNumber ?? null,
      status: 'created',
    },
  });
  if (await prisma.cancelledOrder.findUnique({ where: { orderId } })) await cancelShipmentForOrder(prisma, orderId);
  return 'created';
}

/** Best effort: a failed termination must not stop the order from being marked cancelled locally. */
async function terminateDelivery(apiKey: string, bostaId: string): Promise<void> {
  const hint = `cancel delivery ${bostaId} in the Bosta dashboard`;
  try {
    const response = await fetch(`${env.BOSTA_BASE_URL}/api/v2/deliveries/${encodeURIComponent(bostaId)}`, {
      method: 'DELETE',
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(BOSTA_TIMEOUT_MS),
    });
    if (!response.ok) console.error(`Bosta terminate HTTP ${response.status}; ${hint}`);
  } catch (error) {
    console.error(`Bosta terminate failed; ${hint}`, error);
  }
}

/** Terminates the order's Bosta delivery and marks it cancelled so late courier events are ignored. */
export async function cancelShipmentForOrder(prisma: PrismaClient, orderId: string): Promise<void> {
  const shipment = await prisma.shipmentMap.findUnique({ where: { orderId } });
  if (!shipment || shipment.status === 'cancelled') return;
  if (env.BOSTA_API_KEY && shipment.bostaId) await terminateDelivery(env.BOSTA_API_KEY, shipment.bostaId);
  await prisma.shipmentMap.update({ where: { id: shipment.id }, data: { status: 'cancelled' } });
}
