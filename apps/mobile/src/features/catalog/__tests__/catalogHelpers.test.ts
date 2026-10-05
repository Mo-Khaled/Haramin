import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({ default: { getItem: vi.fn(), setItem: vi.fn() } }));

import { findBrandHandle, slugify } from '../brandMatch';
import { hasBestFor, parseBestFor } from '../productTags';
import { withRecent } from '../recentlyViewed';

describe('parseBestFor', () => {
  it('reads occasion, season, time and gender tags from real store tags', () => {
    const result = parseBestFor(['BIANCO LATTE', 'occasion-daily', 'Pour Femme', 'season-winter', 'time-anytime']);
    expect(result).toEqual({ occasions: ['daily'], seasons: ['winter'], times: ['anytime'], gender: 'women' });
  });

  it('handles multi-word values and duplicate casing', () => {
    const result = parseBestFor(['season-all-season', 'Season-All-Season', 'occasion-formal', 'occasion-outing']);
    expect(result.seasons).toEqual(['all-season']);
    expect(result.occasions).toEqual(['formal', 'outing']);
  });

  it('treats conflicting gender tags as unisex', () => {
    expect(parseBestFor(['men', 'women']).gender).toBe('unisex');
    expect(parseBestFor(['Pour Homme', 'men']).gender).toBe('men');
  });

  it('reports when there is nothing to show', () => {
    expect(hasBestFor(parseBestFor(['best-seller2026', 'LE MALE']))).toBe(false);
    expect(hasBestFor(parseBestFor(['unisex']))).toBe(true);
  });
});

describe('withRecent', () => {
  it('puts the latest view first without duplicates', () => {
    expect(withRecent(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    expect(withRecent([], 'a')).toEqual(['a']);
  });

  it('caps the list length', () => {
    expect(withRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b']);
  });
});

describe('findBrandHandle', () => {
  const handles = ['afnan-perfumes', 'khadlaj-perfumes', 'lattafa', 'lattafa-pride', 'le-bonheur'];

  it('prefers an exact handle, then a prefixed one', () => {
    expect(findBrandHandle('LATTAFA', handles)).toBe('lattafa');
    expect(findBrandHandle('KHADLAJ', handles)).toBe('khadlaj-perfumes');
    expect(findBrandHandle('Le Bonheur', handles)).toBe('le-bonheur');
  });

  it('returns null when no brand matches', () => {
    expect(findBrandHandle('Unknown House', handles)).toBeNull();
    expect(findBrandHandle('', handles)).toBeNull();
    expect(slugify('  ')).toBe('');
  });
});
