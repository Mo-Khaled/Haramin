import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/env.js', () => ({
  env: { JUDGEME_PRIVATE_TOKEN: 'dummy-token', SHOPIFY_STORE_DOMAIN: 'shop.example' },
}));

const { createJudgemeService, ReviewsUnavailableError } = await import('../services/judgeme.js');

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

afterEach(() => vi.unstubAllGlobals());

describe('judgeme service', () => {
  it('shares one upstream lookup between concurrent requests for the same handle', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/products/') ? json({ product: { id: 1 } }) : json({ reviews: [] }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const service = createJudgemeService();
    await Promise.all([service.getSummary('rose'), service.getSummary('rose'), service.getSummary('rose')]);
    expect(fetchMock).toHaveBeenCalledTimes(2); // one product lookup + one reviews fetch
    await service.getSummary('rose');
    expect(fetchMock).toHaveBeenCalledTimes(2); // cached
  });

  it('remembers unknown handles without evicting real products', async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (!url.includes('/products/')) return json({ reviews: [] });
      return url.includes('handle=real') ? json({ product: { id: 1 } }) : json({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);
    const service = createJudgemeService();
    await service.getSummary('real');
    for (let i = 0; i < 600; i++) await service.getSummary(`junk-${i}`);
    const before = fetchMock.mock.calls.length;
    await service.getSummary('real');
    await service.getSummary('junk-599');
    expect(fetchMock.mock.calls.length).toBe(before);
  });

  it('reports upstream failures and timeouts as unavailable, not as server errors', async () => {
    const service = createJudgemeService();
    vi.stubGlobal('fetch', vi.fn(async () => json({}, 429)));
    await expect(service.getSummary('rose')).rejects.toBeInstanceOf(ReviewsUnavailableError);
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new DOMException('timed out', 'TimeoutError'))));
    await expect(service.getSummary('lily')).rejects.toBeInstanceOf(ReviewsUnavailableError);
  });
});
