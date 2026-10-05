export const env = {
  shopDomain: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN ?? 'haramaineg.com',
  shopId: process.env.EXPO_PUBLIC_SHOPIFY_SHOP_ID ?? '59682848873',
  customerClientId: process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID ?? '',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  whatsappNumber: process.env.EXPO_PUBLIC_WHATSAPP_NUMBER ?? '',
  freeShippingThreshold: 2500,
  /** Bosta flat rate shown on the product page; confirm with the store before launch. */
  shippingFee: 90,
  deliveryDays: '2–3',
} as const;
