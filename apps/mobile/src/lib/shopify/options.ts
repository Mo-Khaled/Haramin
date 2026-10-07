import type { ProductOption } from './types';

/**
 * Options a customer can actually choose between. Shopify models a product with no variants as a single option
 * ("Title" / "Default Title"), and returns that option's name in the request language, so it cannot be detected
 * by name. An option with a single value offers no choice in any language.
 */
export function selectableOptions(options: ProductOption[]): ProductOption[] {
  return options.filter((option) => option.values.length > 1);
}
