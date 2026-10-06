import { usePage, usePolicies } from '@/features/catalog/hooks';
import type { Policy } from '@/lib/shopify/types';

export type PolicyKey = 'shippingPolicy' | 'refundPolicy' | 'privacyPolicy' | 'termsOfService';

export const POLICY_KEYS: { key: PolicyKey; label: string }[] = [
  { key: 'shippingPolicy', label: 'policies.shipping' },
  { key: 'refundPolicy', label: 'policies.refund' },
  { key: 'privacyPolicy', label: 'policies.privacy' },
  { key: 'termsOfService', label: 'policies.terms' },
];

export function isPolicyKey(value: unknown): value is PolicyKey {
  return POLICY_KEYS.some((k) => k.key === value);
}

/**
 * The store keeps delivery and returns as website pages (its Shopify shipping/refund policies are
 * empty), while privacy and terms live in Shopify's policy settings. This hides that split from screens.
 */
export const POLICY_PAGES = {
  shippingPolicy: 'delivery-policy',
  refundPolicy: 'returns-exchange-policy',
} as const satisfies Partial<Record<PolicyKey, string>>;

function pageHandleFor(key: PolicyKey): string | undefined {
  return key in POLICY_PAGES ? POLICY_PAGES[key as keyof typeof POLICY_PAGES] : undefined;
}

export function usePolicyDocument(key: PolicyKey) {
  const pageHandle = pageHandleFor(key);
  const page = usePage(pageHandle ?? '');
  const policies = usePolicies();
  const source = pageHandle ? page : policies;
  const data: Policy | null = pageHandle ? (page.data ?? null) : (policies.data?.[key] ?? null);
  return { data, isLoading: source.isLoading, isError: source.isError, refetch: source.refetch };
}

/** Documents worth listing: the website pages always, Shopify policies only once the store has written them. */
export function useAvailablePolicies(): typeof POLICY_KEYS {
  const policies = usePolicies();
  return POLICY_KEYS.filter(({ key }) => pageHandleFor(key) || policies.data?.[key]?.body);
}
