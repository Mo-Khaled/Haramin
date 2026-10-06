import { Prisma, type PrismaClient } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

import { reverseOrderPoints } from '../services/loyaltyReversal.js';

interface Row {
  orderId: string;
  type: string;
  points: number;
  shopifyCustomerId: string;
  note: string | null;
}

/** In-memory ledger that honours the (orderId, type) unique constraint like Postgres would. */
function fakeLedger(rows: Row[]) {
  const ledger = {
    findUnique: vi.fn(async ({ where }: { where: { orderId_type: { orderId: string; type: string } } }) =>
      rows.find((r) => r.orderId === where.orderId_type.orderId && r.type === where.orderId_type.type) ?? null,
    ),
    aggregate: vi.fn(async ({ where }: { where: { type: string; orderId: { startsWith: string } } }) => ({
      _sum: {
        points: rows
          .filter((r) => r.type === where.type && r.orderId.startsWith(where.orderId.startsWith))
          .reduce((sum, r) => sum + r.points, 0),
      },
    })),
    create: vi.fn(async ({ data }: { data: Row }) => {
      if (rows.some((r) => r.orderId === data.orderId && r.type === data.type)) {
        throw new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' });
      }
      rows.push(data);
      return data;
    }),
  };
  const prisma = { pointsLedger: ledger, $transaction: async (fn: (tx: unknown) => unknown) => fn(prisma) };
  return prisma as unknown as PrismaClient;
}

const earned = (points: number): Row => ({ orderId: '42', type: 'EARN', points, shopifyCustomerId: '7', note: 'Order #1001' });
const balance = (rows: Row[]) => rows.reduce((sum, r) => sum + r.points, 0);

describe('reverseOrderPoints', () => {
  it('takes back points for a partial refund, then the rest on cancellation', async () => {
    const rows = [earned(100)];
    const prisma = fakeLedger(rows);
    expect(await reverseOrderPoints(prisma, '42', 'refund:1', 30)).toBe(30);
    expect(await reverseOrderPoints(prisma, '42', 'cancel', 'all')).toBe(70);
    expect(balance(rows)).toBe(0);
  });

  it('is idempotent when the same refund webhook is processed twice', async () => {
    const rows = [earned(100)];
    const prisma = fakeLedger(rows);
    await reverseOrderPoints(prisma, '42', 'refund:1', 30);
    expect(await reverseOrderPoints(prisma, '42', 'refund:1', 30)).toBe(0);
    expect(balance(rows)).toBe(70);
  });

  it('never reverses more than the order earned', async () => {
    const rows = [earned(50)];
    const prisma = fakeLedger(rows);
    expect(await reverseOrderPoints(prisma, '42', 'refund:1', 80)).toBe(50);
    expect(await reverseOrderPoints(prisma, '42', 'refund:2', 10)).toBe(0);
  });

  it('does nothing for orders that never earned points', async () => {
    const rows: Row[] = [];
    expect(await reverseOrderPoints(fakeLedger(rows), '42', 'cancel', 'all')).toBe(0);
    expect(rows).toEqual([]);
  });
});
