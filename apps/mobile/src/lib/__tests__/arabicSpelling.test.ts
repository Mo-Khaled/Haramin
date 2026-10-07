import { describe, expect, it } from 'vitest';

import { spellingVariants } from '../arabicSpelling';

describe('spellingVariants', () => {
  it('offers the final ه spelling for a word typed with ة, and the reverse', () => {
    expect(spellingVariants('قصيدة')).toEqual(['قصيدة', 'قصيده']);
    expect(spellingVariants('قصيده')).toEqual(['قصيده', 'قصيدة']);
  });

  it('drops hamza from alef and normalises final ى, leaving letters inside words alone', () => {
    expect(spellingVariants('أسد')).toEqual(['أسد', 'اسد']);
    expect(spellingVariants('ليلى')).toEqual(['ليلى', 'ليلي']);
    expect(spellingVariants('مهر')).toEqual(['مهر']);
  });

  it('returns Latin queries unchanged', () => {
    expect(spellingVariants('qasida')).toEqual(['qasida']);
  });
});
