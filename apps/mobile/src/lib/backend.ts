import type {
  AccountDeletionDto,
  CreateReviewDto,
  LoyaltyBalanceDto,
  LoyaltyHistoryDto,
  RedeemResultDto,
  ReviewSummaryDto,
} from '@haramain/shared';

import { env } from './env';

export class BackendError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`API ${path} failed: ${status}`);
  }
}

/** Calls the Haramain API; pass a customer token for account endpoints, omit it for public ones. */
async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!env.apiUrl) throw new Error('EXPO_PUBLIC_API_URL is not set');
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) throw new BackendError(path, response.status);
  return (await response.json()) as T;
}

export const backend = {
  async getWishlist(token: string): Promise<string[]> {
    const data = await request<{ productIds: string[] }>('/wishlist', {}, token);
    return data.productIds;
  },
  async addWishlist(token: string, productId: string): Promise<void> {
    await request('/wishlist', { method: 'POST', body: JSON.stringify({ productId }) }, token);
  },
  async removeWishlist(token: string, productId: string): Promise<void> {
    await request(`/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE' }, token);
  },
  getLoyaltyBalance: (token: string) => request<LoyaltyBalanceDto>('/loyalty/balance', {}, token),
  getLoyaltyHistory: (token: string) => request<LoyaltyHistoryDto>('/loyalty/history', {}, token),
  redeemPoints: (token: string, points: number) =>
    request<RedeemResultDto>('/loyalty/redeem', { method: 'POST', body: JSON.stringify({ points }) }, token),
  async registerDevice(token: string, deviceToken: string, platform: string, language: string): Promise<void> {
    await request('/devices', { method: 'POST', body: JSON.stringify({ token: deviceToken, platform, language }) }, token);
  },
  async unregisterDevice(token: string, deviceToken: string): Promise<void> {
    await request(`/devices/${encodeURIComponent(deviceToken)}`, { method: 'DELETE' }, token);
  },
  deleteAccount: (token: string) => request<AccountDeletionDto>('/account', { method: 'DELETE' }, token),
  getReviews: (handle: string) => request<ReviewSummaryDto>(`/reviews/${encodeURIComponent(handle)}`),
  async submitReview(review: CreateReviewDto): Promise<void> {
    await request('/reviews', { method: 'POST', body: JSON.stringify(review) });
  },
};
