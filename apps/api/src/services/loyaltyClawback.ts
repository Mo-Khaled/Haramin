import { LOYALTY } from '@haramain/shared';
import { Prisma, type PrismaClient } from '@prisma/client';

type DebitStoreCredit = (customerId: string, amountEgp: number) => Promise<void>;

export interface ClawbackRequest {
  customerId: string;
  /** Unique per refund/cancellation; makes retries no-ops. */
  claimKey: string;
  /** Points the refund/cancellation just took back; bounds how much credit can be reclaimed. */
  reversedPoints: number;
}

function creditFor(points: number): number {
  return Math.round((points * LOYALTY.redeemStepValueEgp * 100) / LOYALTY.redeemStep) / 100;
}

async function deficitOf(prisma: PrismaClient, request: ClawbackRequest): Promise<number> {
  const sum = await prisma.pointsLedger.aggregate({ where: { shopifyCustomerId: request.customerId }, _sum: { points: true } });
  return Math.min(-(sum._sum.points ?? 0), request.reversedPoints);
}

/** Records the repayment first so a retry can never debit twice; null means it was already claimed. */
async function claimDeficit(prisma: PrismaClient, request: ClawbackRequest, deficit: number): Promise<{ id: string } | null> {
  try {
    return await prisma.pointsLedger.create({
      data: {
        shopifyCustomerId: request.customerId,
        points: deficit,
        type: 'ADJUST',
        orderId: `${request.claimKey}:clawback`,
        note: 'Store credit reclaimed after refund',
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return null;
    throw error;
  }
}

/**
 * After a refund/cancellation reverses points, the balance goes negative when those points were already
 * redeemed. Take the matching store credit back from Shopify and zero the deficit. If Shopify cannot debit
 * (credit already spent) the deficit stays and blocks redemption until future earns repay it.
 */
export async function clawBackRedeemedCredit(
  prisma: PrismaClient,
  request: ClawbackRequest,
  debit: DebitStoreCredit,
): Promise<number> {
  const deficit = await deficitOf(prisma, request);
  if (deficit <= 0) return 0;
  const claim = await claimDeficit(prisma, request, deficit);
  if (!claim) return 0;

  try {
    await debit(request.customerId, creditFor(deficit));
  } catch (error) {
    await prisma.pointsLedger.delete({ where: { id: claim.id } });
    console.error(`store credit clawback failed for customer ${request.customerId}`, error);
    return 0;
  }
  return deficit;
}
