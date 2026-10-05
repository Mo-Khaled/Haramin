import { usePage, usePolicies } from '@/features/catalog/hooks';
import type { Policy } from '@/lib/shopify/types';

export type PolicyKey = 'shippingPolicy' | 'refundPolicy' | 'privacyPolicy';

export const POLICY_KEYS: { key: PolicyKey; label: string }[] = [
  { key: 'shippingPolicy', label: 'policies.shipping' },
  { key: 'refundPolicy', label: 'policies.refund' },
  { key: 'privacyPolicy', label: 'policies.privacy' },
];

/**
 * The store keeps delivery and returns as website pages (its Shopify shipping/refund policies are
 * empty), while privacy lives in Shopify's policy settings. This hides that split from screens.
 */
export const POLICY_PAGES: Record<Exclude<PolicyKey, 'privacyPolicy'>, string> = {
  shippingPolicy: 'delivery-policy',
  refundPolicy: 'returns-exchange-policy',
};

export function usePolicyDocument(key: PolicyKey) {
  const page = usePage(key === 'privacyPolicy' ? '' : POLICY_PAGES[key]);
  const policies = usePolicies();
  const source = key === 'privacyPolicy' ? policies : page;
  const data: Policy | null = key === 'privacyPolicy' ? (policies.data?.privacyPolicy ?? null) : (page.data ?? null);
  return { data, isLoading: source.isLoading, isError: source.isError, refetch: source.refetch };
}
