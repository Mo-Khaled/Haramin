import { describe, expect, it, vi } from 'vitest';

import { awardOrderPoints } from '../services/loyaltyAward.js';
import { clawBackRedeemedCredit } from '../services/loyaltyClawback.js';
import { reverseOrderPoints } from '../services/loyaltyReversal.js';
import { fakeLoyaltyDb, type LedgerRow, type PendingRow } from './fakeLedger.js';

const earned = (points: number): LedgerRow => ({ orderId: '42', type: 'EARN', points, shopifyCustomerId: '7', note: 'Order #1001' });
const balance = (rows: LedgerRow[]) => rows.reduce((sum, r) => sum + r.points, 0);
const order = { id: '42', name: '#1001', customerId: '7', points: 100 };

describe('reverseOrderPoints', () => {
  it('takes back points for a partial refund, then the rest on cancellation', async () => {
    const rows = [earned(100)];
    const prisma = fakeLoyaltyDb(rows);
    expect((await reverseOrderPoints(prisma, '42', 'refund:1', 30)).points).toBe(30);
    expect((await reverseOrderPoints(prisma, '42', 'cancel', 'all')).points).toBe(70);
    expect(balance(rows)).toBe(0);
  });

  it('is idempotent when the same refund webhook is processed twice', async () => {
    const rows = [earned(100)];
    const prisma = fakeLoyaltyDb(rows);
    await reverseOrderPoints(prisma, '42', 'refund:1', 30);
    expect((await reverseOrderPoints(prisma, '42', 'refund:1', 30)).points).toBe(0);
    expect(balance(rows)).toBe(70);
  });

  it('never reverses more than the order earned and reports the customer', async () => {
    const rows = [earned(50)];
    const prisma = fakeLoyaltyDb(rows);
    expect(await reverseOrderPoints(prisma, '42', 'refund:1', 80)).toEqual({ points: 50, customerId: '7' });
    expect((await reverseOrderPoints(prisma, '42', 'refund:2', 10)).points).toBe(0);
  });

  it('records nothing for a full cancellation of an order that has not earned yet', async () => {
    const rows: LedgerRow[] = [];
    const pending: PendingRow[] = [];
    expect((await reverseOrderPoints(fakeLoyaltyDb(rows, [], pending), '42', 'cancel', 'all')).points).toBe(0);
    expect(rows).toEqual([]);
    expect(pending).toEqual([]);
  });

  it('parks a partial refund that arrives before the earn', async () => {
    const pending: PendingRow[] = [];
    await reverseOrderPoints(fakeLoyaltyDb([], [], pending), '42', 'refund:1', 30);
    expect(pending).toEqual([{ orderId: '42', key: 'refund:1', points: 30 }]);
  });
});

describe('awardOrderPoints', () => {
  it('credits points once, even when the webhook is processed twice', async () => {
    const rows: LedgerRow[] = [];
    const prisma = fakeLoyaltyDb(rows);
    expect(await awardOrderPoints(prisma, order)).toBe(100);
    expect(await awardOrderPoints(prisma, order)).toBe(0);
    expect(balance(rows)).toBe(100);
  });

  it('awards nothing when the order was cancelled before the paid job ran', async () => {
    const rows: LedgerRow[] = [];
    expect(await awardOrderPoints(fakeLoyaltyDb(rows, ['42']), order)).toBe(0);
    expect(rows).toEqual([]);
  });

  it('nets out a partial refund that was processed before the earn', async () => {
    const rows: LedgerRow[] = [];
    const pending: PendingRow[] = [{ orderId: '42', key: 'refund:1', points: 30 }];
    expect(await awardOrderPoints(fakeLoyaltyDb(rows, [], pending), order)).toBe(70);
    expect(balance(rows)).toBe(70);
    expect(pending).toEqual([]);
  });
});

describe('clawBackRedeemedCredit', () => {
  const claim = (claimKey: string, reversedPoints: number) => ({ customerId: '7', claimKey, reversedPoints });
  const redeemed = (points: number): LedgerRow => ({ orderId: null, type: 'REDEEM', points: -points, shopifyCustomerId: '7', note: null });

  it('debits the Shopify credit for points that were already redeemed and zeroes the deficit', async () => {
    const rows = [earned(200), redeemed(200)];
    const prisma = fakeLoyaltyDb(rows);
    const debit = vi.fn(async () => undefined);
    await reverseOrderPoints(prisma, '42', 'cancel', 'all');
    expect(balance(rows)).toBe(-200);
    expect(await clawBackRedeemedCredit(prisma, claim('42:cancel', 200), debit)).toBe(200);
    expect(debit).toHaveBeenCalledWith('7', 100);
    expect(balance(rows)).toBe(0);
  });

  it('does nothing when the balance can absorb the reversal', async () => {
    const rows = [earned(200)];
    const debit = vi.fn(async () => undefined);
    await reverseOrderPoints(fakeLoyaltyDb(rows), '42', 'refund:1', 50);
    expect(await clawBackRedeemedCredit(fakeLoyaltyDb(rows), claim('42:refund:1', 50), debit)).toBe(0);
    expect(debit).not.toHaveBeenCalled();
  });

  it('is idempotent and keeps the deficit when Shopify cannot debit', async () => {
    const rows = [earned(200), redeemed(200)];
    const prisma = fakeLoyaltyDb(rows);
    await reverseOrderPoints(prisma, '42', 'cancel', 'all');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const failing = vi.fn(async () => {
      throw new Error('insufficient store credit');
    });
    expect(await clawBackRedeemedCredit(prisma, claim('42:cancel', 200), failing)).toBe(0);
    expect(balance(rows)).toBe(-200);

    const debit = vi.fn(async () => undefined);
    await clawBackRedeemedCredit(prisma, claim('42:cancel', 200), debit);
    await clawBackRedeemedCredit(prisma, claim('42:cancel', 200), debit);
    expect(debit).toHaveBeenCalledTimes(1);
  });
});
