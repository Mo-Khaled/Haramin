import { describe, expect, it } from 'vitest';

import { selectableOptions } from '../shopify/options';

describe('selectableOptions', () => {
  it('hides the default-variant option whatever language its name is in', () => {
    expect(selectableOptions([{ name: 'Title', values: ['Default Title'] }])).toEqual([]);
    expect(selectableOptions([{ name: 'العنوان', values: ['Default Title'] }])).toEqual([]);
  });

  it('keeps options that offer a choice, and drops single-value ones next to them', () => {
    const size = { name: 'Size', values: ['50 ml', '100 ml'] };
    expect(selectableOptions([size, { name: 'Edition', values: ['Standard'] }])).toEqual([size]);
  });
});
