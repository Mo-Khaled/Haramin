import { Prisma, type PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

export interface LedgerRow {
  id?: string;
  orderId: string | null;
  type: string;
  points: number;
  shopifyCustomerId: string;
  note: string | null;
}

export interface PendingRow {
  orderId: string;
  key: string;
  points: number;
}

const duplicate = () => new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' });

/** In-memory ledger, cancelled-order and pending-reversal tables honouring the unique constraints Postgres would enforce. */
export function fakeLoyaltyDb(ledger: LedgerRow[] = [], cancelled: string[] = [], pending: PendingRow[] = []) {
  let nextId = 1;
  const pointsLedger = {
    findUnique: vi.fn(async ({ where }: { where: { orderId_type: { orderId: string; type: string } } }) =>
      ledger.find((r) => r.orderId === where.orderId_type.orderId && r.type === where.orderId_type.type) ?? null,
    ),
    aggregate: vi.fn(
      async ({ where }: { where: { type?: string; orderId?: { startsWith: string }; shopifyCustomerId?: string } }) => ({
        _sum: {
          points: ledger
            .filter(
              (r) =>
                (where.type === undefined || r.type === where.type) &&
                (where.orderId === undefined || r.orderId?.startsWith(where.orderId.startsWith)) &&
                (where.shopifyCustomerId === undefined || r.shopifyCustomerId === where.shopifyCustomerId),
            )
            .reduce((sum, r) => sum + r.points, 0),
        },
      }),
    ),
    create: vi.fn(async ({ data }: { data: LedgerRow }) => {
      if (data.orderId !== null && ledger.some((r) => r.orderId === data.orderId && r.type === data.type)) throw duplicate();
      const row = { ...data, id: `row${nextId++}` };
      ledger.push(row);
      return row;
    }),
    delete: vi.fn(async ({ where }: { where: { id: string } }) => {
      const index = ledger.findIndex((r) => r.id === where.id);
      if (index >= 0) ledger.splice(index, 1);
    }),
  };
  const cancelledOrder = {
    findUnique: vi.fn(async ({ where }: { where: { orderId: string } }) => (cancelled.includes(where.orderId) ? where : null)),
  };
  const pendingReversal = {
    findMany: vi.fn(async ({ where }: { where: { orderId: string } }) => pending.filter((p) => p.orderId === where.orderId)),
    upsert: vi.fn(async ({ create }: { create: PendingRow }) => {
      if (!pending.some((p) => p.orderId === create.orderId && p.key === create.key)) pending.push(create);
    }),
    deleteMany: vi.fn(async ({ where }: { where: { orderId: string } }) => {
      for (let i = pending.length - 1; i >= 0; i--) if (pending[i]!.orderId === where.orderId) pending.splice(i, 1);
    }),
  };
  const prisma = {
    pointsLedger,
    cancelledOrder,
    pendingReversal,
    $transaction: async (fn: (tx: unknown) => unknown) => fn(prisma),
  };
  return prisma as unknown as PrismaClient;
}
