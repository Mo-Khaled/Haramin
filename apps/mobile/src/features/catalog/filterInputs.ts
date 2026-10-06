export interface PriceBand {
  min: number;
  max: number | null;
}

/**
 * Selected filters. `values` holds the Storefront `input` JSON of each ticked value, keyed by filter id, so
 * every list filter the store enables in Shopify (brand, size, notes...) works without app changes.
 */
export interface ActiveFilters {
  values: Record<string, string[]>;
  priceBand: PriceBand | null;
}

export const NO_FILTERS: ActiveFilters = { values: {}, priceBand: null };

export const PRICE_BANDS: PriceBand[] = [
  { min: 0, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: null },
];

export function isSelected(filters: ActiveFilters, filterId: string, input: string): boolean {
  return filters.values[filterId]?.includes(input) ?? false;
}

export function toggleValue(filters: ActiveFilters, filterId: string, input: string): ActiveFilters {
  const current = filters.values[filterId] ?? [];
  const next = current.includes(input) ? current.filter((value) => value !== input) : [...current, input];
  return { ...filters, values: { ...filters.values, [filterId]: next } };
}

/** Converts UI filter state to the JSON inputs the Storefront API expects. */
export function toFilterInputs(filters: ActiveFilters): string[] {
  const inputs = Object.values(filters.values).flat();
  if (filters.priceBand) {
    const { min, max } = filters.priceBand;
    inputs.push(JSON.stringify({ price: max === null ? { min } : { min, max } }));
  }
  return inputs;
}

export function countActive(filters: ActiveFilters): number {
  return Object.values(filters.values).flat().length + Number(filters.priceBand !== null);
}
