import { describe, expect, it } from 'vitest';

import { toFilterInputs } from '../../features/catalog/filterInputs';
import { discountPercent, formatMoney } from '../format';
import { htmlToText } from '../html';

describe('formatMoney', () => {
  it('groups thousands and appends the currency', () => {
    expect(formatMoney('1250.0', 'en')).toBe('1,250 EGP');
    expect(formatMoney(2500, 'en')).toBe('2,500 EGP');
    expect(formatMoney('99.5', 'en')).toBe('99.50 EGP');
  });

  it('uses the Arabic currency suffix in Arabic', () => {
    expect(formatMoney(300, 'ar')).toBe('300 ج.م');
  });
});

describe('discountPercent', () => {
  it('computes the rounded discount', () => {
    expect(discountPercent('950', '1050')).toBe(10);
  });

  it('returns null without a higher compare-at price', () => {
    expect(discountPercent('950', null)).toBeNull();
    expect(discountPercent('950', '950')).toBeNull();
    expect(discountPercent('950', '900')).toBeNull();
  });
});

describe('htmlToText', () => {
  it('strips tags, keeps paragraph breaks and decodes entities', () => {
    expect(htmlToText('<p>Rich &amp; warm</p><p>Oud<br>Musk</p>')).toBe('Rich & warm\nOud\nMusk');
  });

  it('turns list items into bullets', () => {
    expect(htmlToText('<ul><li>One</li><li>Two</li></ul>')).toBe('• One\n• Two');
  });
});

describe('toFilterInputs', () => {
  it('encodes stock and open-ended price filters for the Storefront API', () => {
    const inputs = toFilterInputs({ inStock: true, priceBand: { min: 2000, max: null } });
    expect(inputs.map((i) => JSON.parse(i))).toEqual([{ available: true }, { price: { min: 2000 } }]);
  });

  it('returns nothing when no filters are active', () => {
    expect(toFilterInputs({ inStock: false, priceBand: null })).toEqual([]);
  });
});
