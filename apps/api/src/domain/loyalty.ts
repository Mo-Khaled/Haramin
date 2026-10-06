import { LOYALTY } from '@haramain/shared';

export function pointsForSubtotal(subtotalEgp: number): number {
  if (!Number.isFinite(subtotalEgp) || subtotalEgp <= 0) return 0;
  return Math.floor(subtotalEgp / LOYALTY.egpPerPoint);
}

export type RedeemCheck = { ok: true; creditEgp: number } | { ok: false; reason: 'invalid_amount' | 'insufficient_points' };

/** Points must be a positive multiple of the redeem step and covered by the balance. */
export function checkRedeem(points: number, balance: number): RedeemCheck {
  if (!Number.isInteger(points) || points <= 0 || points % LOYALTY.redeemStep !== 0) {
    return { ok: false, reason: 'invalid_amount' };
  }
  if (points > balance) return { ok: false, reason: 'insufficient_points' };
  return { ok: true, creditEgp: (points / LOYALTY.redeemStep) * LOYALTY.redeemStepValueEgp };
}

/**
 * Points to take back for a refund or cancellation: the requested amount (or everything left when
 * `requested` is 'all'), never more than was earned on the order minus what was already reversed.
 */
export function pointsToReverse(earned: number, alreadyReversed: number, requested: number | 'all'): number {
  const remaining = Math.max(0, earned - alreadyReversed);
  return requested === 'all' ? remaining : Math.min(Math.max(0, requested), remaining);
}

/** Sum of refunded line-item subtotals in a Shopify refunds/create payload. */
export function refundedSubtotal(lineItems: { subtotal?: string | number | null }[]): number {
  return lineItems.reduce((sum, item) => {
    const value = Number(item.subtotal ?? 0);
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);
}
