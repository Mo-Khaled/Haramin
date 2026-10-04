import i18n from '@/i18n';

const DOMAIN = process.env.EXPO_PUBLIC_SHOPIFY_DOMAIN ?? 'haramaineg.com';
const API_VERSION = '2025-07';
const TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

export const SHOP_URL = `https://${DOMAIN}`;

export class ShopifyError extends Error {}

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export type StorefrontLanguage = 'AR' | 'EN';

export function currentLanguage(): StorefrontLanguage {
  return i18n.language === 'ar' ? 'AR' : 'EN';
}

export async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${SHOP_URL}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { 'X-Shopify-Storefront-Access-Token': TOKEN } : {}),
    },
    body: JSON.stringify({ query, variables: { language: currentLanguage(), ...variables } }),
  });
  if (!response.ok) throw new ShopifyError(`Storefront HTTP ${response.status}`);
  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors?.length) throw new ShopifyError(json.errors.map((e) => e.message).join('; '));
  if (!json.data) throw new ShopifyError('Empty Storefront response');
  return json.data;
}
