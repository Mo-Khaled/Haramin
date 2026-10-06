import { Prisma, type PrismaClient } from '@prisma/client';

import { pointsToReverse } from '../domain/loyalty.js';

export interface ReversalOutcome {
  /** Points taken back from the customer's balance by this call. */
  points: number;
  customerId: string | null;
}

const NOTHING_REVERSED: ReversalOutcome = { points: 0, customerId: null };

/**
 * Writes the reversal for one refund/cancellation inside an open transaction. Each reversal has its own
 * ledger key, which makes webhook retries no-ops, and the total reversed never exceeds what the order
 * earned. A partial refund that arrives before the order's points were earned is parked as a
 * PendingReversal and applied when the earn lands (see awardOrderPoints).
 */
export async function applyReversal(
  tx: Prisma.TransactionClient,
  orderId: string,
  reversalKey: string,
  requested: number | 'all',
): Promise<ReversalOutcome> {
  const earned = await tx.pointsLedger.findUnique({ where: { orderId_type: { orderId, type: 'EARN' } } });
  if (!earned) {
    if (requested !== 'all' && requested > 0) {
      await tx.pendingReversal.upsert({
        where: { orderId_key: { orderId, key: reversalKey } },
        create: { orderId, key: reversalKey, points: requested },
        update: {},
      });
    }
    return NOTHING_REVERSED;
  }

  const key = `${orderId}:${reversalKey}`;
  if (await tx.pointsLedger.findUnique({ where: { orderId_type: { orderId: key, type: 'REVERSAL' } } })) {
    return NOTHING_REVERSED;
  }
  const previous = await tx.pointsLedger.aggregate({
    where: { type: 'REVERSAL', orderId: { startsWith: `${orderId}:` } },
    _sum: { points: true },
  });
  const points = pointsToReverse(earned.points, -(previous._sum.points ?? 0), requested);
  if (points === 0) return NOTHING_REVERSED;
  await tx.pointsLedger.create({
    data: {
      shopifyCustomerId: earned.shopifyCustomerId,
      points: -points,
      type: 'REVERSAL',
      orderId: key,
      note: earned.note ? `Reversed: ${earned.note}` : 'Reversed for refund',
    },
  });
  return { points, customerId: earned.shopifyCustomerId };
}

/** Takes back points earned on a refunded or cancelled order. Safe to retry. */
export async function reverseOrderPoints(
  prisma: PrismaClient,
  orderId: string,
  reversalKey: string,
  requested: number | 'all',
): Promise<ReversalOutcome> {
  try {
    return await prisma.$transaction((tx) => applyReversal(tx, orderId, reversalKey, requested), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return NOTHING_REVERSED;
    throw error;
  }
}
