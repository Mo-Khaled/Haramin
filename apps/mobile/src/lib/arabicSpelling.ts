/**
 * Arabic words are commonly typed several ways: a final ة or ه, a final ى or ي, and alef with or without
 * hamza (أ إ آ ا). Store search matches the spelling the catalogue uses, so "قصيدة" finds nothing when the
 * catalogue says "قصيده". Returns the typed query first, then the other spellings worth retrying, without duplicates.
 */
export function spellingVariants(query: string): string[] {
  const plain = query.replace(/[أإآ]/g, 'ا').replace(/ى(?=\s|$)/g, 'ي');
  const withHa = plain.replace(/ة(?=\s|$)/g, 'ه');
  const withTaMarbuta = plain.replace(/ه(?=\s|$)/g, 'ة');
  return [...new Set([query, withHa, withTaMarbuta])];
}
