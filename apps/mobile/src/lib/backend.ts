import type { LoyaltyBalanceDto, LoyaltyHistoryDto, RedeemResultDto } from '@haramain/shared';

import { env } from './env';

async function request<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  if (!env.apiUrl) throw new Error('EXPO_PUBLIC_API_URL is not set');
  const response = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (!response.ok) throw new Error(`API ${path} failed: ${response.status}`);
  return (await response.json()) as T;
}

export const backend = {
  async getWishlist(token: string): Promise<string[]> {
    const data = await request<{ productIds: string[] }>('/wishlist', token);
    return data.productIds;
  },
  async addWishlist(token: string, productId: string): Promise<void> {
    await request('/wishlist', token, { method: 'POST', body: JSON.stringify({ productId }) });
  },
  async removeWishlist(token: string, productId: string): Promise<void> {
    await request(`/wishlist/${encodeURIComponent(productId)}`, token, { method: 'DELETE' });
  },
  getLoyaltyBalance: (token: string) => request<LoyaltyBalanceDto>('/loyalty/balance', token),
  getLoyaltyHistory: (token: string) => request<LoyaltyHistoryDto>('/loyalty/history', token),
  redeemPoints: (token: string, points: number) =>
    request<RedeemResultDto>('/loyalty/redeem', token, { method: 'POST', body: JSON.stringify({ points }) }),
  async registerDevice(token: string, deviceToken: string, platform: string): Promise<void> {
    await request('/devices', token, { method: 'POST', body: JSON.stringify({ token: deviceToken, platform }) });
  },
};
