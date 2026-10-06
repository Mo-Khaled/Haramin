import type { CreateReviewDto, ReviewSummaryDto } from '@haramain/shared';

import { summarizeReviews, type JudgemeReview } from '../domain/reviews.js';
import { env } from '../lib/env.js';
import { numericId } from '../lib/hmac.js';

const BASE_URL = 'https://judge.me/api/v1';
const CACHE_TTL_MS = 10 * 60_000;
/** Handles come from clients, so the cache is bounded; Map keeps insertion order, so the first key is the oldest. */
const MAX_CACHED_PRODUCTS = 500;

export class ReviewsUnavailableError extends Error {}

export interface ReviewsService {
  getSummary(handle: string): Promise<ReviewSummaryDto>;
  submit(review: CreateReviewDto): Promise<void>;
}

function token(): string {
  if (!env.JUDGEME_PRIVATE_TOKEN) throw new ReviewsUnavailableError('JUDGEME_PRIVATE_TOKEN is not configured');
  return env.JUDGEME_PRIVATE_TOKEN;
}

async function getJson<T>(path: string, params: Record<string, string>): Promise<T | null> {
  const query = new URLSearchParams({ ...params, api_token: token(), shop_domain: env.SHOPIFY_STORE_DOMAIN });
  const response = await fetch(`${BASE_URL}${path}?${query}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Judge.me ${path} HTTP ${response.status}`);
  return (await response.json()) as T;
}

/** Reads reviews through Judge.me's private API, caching each product's summary briefly. */
export function createJudgemeService(): ReviewsService {
  const cache = new Map<string, { value: ReviewSummaryDto; expires: number }>();

  return {
    async getSummary(handle) {
      const hit = cache.get(handle);
      if (hit && hit.expires > Date.now()) return hit.value;

      const product = await getJson<{ product: { id: number } }>('/products/-1', { handle });
      const reviews = product
        ? ((await getJson<{ reviews: JudgemeReview[] }>('/reviews', { product_id: String(product.product.id), per_page: '100' }))
            ?.reviews ?? [])
        : [];
      const value = summarizeReviews(reviews);
      if (cache.size >= MAX_CACHED_PRODUCTS) cache.delete(cache.keys().next().value!);
      cache.set(handle, { value, expires: Date.now() + CACHE_TTL_MS });
      return value;
    },

    async submit(review) {
      const response = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_token: token(),
          shop_domain: env.SHOPIFY_STORE_DOMAIN,
          platform: 'shopify',
          id: Number(numericId(review.productId)),
          name: review.name,
          email: review.email,
          rating: review.rating,
          title: review.title,
          body: review.body,
        }),
      });
      if (!response.ok) throw new Error(`Judge.me create review HTTP ${response.status}`);
      // A new review usually needs moderation, but drop the cache so an auto-published one appears.
      cache.delete(review.handle);
    },
  };
}
