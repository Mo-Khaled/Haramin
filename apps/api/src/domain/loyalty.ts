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
