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
      count: vi.fn().mockResolvedValue(0),
    },
    pointsLedger: {
      aggregate: vi.fn(async () => ({ _sum: { points: ledger.reduce((sum, row) => sum + row.points, 0) } })),
      create: vi.fn(async ({ data }: { data: { points: number; type: string } }) => {
        ledger.push({ points: data.points, type: data.type });
        return data;
      }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    deviceToken: { upsert: vi.fn().mockResolvedValue({}), deleteMany: vi.fn().mockResolvedValue({ count: 1 }), findMany: vi.fn().mockResolvedValue([]) },
    processedWebhook: { create: vi.fn().mockResolvedValue({}), delete: vi.fn().mockResolvedValue({}) },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(prisma)),
  };
  const deps: AppDeps = {
    prisma: prisma as unknown as PrismaClient,
    enqueue: vi.fn().mockResolvedValue(undefined),
    verifyCustomer: vi.fn(async (token: string) => (token === 'good-token' ? CUSTOMER : null)),
    creditStoreCredit: vi.fn().mockResolvedValue(undefined),
    requestCustomerErasure: vi.fn().mockResolvedValue(undefined),
    reviews: {
      getSummary: vi.fn().mockResolvedValue({ average: 4.5, count: 2, histogram: [1, 1, 0, 0, 0], reviews: [] }),
      submit: vi.fn().mockResolvedValue(undefined),
    },
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

describe('account deletion', () => {
  const withDeletes = () => {
    const made = makeDeps();
    const prisma = made.prisma as unknown as Record<string, Record<string, unknown>>;
    prisma.wishlistItem!.deleteMany = vi.fn().mockResolvedValue({ count: 1 });
    prisma.abandonedCheckout = { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) };
    prisma.pointsLedger!.deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    prisma.shipmentMap = { updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
    made.prisma.$transaction = vi.fn(async (steps: unknown) => Promise.all(steps as Promise<unknown>[])) as never;
    return { ...made, prisma: prisma as never };
  };

  it('requires sign-in', async () => {
    const { deps } = withDeletes();
    expect((await buildServer(deps).inject({ method: 'DELETE', url: '/account' })).statusCode).toBe(401);
  });

  it('deletes the caller\'s own data and asks Shopify to erase the customer', async () => {
    const { deps, prisma } = withDeletes();
    const res = await buildServer(deps).inject({ method: 'DELETE', url: '/account', headers: AUTH });
    expect(res.json()).toEqual({ status: 'requested' });
    const owner = { where: { shopifyCustomerId: CUSTOMER } };
    expect((prisma as never as { wishlistItem: { deleteMany: ReturnType<typeof vi.fn> } }).wishlistItem.deleteMany).toHaveBeenCalledWith(owner);
    expect((prisma as never as { pointsLedger: { deleteMany: ReturnType<typeof vi.fn> } }).pointsLedger.deleteMany).toHaveBeenCalledWith(owner);
    expect((prisma as never as { shipmentMap: { updateMany: ReturnType<typeof vi.fn> } }).shipmentMap.updateMany).toHaveBeenCalledWith({
      ...owner,
      data: { shopifyCustomerId: null },
    });
    expect(deps.requestCustomerErasure).toHaveBeenCalledWith(CUSTOMER);
  });

  it('still reports success, flagged for manual review, when Shopify refuses the erasure request', async () => {
    const { deps } = withDeletes();
    (deps.requestCustomerErasure as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('missing scope'));
    const res = await buildServer(deps).inject({ method: 'DELETE', url: '/account', headers: AUTH });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'manual_review' });
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
    expect(deps.enqueue).toHaveBeenCalledWith('bosta.status', { _id: 'b1', state: 45 }, 'bosta-b1-45');
  });

  it('rejects bodies whose identifiers are objects, so they can never become Prisma filters', async () => {
    const { deps } = makeDeps();
    const app = buildServer(deps);
    const headers = { 'content-type': 'application/json' };
    const url = '/webhooks/bosta?secret=test-bosta-secret';
    for (const payload of [
      { trackingNumber: { not: 'x' }, state: 45 },
      { _id: { startsWith: '' }, state: 45 },
      { _id: 'b1' },
      { state: 45 },
      null,
      'text',
    ]) {
      const res = await app.inject({ method: 'POST', url, headers, payload: JSON.stringify(payload) });
      expect(res.statusCode).toBe(400);
    }
    expect((await app.inject({ method: 'POST', url, headers, payload: '{bad' })).statusCode).toBe(400);
    expect(deps.enqueue).not.toHaveBeenCalled();
  });

  it('accepts a numeric tracking number and a nested state code', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/webhooks/bosta?secret=test-bosta-secret',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ trackingNumber: 12345, state: { code: 41 } }),
    });
    expect(res.statusCode).toBe(200);
    expect(deps.enqueue).toHaveBeenCalledWith('bosta.status', { trackingNumber: '12345', state: { code: 41 } }, 'bosta-12345-41');
  });
});

describe('devices', () => {
  it('unregisters only the caller\'s own device token', async () => {
    const { deps, prisma } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'DELETE', url: '/devices/ExponentPushToken[abc]', headers: AUTH });
    expect(res.statusCode).toBe(200);
    expect(prisma.deviceToken.deleteMany).toHaveBeenCalledWith({ where: { token: 'ExponentPushToken[abc]', shopifyCustomerId: CUSTOMER } });
  });
});

describe('reviews', () => {
  const review = {
    productId: 'gid://shopify/Product/7639685496937',
    handle: 'cream-velvet-100ml',
    name: 'Sara',
    email: 'sara@example.com',
    rating: 5,
    body: 'Lovely warm vanilla, lasts all day.',
  };

  it('returns the summary for a product handle without sign-in', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'GET', url: '/reviews/cream-velvet-100ml' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ average: 4.5, count: 2 });
  });

  it('rejects malformed handles', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'GET', url: '/reviews/Bad%20Handle' });
    expect(res.statusCode).toBe(400);
  });

  it('reports 503 when Judge.me is not configured', async () => {
    const { deps } = makeDeps();
    const { ReviewsUnavailableError } = await import('../services/judgeme.js');
    (deps.reviews.getSummary as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new ReviewsUnavailableError('no token'));
    const res = await buildServer(deps).inject({ method: 'GET', url: '/reviews/cream-velvet-100ml' });
    expect(res.statusCode).toBe(503);
  });

  it('accepts a valid review and forwards it', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'POST', url: '/reviews', payload: review });
    expect(res.statusCode).toBe(201);
    expect(deps.reviews.submit).toHaveBeenCalledWith(review);
  });

  it('rejects invalid ratings, emails and short bodies', async () => {
    const { deps } = makeDeps();
    const app = buildServer(deps);
    for (const bad of [{ rating: 6 }, { email: 'nope' }, { body: 'short' }]) {
      const res = await app.inject({ method: 'POST', url: '/reviews', payload: { ...review, ...bad } });
      expect(res.statusCode).toBe(400);
    }
    expect(deps.reviews.submit).not.toHaveBeenCalled();
  });
});

describe('auth bridge', () => {
  it('forwards the OAuth result to the app scheme unchanged', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'GET', url: '/auth/callback?code=abc&state=xyz' });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe('haramain://auth/callback?code=abc&state=xyz');
  });
});

describe('hardening', () => {
  it('rate-limits review submissions per client IP', async () => {
    const { deps } = makeDeps();
    const app = buildServer(deps);
    const payload = {
      productId: '7639685496937',
      handle: 'cream-velvet-100ml',
      name: 'Sara',
      email: 'sara@example.com',
      rating: 5,
      body: 'Lovely warm vanilla, lasts all day.',
    };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await app.inject({ method: 'POST', url: '/reviews', payload, remoteAddress: '203.0.113.9' });
      statuses.push(res.statusCode);
    }
    expect(statuses.slice(0, 5)).toEqual([201, 201, 201, 201, 201]);
    expect(statuses[5]).toBe(429);
    const other = await app.inject({ method: 'POST', url: '/reviews', payload, remoteAddress: '203.0.113.10' });
    expect(other.statusCode).toBe(201);
  });

  it('answers malformed JSON with 400, not 500', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/reviews',
      headers: { 'content-type': 'application/json' },
      payload: '{bad',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ error: 'bad_request' });
  });

  it('survives malformed percent-encoding in the query string instead of crashing the logger', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'GET', url: '/health?%' });
    expect(res.statusCode).toBe(200);
  });

  it('sends security headers', async () => {
    const { deps } = makeDeps();
    const res = await buildServer(deps).inject({ method: 'GET', url: '/health' });
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('caps the wishlist size', async () => {
    const { deps, prisma } = makeDeps();
    prisma.wishlistItem.count.mockResolvedValueOnce(500);
    const res = await buildServer(deps).inject({
      method: 'POST',
      url: '/wishlist',
      headers: AUTH,
      payload: { productId: 'gid://shopify/Product/9' },
    });
    expect(res.statusCode).toBe(409);
    expect(prisma.wishlistItem.upsert).not.toHaveBeenCalled();
  });
});
