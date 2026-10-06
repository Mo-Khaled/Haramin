import { Prisma, type PrismaClient } from '@prisma/client';

import { applyReversal } from './loyaltyReversal.js';

interface OrderEarn {
  id: string;
  name: string;
  customerId: string;
  points: number;
}

async function creditEarn(tx: Prisma.TransactionClient, order: OrderEarn): Promise<number> {
  if (await tx.cancelledOrder.findUnique({ where: { orderId: order.id } })) return 0;
  if (await tx.pointsLedger.findUnique({ where: { orderId_type: { orderId: order.id, type: 'EARN' } } })) return 0;

  await tx.pointsLedger.create({
    data: { shopifyCustomerId: order.customerId, points: order.points, type: 'EARN', orderId: order.id, note: `Order ${order.name}` },
  });
  let net = order.points;
  for (const refund of await tx.pendingReversal.findMany({ where: { orderId: order.id } })) {
    net -= (await applyReversal(tx, order.id, refund.key, refund.points)).points;
  }
  await tx.pendingReversal.deleteMany({ where: { orderId: order.id } });
  return net;
}

/**
 * Credits the points an order earned, unless the order was cancelled first, and applies any partial
 * refunds that were processed before the earn. Serializable, so a cancellation racing this call either
 * sees the earn (and reverses it) or is seen here. Returns the net points credited (0 if none or duplicate).
 */
export async function awardOrderPoints(prisma: PrismaClient, order: OrderEarn): Promise<number> {
  try {
    return await prisma.$transaction((tx) => creditEarn(tx, order), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 0;
    throw error;
  }
}
