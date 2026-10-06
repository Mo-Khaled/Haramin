export const env = {
  shopDomain: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN ?? 'haramaineg.com',
  shopId: process.env.EXPO_PUBLIC_SHOPIFY_SHOP_ID ?? '59682848873',
  customerClientId: process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID ?? '',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  freeShippingThreshold: 2500,
  /** Matches Shopify shipping rates: Bosta 90 EGP everywhere (1–2 days locally, 2–3 elsewhere); Uber same-day 200 EGP in two governorates. */
  shippingFee: 90,
  sameDayFee: 200,
  deliveryDays: '1–3',
} as const;
