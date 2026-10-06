import {
  LOYALTY,
  type LoyaltyBalanceDto,
  type LoyaltyEntryDto,
  type LoyaltyHistoryDto,
  type RedeemResultDto,
} from '@haramain/shared';
import { Prisma } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireCustomer } from '../auth/customerAuth.js';
import type { AppDeps } from '../deps.js';
import { checkRedeem } from '../domain/loyalty.js';

const redeemBody = z.object({ points: z.number().int().positive() });

class RedeemRejected extends Error {
  constructor(readonly reason: 'invalid_amount' | 'insufficient_points') {
    super(reason);
  }
}

export function loyaltyRoutes(app: FastifyInstance, deps: AppDeps): void {
  const auth = requireCustomer(deps.verifyCustomer);
  const { prisma } = deps;

  const balanceOf = async (customerId: string): Promise<number> => {
    const sum = await prisma.pointsLedger.aggregate({ where: { shopifyCustomerId: customerId }, _sum: { points: true } });
    return sum._sum.points ?? 0;
  };

  app.get('/loyalty/balance', { preHandler: auth }, async (request): Promise<LoyaltyBalanceDto> => ({
    points: await balanceOf(request.customerId),
    redeemStep: LOYALTY.redeemStep,
    redeemStepValue: LOYALTY.redeemStepValueEgp,
  }));

  app.get('/loyalty/history', { preHandler: auth }, async (request): Promise<LoyaltyHistoryDto> => {
    const rows = await prisma.pointsLedger.findMany({
      where: { shopifyCustomerId: request.customerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return {
      entries: rows.map((r) => ({
        id: r.id,
        points: r.points,
        type: r.type as LoyaltyEntryDto['type'],
        orderId: r.orderId,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  });

  app.post('/loyalty/redeem', { preHandler: auth, config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const parsed = redeemBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_amount' });
    const customerId = request.customerId;
    const { points } = parsed.data;

    // Debit first, inside a serializable transaction, so concurrent redemptions cannot overspend.
    let creditEgp = 0;
    try {
      await prisma.$transaction(
        async (tx) => {
          const sum = await tx.pointsLedger.aggregate({ where: { shopifyCustomerId: customerId }, _sum: { points: true } });
          const check = checkRedeem(points, sum._sum.points ?? 0);
          if (!check.ok) throw new RedeemRejected(check.reason);
          creditEgp = check.creditEgp;
          await tx.pointsLedger.create({
            data: { shopifyCustomerId: customerId, points: -points, type: 'REDEEM', note: `Redeemed for ${creditEgp} EGP credit` },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof RedeemRejected) return reply.code(400).send({ error: error.reason });
      throw error;
    }

    try {
      await deps.creditStoreCredit(customerId, creditEgp);
    } catch (error) {
      // Give the points back so a failed credit never costs the customer.
      await prisma.pointsLedger.create({
        data: { shopifyCustomerId: customerId, points, type: 'ADJUST', note: 'Refund: store credit failed' },
      });
      request.log.error(error, 'store credit failed after debit');
      return reply.code(502).send({ error: 'credit_failed' });
    }

    const result: RedeemResultDto = {
      pointsRedeemed: points,
      creditAmount: creditEgp,
      newBalance: await balanceOf(customerId),
    };
    return result;
  });
}
