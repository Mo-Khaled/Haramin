import { describe, expect, it } from 'vitest';

import { logicalIndex } from '../direction';

describe('logicalIndex', () => {
  it('keeps the view index in a left-to-right list', () => {
    expect(logicalIndex(0, 4, false)).toBe(0);
    expect(logicalIndex(3, 4, false)).toBe(3);
  });

  it('counts from the far end of a reversed list', () => {
    expect(logicalIndex(3, 4, true)).toBe(0);
    expect(logicalIndex(0, 4, true)).toBe(3);
  });
});
