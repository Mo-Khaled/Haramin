import { describe, expect, it } from 'vitest';

import { parseBanners, parsePromo, type MetaobjectNode } from '../homeMetaobjects';

const banner = (id: string, fields: Record<string, string | null>, image: string | null = 'https://cdn/b.png'): MetaobjectNode => ({
  id,
  fields: [
    { key: 'image', value: 'gid://shopify/MediaImage/1', reference: image ? { image: { url: image } } : null },
    ...Object.entries(fields).map(([key, value]) => ({ key, value })),
  ],
});

describe('parseBanners', () => {
  it('maps collection and store banners and orders them by position', () => {
    const result = parseBanners([
      banner('b', { link_type: 'stores', link_handle: null, label: 'Visit us', position: '2' }),
      banner('a', { link_type: 'collection', link_handle: 'faan', label: ' FAAN ', position: '1' }),
    ]);
    expect(result).toEqual([
      { id: 'a', image: 'https://cdn/b.png', target: { collection: 'faan' }, label: 'FAAN', position: 1 },
      { id: 'b', image: 'https://cdn/b.png', target: { route: '/stores' }, label: 'Visit us', position: 2 },
    ]);
  });

  it('skips entries without an image or with an unusable link', () => {
    const result = parseBanners([
      banner('no-image', { link_type: 'collection', link_handle: 'faan' }, null),
      banner('bad-type', { link_type: 'product', link_handle: 'x' }),
      banner('bad-handle', { link_type: 'collection', link_handle: 'Not A Handle' }),
      banner('no-handle', { link_type: 'collection', link_handle: null }),
    ]);
    expect(result).toEqual([]);
  });

  it('treats a missing or invalid position as zero', () => {
    const [entry] = parseBanners([banner('a', { link_type: 'stores', position: 'abc' })]);
    expect(entry.position).toBe(0);
  });
});

describe('parsePromo', () => {
  const promo = (fields: Record<string, string | null>): MetaobjectNode => ({
    id: 'p',
    fields: Object.entries(fields).map(([key, value]) => ({ key, value })),
  });

  it('returns the first active promo with a code and message', () => {
    expect(
      parsePromo([
        promo({ code: 'OLD', message: 'Old offer', active: 'false' }),
        promo({ code: ' APP10 ', message: '10% off your first order', active: 'true' }),
      ]),
    ).toEqual({ code: 'APP10', message: '10% off your first order' });
  });

  it('returns null when nothing is active or complete', () => {
    expect(parsePromo([promo({ code: 'X', message: '', active: 'true' })])).toBeNull();
    expect(parsePromo([])).toBeNull();
  });
});
