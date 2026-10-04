export function minVariantPrice(variants: { price: string }[]): number | null {
  const prices = variants.map((v) => parseFloat(v.price)).filter((p) => Number.isFinite(p));
  return prices.length ? Math.min(...prices) : null;
}

/** A drop counts when the new price is at least `thresholdPercent` below the previously recorded one. */
export function isPriceDrop(previous: number, current: number, thresholdPercent = 5): boolean {
  if (previous <= 0 || current >= previous) return false;
  return ((previous - current) / previous) * 100 >= thresholdPercent;
}
