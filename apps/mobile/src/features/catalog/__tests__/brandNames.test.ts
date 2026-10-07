import { describe, expect, it } from 'vitest';

import { brandKey, localizedBrandName } from '../brandNames';

describe('brandKey', () => {
  it('unifies the spellings stores use for one brand', () => {
    const keys = ['AFNAN', 'Afnan', 'AFNAN PERFUMES', 'afnan-perfumes'].map(brandKey);
    expect(new Set(keys)).toEqual(new Set(['afnan']));
  });
});

describe('localizedBrandName', () => {
  it('Arabizes known brands in Arabic only', () => {
    expect(localizedBrandName('KHADLAJ', 'ar')).toBe('خدلج');
    expect(localizedBrandName('Khadlaj Perfumes', 'ar')).toBe('خدلج');
    expect(localizedBrandName('KHADLAJ', 'en')).toBe('KHADLAJ');
  });

  it('keeps multi-word brands distinct and falls back to the original for unknown ones', () => {
    expect(localizedBrandName('LATTAFA PRIDE', 'ar')).toBe('لطافة برايد');
    expect(localizedBrandName('LATTAFA', 'ar')).toBe('لطافة');
    expect(localizedBrandName('Some New Brand', 'ar')).toBe('Some New Brand');
  });
});
