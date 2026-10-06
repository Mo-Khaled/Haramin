import { Prisma, type PrismaClient } from '@prisma/client';

import { pointsToReverse } from '../domain/loyalty.js';

/**
 * Takes back points earned on an order when it is refunded or cancelled, so a customer cannot keep
 * redeemed credit after getting their money back. Each refund/cancellation has its own ledger key,
 * which makes webhook retries no-ops, and the total reversed never exceeds what the order earned.
 */
export async function reverseOrderPoints(
  prisma: PrismaClient,
  orderId: string,
  reversalKey: string,
  requested: number | 'all',
): Promise<number> {
  return prisma.$transaction(
    async (tx) => {
      const earned = await tx.pointsLedger.findUnique({ where: { orderId_type: { orderId, type: 'EARN' } } });
      if (!earned) return 0;
      const previous = await tx.pointsLedger.aggregate({
        where: { type: 'REVERSAL', orderId: { startsWith: `${orderId}:` } },
        _sum: { points: true },
      });
      const points = pointsToReverse(earned.points, -(previous._sum.points ?? 0), requested);
      if (points === 0) return 0;
      try {
        await tx.pointsLedger.create({
          data: {
            shopifyCustomerId: earned.shopifyCustomerId,
            points: -points,
            type: 'REVERSAL',
            orderId: `${orderId}:${reversalKey}`,
            note: earned.note ? `Reversed: ${earned.note}` : 'Reversed for refund',
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return 0;
        throw error;
      }
      return points;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}
