import { describe, expect, it } from 'vitest';

import { localizedNote } from '../noteNames';

describe('localizedNote', () => {
  it('translates known notes in Arabic regardless of case', () => {
    expect(localizedNote('Bergamot', 'ar')).toBe('البرغموت');
    expect(localizedNote('tonka bean', 'ar')).toBe('حبوب التونكا');
    expect(localizedNote(' Oud ', 'ar')).toBe('العود');
  });

  it('keeps an emoji prefix and leaves unknown notes alone', () => {
    expect(localizedNote('🍦 Vanilla', 'ar')).toBe('🍦 الفانيليا');
    expect(localizedNote('Mystery Accord X', 'ar')).toBe('Mystery Accord X');
  });

  it('leaves English and already-Arabic notes untouched', () => {
    expect(localizedNote('Bergamot', 'en')).toBe('Bergamot');
    expect(localizedNote('البرغموت', 'ar')).toBe('البرغموت');
  });
});
