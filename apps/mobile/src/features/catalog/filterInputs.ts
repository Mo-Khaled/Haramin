export interface ActiveFilters {
  inStock: boolean;
  priceBand: PriceBand | null;
}

export interface PriceBand {
  min: number;
  max: number | null;
}

export const NO_FILTERS: ActiveFilters = { inStock: false, priceBand: null };

export const PRICE_BANDS: PriceBand[] = [
  { min: 0, max: 500 },
  { min: 500, max: 1000 },
  { min: 1000, max: 2000 },
  { min: 2000, max: null },
];

/** Converts UI filter state to the JSON inputs the Storefront API expects. */
export function toFilterInputs(filters: ActiveFilters): string[] {
  const inputs: string[] = [];
  if (filters.inStock) inputs.push(JSON.stringify({ available: true }));
  if (filters.priceBand) {
    const { min, max } = filters.priceBand;
    inputs.push(JSON.stringify({ price: max === null ? { min } : { min, max } }));
  }
  return inputs;
}

export function countActive(filters: ActiveFilters): number {
  return Number(filters.inStock) + Number(filters.priceBand !== null);
}

