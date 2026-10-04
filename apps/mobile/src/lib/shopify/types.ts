export interface Money {
  amount: string;
  currencyCode: string;
}

export interface ShopImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface ProductCard {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: ShopImage | null;
  price: Money;
  compareAtPrice: Money | null;
  firstVariantId: string | null;
}

export interface SelectedOption {
  name: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: Money;
  compareAtPrice: Money | null;
  selectedOptions: SelectedOption[];
  image: ShopImage | null;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductDetail extends ProductCard {
  descriptionHtml: string;
  description: string;
  tags: string[];
  images: ShopImage[];
  options: ProductOption[];
  variants: ProductVariant[];
}

export interface FilterValue {
  id: string;
  label: string;
  count: number;
  input: string;
}

export interface ProductFilter {
  id: string;
  label: string;
  type: string;
  values: FilterValue[];
}

export interface ProductPage {
  products: ProductCard[];
  filters: ProductFilter[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export type SortKey = 'FEATURED' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST' | 'BEST_SELLING';

export interface CollectionSummary {
  id: string;
  handle: string;
  title: string;
  image: ShopImage | null;
}

export interface MenuItem {
  title: string;
  url: string;
}

export interface CartLine {
  id: string;
  quantity: number;
  total: Money;
  variantId: string;
  variantTitle: string;
  productTitle: string;
  productHandle: string;
  vendor: string;
  unitPrice: Money;
  compareAtUnitPrice: Money | null;
  image: ShopImage | null;
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  subtotal: Money;
  total: Money;
  discountCodes: { code: string; applicable: boolean }[];
  lines: CartLine[];
}

export interface Policy {
  title: string;
  body: string;
}
