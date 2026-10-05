export const env = {
  shopDomain: process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN ?? 'haramaineg.com',
  shopId: process.env.EXPO_PUBLIC_SHOPIFY_SHOP_ID ?? '59682848873',
  customerClientId: process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_CLIENT_ID ?? '',
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
  freeShippingThreshold: 2500,
  /** Standard Bosta fee as charged at checkout (the website's delivery page still says 80 EGP). */
  shippingFee: 90,
  sameDayFee: 200,
  deliveryDays: '2–5',
} as const;
