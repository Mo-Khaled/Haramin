export interface WishlistDto {
  productIds: string[];
}

export interface LoyaltyBalanceDto {
  points: number;
  /** Points required for one unit of store credit step. */
  redeemStep: number;
  /** EGP value of one redeem step. */
  redeemStepValue: number;
}

export interface LoyaltyEntryDto {
  id: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'ADJUST';
  orderId: string | null;
  note: string | null;
  createdAt: string;
}

export interface LoyaltyHistoryDto {
  entries: LoyaltyEntryDto[];
}

export interface RedeemResultDto {
  pointsRedeemed: number;
  creditAmount: number;
  newBalance: number;
}

/** 1 point per 10 EGP spent; 100 points redeem for 50 EGP store credit. */
export const LOYALTY = {
  egpPerPoint: 10,
  redeemStep: 100,
  redeemStepValueEgp: 50,
} as const;
