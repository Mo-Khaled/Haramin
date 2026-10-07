import { describe, expect, it } from 'vitest';

import { visibleFilterValues } from '../filterInputs';

const value = (label: string, count: number) => ({ id: `${label}-${count}`, label, count, input: `{"v":"${label}-${count}"}` });

describe('visibleFilterValues', () => {
  it('hides untranslated leftovers once the list has Arabic options', () => {
    const labels = visibleFilterValues([value('Perfume', 13), value('عطر', 15), value('معطرات المنزل', 7)]).map((v) => v.label);
    expect(labels).toEqual(['عطر', 'معطرات المنزل']);
  });

  it('keeps the option covering the most products when two share a label', () => {
    const kept = visibleFilterValues([value('للرجال', 86), value('للرجال', 3), value(' للنساء', 16)]);
    expect(kept.map((v) => v.count)).toEqual([86, 16]);
  });

  it('leaves all-Latin lists such as brands untouched', () => {
    const brands = [value('AFNAN', 9), value('KHADLAJ', 6)];
    expect(visibleFilterValues(brands)).toEqual(brands);
  });
});
