import { ShopifyError, storefront } from './client';
import * as Q from './queries';
import type {
  Cart,
  CartLine,
  CollectionDetail,
  CollectionSummary,
  MenuItem,
  Money,
  Policy,
  ProductCard,
  ProductDetail,
  ProductFilter,
  ProductPage,
  ShopImage,
  SortKey,
} from './types';

interface RawProductCard {
  id: string;
  handle: string;
  title: string;
  vendor: string;
  availableForSale: boolean;
  featuredImage: ShopImage | null;
  priceRange: { minVariantPrice: Money };
  compareAtPriceRange: { minVariantPrice: Money };
  firstVariants: { nodes: { id: string }[] };
}

function mapCard(raw: RawProductCard): ProductCard {
  const compareAt = raw.compareAtPriceRange.minVariantPrice;
  const price = raw.priceRange.minVariantPrice;
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    vendor: raw.vendor,
    availableForSale: raw.availableForSale,
    featuredImage: raw.featuredImage,
    price,
    compareAtPrice: parseFloat(compareAt.amount) > parseFloat(price.amount) ? compareAt : null,
    firstVariantId: raw.firstVariants.nodes[0]?.id ?? null,
  };
}

const SORTS: Record<SortKey, { sortKey: string; reverse: boolean }> = {
  FEATURED: { sortKey: 'COLLECTION_DEFAULT', reverse: false },
  BEST_SELLING: { sortKey: 'BEST_SELLING', reverse: false },
  NEWEST: { sortKey: 'CREATED', reverse: true },
  PRICE_ASC: { sortKey: 'PRICE', reverse: false },
  PRICE_DESC: { sortKey: 'PRICE', reverse: true },
};

export interface CollectionQuery {
  handle: string;
  sort: SortKey;
  filterInputs: string[];
  after?: string | null;
  first?: number;
}

export async function fetchCollectionProducts(params: CollectionQuery): Promise<ProductPage> {
  const { sortKey, reverse } = SORTS[params.sort];
  const data = await storefront<{
    collection: {
      products: {
        filters: ProductFilter[];
        nodes: RawProductCard[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    } | null;
  }>(Q.COLLECTION_PRODUCTS, {
    handle: params.handle,
    first: params.first ?? 20,
    after: params.after ?? null,
    sortKey,
    reverse,
    filters: params.filterInputs.map((input) => JSON.parse(input) as unknown),
  });
  if (!data.collection) return { products: [], filters: [], hasNextPage: false, endCursor: null };
  const { products } = data.collection;
  return {
    products: products.nodes.map(mapCard),
    filters: products.filters,
    hasNextPage: products.pageInfo.hasNextPage,
    endCursor: products.pageInfo.endCursor,
  };
}

export async function searchProducts(query: string, after?: string | null): Promise<ProductPage> {
  const data = await storefront<{
    search: { nodes: RawProductCard[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
  }>(Q.SEARCH_PRODUCTS, { query, first: 20, after: after ?? null });
  return {
    products: data.search.nodes.map(mapCard),
    filters: [],
    hasNextPage: data.search.pageInfo.hasNextPage,
    endCursor: data.search.pageInfo.endCursor,
  };
}

export async function fetchProductsByIds(ids: string[]): Promise<ProductCard[]> {
  if (ids.length === 0) return [];
  const data = await storefront<{ nodes: (RawProductCard | null)[] }>(Q.PRODUCTS_BY_IDS, { ids });
  return data.nodes.filter((n): n is RawProductCard => !!n && !!n.id).map(mapCard);
}

export async function fetchRecommendations(productId: string): Promise<ProductCard[]> {
  const data = await storefront<{ productRecommendations: RawProductCard[] | null }>(Q.PRODUCT_RECOMMENDATIONS, {
    productId,
  });
  return (data.productRecommendations ?? []).map(mapCard);
}

export interface SearchSuggestions {
  queries: string[];
  collections: { handle: string; title: string }[];
}

export async function fetchSearchSuggestions(query: string): Promise<SearchSuggestions> {
  const data = await storefront<{
    predictiveSearch: { queries: { text: string }[]; collections: { handle: string; title: string }[] } | null;
  }>(Q.PREDICTIVE_SEARCH, { query });
  return {
    queries: (data.predictiveSearch?.queries ?? []).map((q) => q.text),
    collections: data.predictiveSearch?.collections ?? [],
  };
}

export async function fetchProduct(handle: string): Promise<ProductDetail | null> {
  const data = await storefront<{
    product: (RawProductCard & {
      productType: string;
      description: string;
      descriptionHtml: string;
      tags: string[];
      images: { nodes: ShopImage[] };
      options: { name: string; values: string[] }[];
      variants: { nodes: ProductDetail['variants'] };
    }) | null;
  }>(Q.PRODUCT_DETAIL, { handle });
  const raw = data.product;
  if (!raw) return null;
  return {
    ...mapCard(raw),
    productType: raw.productType,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    tags: raw.tags,
    images: raw.images.nodes,
    options: raw.options.filter((o) => !(o.name === 'Title' && o.values[0] === 'Default Title')),
    variants: raw.variants.nodes.map((v) => ({
      ...v,
      compareAtPrice:
        v.compareAtPrice && parseFloat(v.compareAtPrice.amount) > parseFloat(v.price.amount) ? v.compareAtPrice : null,
    })),
  };
}

export async function fetchCollections(first = 100): Promise<CollectionSummary[]> {
  const data = await storefront<{ collections: { nodes: CollectionSummary[] } }>(Q.COLLECTIONS, { first });
  return data.collections.nodes;
}

export async function fetchCollection(handle: string): Promise<CollectionDetail | null> {
  const data = await storefront<{ collection: CollectionDetail | null }>(Q.COLLECTION_BY_HANDLE, { handle });
  return data.collection;
}

export async function fetchMenu(handle: string): Promise<{ title: string; url: string; items: MenuItem[] }[]> {
  const data = await storefront<{ menu: { items: { title: string; url: string; items: MenuItem[] }[] } | null }>(
    Q.MENU,
    { handle },
  );
  return data.menu?.items ?? [];
}

export function handleFromUrl(url: string): string | null {
  const match = url.match(/\/collections\/([^/?#]+)/);
  return match ? match[1] : null;
}

export async function fetchPage(handle: string): Promise<Policy | null> {
  const data = await storefront<{ page: Policy | null }>(Q.PAGE, { handle });
  return data.page?.body ? data.page : null;
}

export async function fetchPolicies(): Promise<Record<string, Policy | null>> {
  const data = await storefront<{ shop: Record<string, Policy | null> }>(Q.POLICIES);
  return data.shop;
}

/* ---------- Cart ---------- */

interface RawCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money; totalAmount: Money };
  discountCodes: { code: string; applicable: boolean }[];
  lines: {
    nodes: {
      id: string;
      quantity: number;
      cost: { totalAmount: Money };
      merchandise: {
        id: string;
        title: string;
        price: Money;
        compareAtPrice: Money | null;
        image: ShopImage | null;
        product: { title: string; handle: string; vendor: string; featuredImage: ShopImage | null };
      };
    }[];
  };
}

function mapCart(raw: RawCart): Cart {
  const lines: CartLine[] = raw.lines.nodes.map((l) => ({
    id: l.id,
    quantity: l.quantity,
    total: l.cost.totalAmount,
    variantId: l.merchandise.id,
    variantTitle: l.merchandise.title,
    productTitle: l.merchandise.product.title,
    productHandle: l.merchandise.product.handle,
    vendor: l.merchandise.product.vendor,
    unitPrice: l.merchandise.price,
    compareAtUnitPrice: l.merchandise.compareAtPrice,
    image: l.merchandise.image ?? l.merchandise.product.featuredImage,
  }));
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    subtotal: raw.cost.subtotalAmount,
    total: raw.cost.totalAmount,
    discountCodes: raw.discountCodes,
    lines,
  };
}

function unwrap(result: { cart: RawCart | null; userErrors: { message: string }[] }): Cart {
  if (result.userErrors.length) throw new ShopifyError(result.userErrors.map((e) => e.message).join('; '));
  if (!result.cart) throw new ShopifyError('Cart unavailable');
  return mapCart(result.cart);
}

export async function getCart(id: string): Promise<Cart | null> {
  const data = await storefront<{ cart: RawCart | null }>(Q.CART_GET, { id });
  return data.cart ? mapCart(data.cart) : null;
}

export async function createCart(variantId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartCreate: Parameters<typeof unwrap>[0] }>(Q.CART_CREATE, {
    lines: [{ merchandiseId: variantId, quantity }],
  });
  return unwrap(data.cartCreate);
}

export async function addCartLine(cartId: string, variantId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartLinesAdd: Parameters<typeof unwrap>[0] }>(Q.CART_LINES_ADD, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });
  return unwrap(data.cartLinesAdd);
}

export async function updateCartLine(cartId: string, lineId: string, quantity: number): Promise<Cart> {
  const data = await storefront<{ cartLinesUpdate: Parameters<typeof unwrap>[0] }>(Q.CART_LINES_UPDATE, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });
  return unwrap(data.cartLinesUpdate);
}

export async function removeCartLine(cartId: string, lineId: string): Promise<Cart> {
  const data = await storefront<{ cartLinesRemove: Parameters<typeof unwrap>[0] }>(Q.CART_LINES_REMOVE, {
    cartId,
    lineIds: [lineId],
  });
  return unwrap(data.cartLinesRemove);
}

export async function setCartDiscountCodes(cartId: string, codes: string[]): Promise<Cart> {
  const data = await storefront<{ cartDiscountCodesUpdate: Parameters<typeof unwrap>[0] }>(Q.CART_DISCOUNT_UPDATE, {
    cartId,
    codes,
  });
  return unwrap(data.cartDiscountCodesUpdate);
}
