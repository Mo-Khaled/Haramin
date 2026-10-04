import { Prisma, type PrismaClient } from '@prisma/client';
import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AppDeps } from '../deps.js';
import { buildServer } from '../server.js';

const CUSTOMER = '555';
const AUTH = { authorization: 'Bearer good-token' };

function uniqueViolation() {
  return new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' });
}

function makeDeps() {
  const ledger: { points: number; type: string }[] = [];
  const prisma = {
    wishlistItem: {
      findMany: vi.fn().mockResolvedValue([{ productId: 'gid://shopify/Product/1' }]),
      upsert: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    pointsLedger: {
      aggregate: vi.fn(async () => ({ _sum: { points: ledger.reduce((sum, row) => sum + row.points, 0) } })),
      create: vi.fn(async ({ data }: { data: { points: number; type: string } }) => {
        ledger.push({ points: data.points, type: data.type });
        return data;
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    deviceToken: { upsert: vi.fn().mockResolvedValue({}) },
    processedWebhook: { create: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  const deps: AppDeps = {
    prisma: prisma as unknown as PrismaClient,
    enqueue: vi.fn().mockResolvedValue(undefined),
    verifyCustomer: vi.fn(async (token: string) => (token === 'good-token' ? CUSTOMER : null)),
    creditStoreCredit: vi.fn().mockResolvedValue(undefined),
  };
  return { deps, prisma, ledger };
}

describe('auth', () => {
  it('rejects requests without a valid customer token', async () => {
    const { deps } = makeDeps();
    const app = buildServer(deps);
    expect((await app.inject({ method: 'GET', url: '/wishlist' })).statusCode).toBe(401);
    const bad = await app.inject({ method: 'GET', url: '/wishlist', headers: { authorization: 'Bearer nope' } });
    expect(bad.statusCode).toBe(401);
  });
});

describe('wishlist', () => {
  it('lists, adds and removes items for the signed-in customer', async () => {
    const { deps, prisma } = makeDeps();
    const app = buildServer(deps);

    const list = await app.inject({ method: 'GET', url: '/wishlist', headers: AUTH });
    expect(list.json()).toEqual({ productIds: ['gid://shopify/Product/1'] });

    const add = await app.inject({
      method: 'POST',
      url: '/wishlist',
      headers: AUTH,
      payload: { productId: 'gid://shopify/Product/2' },
    });
    expect(add.statusCode).toBe(200);
    expect(prisma.wishlistItem.upsert).toHaveBeenCalledOnce();

    const remove = await app.inject({
      method: 'DELETE',
      url: `/wishlist/${encodeURIComponent('gid://shopify/Product/2')}`,
      headers: AUTH,
    });
    expect(remove.statusCode).toBe(200);
  });

  it('rejects malformed product ids', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/wishlist',
      headers: AUTH,
      payload: { productId: 'abc' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('loyalty redeem', () => {
  let ctx: ReturnType<typeof makeDeps>;
  beforeEach(() => {
    ctx = makeDeps();
  });

  it('debits points and credits the store account', async () => {
    ctx.ledger.push({ points: 250, type: 'EARN' });
    const res = await buildServer(ctx.deps).inject({
      method: 'POST',
      url: '/loyalty/redeem',
      headers: AUTH,
      payload: { points: 100 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ pointsRedeemed: 100, creditAmount: 50, newBalance: 150 });
    expect(ctx.deps.creditStoreCredit).toHaveBeenCalledWith(CUSTOMER, 50);
  });

  it('refuses when the balance is too low and never credits', async () => {
    ctx.ledger.push({ points: 50, type: 'EARN' });
    const res = await buildServer(ctx.deps).inject({
      method: 'POST',
      url: '/loyalty/redeem',
      headers: AUTH,
      payload: { points: 100 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'insufficient_points' });
    expect(ctx.deps.creditStoreCredit).not.toHaveBeenCalled();
  });

  it('refunds the points when Shopify rejects the credit', async () => {
    ctx.ledger.push({ points: 200, type: 'EARN' });
    (ctx.deps.creditStoreCredit as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'));
    const res = await buildServer(ctx.deps).inject({
      method: 'POST',
      url: '/loyalty/redeem',
      headers: AUTH,
      payload: { points: 100 },
    });
    expect(res.statusCode).toBe(502);
    expect(ctx.ledger.reduce((sum, row) => sum + row.points, 0)).toBe(200);
    expect(ctx.ledger.at(-1)?.type).toBe('ADJUST');
  });
});

describe('shopify webhooks', () => {
  const body = JSON.stringify({ id: 99, name: '#1001' });
  const sign = (payload: string) => createHmac('sha256', 'test-shopify-secret').update(payload).digest('base64');
  const headers = (signature: string) => ({
    'content-type': 'application/json',
    'x-shopify-hmac-sha256': signature,
    'x-shopify-topic': 'orders/paid',
    'x-shopify-event-id': 'evt-1',
  });

  it('rejects a bad signature', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/webhooks/shopify',
      headers: headers('bad'),
      payload: body,
    });
    expect(res.statusCode).toBe(401);
    expect(deps.enqueue).not.toHaveBeenCalled();
  });

  it('enqueues a verified event once', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/webhooks/shopify',
      headers: headers(sign(body)),
      payload: body,
    });
    expect(res.statusCode).toBe(200);
    expect(deps.enqueue).toHaveBeenCalledWith('order.paid', { id: 99, name: '#1001' }, 'evt-1');
  });

  it('acknowledges duplicates without re-enqueueing', async () => {
    const { deps, prisma } = makeDeps();
    prisma.processedWebhook.create.mockRejectedValueOnce(uniqueViolation());
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/webhooks/shopify',
      headers: headers(sign(body)),
      payload: body,
    });
    expect(res.json()).toEqual({ duplicate: true });
    expect(deps.enqueue).not.toHaveBeenCalled();
  });

  it('releases the claim and errors when the queue is down', async () => {
    const { deps, prisma } = makeDeps();
    (deps.enqueue as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('redis down'));
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/webhooks/shopify',
      headers: headers(sign(body)),
      payload: body,
    });
    expect(res.statusCode).toBe(500);
    expect(prisma.processedWebhook.delete).toHaveBeenCalledWith({ where: { id: 'evt-1' } });
  });
});

describe('bosta webhook', () => {
  it('requires the shared secret', async () => {
    const { deps } = makeDeps();
    const app = buildServer(deps);
    const headers = { 'content-type': 'application/json' };
    const wrong = await app.inject({ method: 'POST', url: '/webhooks/bosta?secret=wrong', headers, payload: '{}' });
    expect(wrong.statusCode).toBe(401);
    const ok = await app.inject({
      method: 'POST',
      url: '/webhooks/bosta?secret=test-bosta-secret',
      headers,
      payload: JSON.stringify({ _id: 'b1', state: 45 }),
    });
    expect(ok.statusCode).toBe(200);
    expect(deps.enqueue).toHaveBeenCalledOnce();
  });
});
