const IMAGE = `url altText width height`;
const MONEY = `amount currencyCode`;

export const PRODUCT_CARD_FRAGMENT = `
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    featuredImage { ${IMAGE} }
    priceRange { minVariantPrice { ${MONEY} } }
    compareAtPriceRange { minVariantPrice { ${MONEY} } }
    firstVariants: variants(first: 1) { nodes { id } }
  }
`;

export const COLLECTION_PRODUCTS = `
  ${PRODUCT_CARD_FRAGMENT}
  query CollectionProducts(
    $language: LanguageCode!, $handle: String!, $first: Int!, $after: String,
    $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $filters: [ProductFilter!]
  ) @inContext(language: $language, country: EG) {
    collection(handle: $handle) {
      products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
        filters { id label type values { id label count input } }
        nodes { ...ProductCard }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

export const SEARCH_PRODUCTS = `
  ${PRODUCT_CARD_FRAGMENT}
  query SearchProducts($language: LanguageCode!, $query: String!, $first: Int!, $after: String)
  @inContext(language: $language, country: EG) {
    search(query: $query, first: $first, after: $after, types: [PRODUCT]) {
      nodes { ...ProductCard }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export const PRODUCT_DETAIL = `
  ${PRODUCT_CARD_FRAGMENT}
  query ProductDetail($language: LanguageCode!, $handle: String!)
  @inContext(language: $language, country: EG) {
    product(handle: $handle) {
      ...ProductCard
      productType
      description
      descriptionHtml
      tags
      images(first: 10) { nodes { ${IMAGE} } }
      options { name values }
      variants(first: 50) {
        nodes {
          id
          title
          availableForSale
          price { ${MONEY} }
          compareAtPrice { ${MONEY} }
          selectedOptions { name value }
          image { ${IMAGE} }
        }
      }
    }
  }
`;

export const COLLECTIONS = `
  query Collections($language: LanguageCode!, $first: Int!) @inContext(language: $language, country: EG) {
    collections(first: $first, sortKey: TITLE) {
      nodes { id handle title image { ${IMAGE} } }
    }
  }
`;

export const COLLECTION_BY_HANDLE = `
  query CollectionByHandle($language: LanguageCode!, $handle: String!) @inContext(language: $language, country: EG) {
    collection(handle: $handle) { id handle title description image { ${IMAGE} } }
  }
`;

export const MENU = `
  query Menu($language: LanguageCode!, $handle: String!) @inContext(language: $language, country: EG) {
    menu(handle: $handle) { items { title url items { title url } } }
  }
`;

export const PRODUCTS_BY_IDS = `
  ${PRODUCT_CARD_FRAGMENT}
  query ProductsByIds($language: LanguageCode!, $ids: [ID!]!) @inContext(language: $language, country: EG) {
    nodes(ids: $ids) { ... on Product { ...ProductCard } }
  }
`;

export const PRODUCT_RECOMMENDATIONS = `
  ${PRODUCT_CARD_FRAGMENT}
  query ProductRecommendations($language: LanguageCode!, $productId: ID!) @inContext(language: $language, country: EG) {
    productRecommendations(productId: $productId, intent: RELATED) { ...ProductCard }
  }
`;

export const PREDICTIVE_SEARCH = `
  query PredictiveSearch($language: LanguageCode!, $query: String!) @inContext(language: $language, country: EG) {
    predictiveSearch(query: $query, limit: 6, types: [QUERY, COLLECTION]) {
      queries { text }
      collections { handle title }
    }
  }
`;

export const POLICIES = `
  query Policies($language: LanguageCode!) @inContext(language: $language, country: EG) {
    shop {
      privacyPolicy { title body }
      refundPolicy { title body }
      shippingPolicy { title body }
      termsOfService { title body }
    }
  }
`;

const CART_FRAGMENT = `
  fragment CartParts on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
    discountCodes { code applicable }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ${MONEY} } }
        merchandise {
          ... on ProductVariant {
            id
            title
            price { ${MONEY} }
            compareAtPrice { ${MONEY} }
            image { ${IMAGE} }
            product { title handle vendor featuredImage { ${IMAGE} } }
          }
        }
      }
    }
  }
`;

const CART_ERRORS = `userErrors { field message }`;

export const CART_GET = `
  ${CART_FRAGMENT}
  query CartGet($language: LanguageCode!, $id: ID!) @inContext(language: $language, country: EG) {
    cart(id: $id) { ...CartParts }
  }
`;

export const CART_CREATE = `
  ${CART_FRAGMENT}
  mutation CartCreate($language: LanguageCode!, $lines: [CartLineInput!]) @inContext(language: $language, country: EG) {
    cartCreate(input: { lines: $lines }) { cart { ...CartParts } ${CART_ERRORS} }
  }
`;

export const CART_LINES_ADD = `
  ${CART_FRAGMENT}
  mutation CartLinesAdd($language: LanguageCode!, $cartId: ID!, $lines: [CartLineInput!]!)
  @inContext(language: $language, country: EG) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartParts } ${CART_ERRORS} }
  }
`;

export const CART_LINES_UPDATE = `
  ${CART_FRAGMENT}
  mutation CartLinesUpdate($language: LanguageCode!, $cartId: ID!, $lines: [CartLineUpdateInput!]!)
  @inContext(language: $language, country: EG) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartParts } ${CART_ERRORS} }
  }
`;

export const CART_LINES_REMOVE = `
  ${CART_FRAGMENT}
  mutation CartLinesRemove($language: LanguageCode!, $cartId: ID!, $lineIds: [ID!]!)
  @inContext(language: $language, country: EG) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartParts } ${CART_ERRORS} }
  }
`;

export const CART_DISCOUNT_UPDATE = `
  ${CART_FRAGMENT}
  mutation CartDiscountUpdate($language: LanguageCode!, $cartId: ID!, $codes: [String!]!)
  @inContext(language: $language, country: EG) {
    cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $codes) { cart { ...CartParts } ${CART_ERRORS} }
  }
`;
