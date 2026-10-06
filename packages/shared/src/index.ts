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

export interface ReviewDto {
  id: number;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  createdAt: string;
  pictures: string[];
}

export interface ReviewSummaryDto {
  average: number;
  count: number;
  /** Count of reviews per star, index 0 = 5 stars ... index 4 = 1 star. */
  histogram: [number, number, number, number, number];
  reviews: ReviewDto[];
}

export interface CreateReviewDto {
  productId: string;
  handle: string;
  name: string;
  email: string;
  rating: number;
  title?: string;
  body: string;
}

/** 1 point per 10 EGP spent; 100 points redeem for 50 EGP store credit. */
export const LOYALTY = {
  egpPerPoint: 10,
  redeemStep: 100,
  redeemStepValueEgp: 50,
} as const;
