export type Gender = 'women' | 'men' | 'unisex';

export interface BestFor {
  occasions: string[];
  seasons: string[];
  times: string[];
  gender: Gender | null;
}

const GENDER_TAGS: Record<string, Gender> = {
  'pour femme': 'women',
  women: 'women',
  'pour homme': 'men',
  men: 'men',
  unisex: 'unisex',
};

function valuesWithPrefix(tags: string[], prefix: string): string[] {
  const values = tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.startsWith(`${prefix}-`))
    .map((tag) => tag.slice(prefix.length + 1));
  return [...new Set(values)];
}

/**
 * Reads the store's structured tags (`occasion-daily`, `season-winter`, `time-evening`, plus gender
 * tags such as "Pour Femme") into the facts shown as "Best for" chips. Unknown tags are ignored.
 */
export function parseBestFor(tags: string[]): BestFor {
  const genders = [...new Set(tags.map((tag) => GENDER_TAGS[tag.trim().toLowerCase()]).filter(Boolean))];
  return {
    occasions: valuesWithPrefix(tags, 'occasion'),
    seasons: valuesWithPrefix(tags, 'season'),
    times: valuesWithPrefix(tags, 'time'),
    // Conflicting gender tags (e.g. both "men" and "women") mean the scent is shared.
    gender: genders.length === 1 ? genders[0] : genders.length > 1 ? 'unisex' : null,
  };
}

export function hasBestFor(bestFor: BestFor): boolean {
  return bestFor.occasions.length + bestFor.seasons.length + bestFor.times.length > 0 || bestFor.gender !== null;
}
