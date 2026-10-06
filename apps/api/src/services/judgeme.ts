import type { CreateReviewDto, ReviewSummaryDto } from '@haramain/shared';

import { summarizeReviews, type JudgemeReview } from '../domain/reviews.js';
import { env } from '../lib/env.js';
import { numericId } from '../lib/hmac.js';

const BASE_URL = 'https://judge.me/api/v1';
const CACHE_TTL_MS = 10 * 60_000;
/** Handles come from clients, so the cache is bounded; Map keeps insertion order, so the first key is the oldest. */
const MAX_CACHED_PRODUCTS = 500;
/** Unknown handles are remembered briefly (and separately) so junk handles cannot evict real products or repeat upstream calls. */
const MISSING_TTL_MS = 2 * 60_000;
const FETCH_TIMEOUT_MS = 8_000;

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
  const response = await fetchJudgeme(`${BASE_URL}${path}?${query}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new ReviewsUnavailableError(`Judge.me ${path} HTTP ${response.status}`);
  return (await response.json()) as T;
}

/** Upstream failures and timeouts are an availability problem, not a server bug, so they map to ReviewsUnavailableError. */
async function fetchJudgeme(url: string, init: RequestInit = {}): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    throw new ReviewsUnavailableError('Judge.me request failed or timed out');
  }
}

function remember<T>(store: Map<string, T>, key: string, value: T): void {
  if (store.size >= MAX_CACHED_PRODUCTS) store.delete(store.keys().next().value!);
  store.set(key, value);
}

/** Reads reviews through Judge.me's private API, caching each product's summary briefly. */
export function createJudgemeService(): ReviewsService {
  const cache = new Map<string, { value: ReviewSummaryDto; expires: number }>();
  const missing = new Map<string, number>();
  const inflight = new Map<string, Promise<ReviewSummaryDto>>();

  async function load(handle: string): Promise<ReviewSummaryDto> {
    const product = await getJson<{ product: { id: number } }>('/products/-1', { handle });
    if (!product) {
      remember(missing, handle, Date.now() + MISSING_TTL_MS);
      return summarizeReviews([]);
    }
    const reviews = await getJson<{ reviews: JudgemeReview[] }>('/reviews', { product_id: String(product.product.id), per_page: '100' });
    const value = summarizeReviews(reviews?.reviews ?? []);
    remember(cache, handle, { value, expires: Date.now() + CACHE_TTL_MS });
    return value;
  }

  return {
    async getSummary(handle) {
      const hit = cache.get(handle);
      if (hit && hit.expires > Date.now()) return hit.value;
      if ((missing.get(handle) ?? 0) > Date.now()) return summarizeReviews([]);

      // Concurrent requests for the same handle share one upstream lookup.
      const pending = inflight.get(handle) ?? load(handle).finally(() => inflight.delete(handle));
      inflight.set(handle, pending);
      return pending;
    },

    async submit(review) {
      const response = await fetchJudgeme(`${BASE_URL}/reviews`, {
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
      if (!response.ok) throw new ReviewsUnavailableError(`Judge.me create review HTTP ${response.status}`);
      // A new review usually needs moderation, but drop the cache so an auto-published one appears.
      cache.delete(review.handle);
      missing.delete(review.handle);
    },
  };
}
