import { describe, expect, it } from 'vitest';

import { hasScentNotes, toScentNotes } from '../shopify/scentNotes';

describe('toScentNotes', () => {
  it('groups note metafields into tiers in their numbered order, skipping missing and blank ones', () => {
    const notes = toScentNotes([
      { key: 'top_notes_2', value: 'Cinnamon' },
      { key: 'top_notes_1', value: 'Bergamot' },
      null,
      { key: 'heart_notes_1', value: ' Amber ' },
      { key: 'base_notes_1', value: '' },
      { key: 'base_notes_2', value: 'Vanilla' },
    ]);
    expect(notes).toEqual({ top: ['Bergamot', 'Cinnamon'], heart: ['Amber'], base: ['Vanilla'] });
    expect(hasScentNotes(notes)).toBe(true);
  });

  it('reports no notes when every metafield is missing', () => {
    expect(hasScentNotes(toScentNotes([null, null]))).toBe(false);
  });
});
