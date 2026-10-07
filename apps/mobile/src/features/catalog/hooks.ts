import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchCollection,
  fetchCollectionProducts,
  fetchCollections,
  fetchMenu,
  fetchPage,
  fetchPolicies,
  fetchProduct,
  fetchProductsByIds,
  fetchRecommendations,
  fetchSearchSuggestions,
  searchProducts,
} from '@/lib/shopify/api';
import { spellingVariants } from '@/lib/arabicSpelling';
import type { SortKey } from '@/lib/shopify/types';

const MINUTE = 60_000;

function useLanguage(): string {
  return useTranslation().i18n.language;
}

export function useCollectionProducts(handle: string, sort: SortKey, filterInputs: string[]) {
  const language = useLanguage();
  return useInfiniteQuery({
    queryKey: ['collection-products', language, handle, sort, filterInputs],
    queryFn: ({ pageParam }) => fetchCollectionProducts({ handle, sort, filterInputs, after: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasNextPage ? last.endCursor : undefined),
    staleTime: 2 * MINUTE,
  });
}

interface SearchCursor {
  query: string;
  after: string;
}

/** Tries each spelling of the query until one finds products; later pages keep the spelling that matched. */
async function searchAnySpelling(query: string) {
  const [typed, ...alternatives] = spellingVariants(query);
  let page = { ...(await searchProducts(typed)), query: typed };
  for (const spelling of alternatives) {
    if (page.products.length > 0) break;
    page = { ...(await searchProducts(spelling)), query: spelling };
  }
  return page;
}

export function useSearch(query: string) {
  const language = useLanguage();
  return useInfiniteQuery({
    queryKey: ['search', language, query],
    queryFn: async ({ pageParam }) =>
      pageParam ? { ...(await searchProducts(pageParam.query, pageParam.after)), query: pageParam.query } : searchAnySpelling(query),
    initialPageParam: null as SearchCursor | null,
    getNextPageParam: (last): SearchCursor | undefined =>
      last.hasNextPage && last.endCursor ? { query: last.query, after: last.endCursor } : undefined,
    enabled: query.trim().length >= 2,
    staleTime: MINUTE,
  });
}

export function useSearchSuggestions(query: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['search-suggestions', language, query],
    queryFn: () => fetchSearchSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 5 * MINUTE,
  });
}

export function useProduct(handle: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['product', language, handle],
    queryFn: () => fetchProduct(handle),
    enabled: handle.length > 0,
    staleTime: 5 * MINUTE,
  });
}

export function useRecommendations(productId: string | undefined) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['recommendations', language, productId],
    queryFn: () => fetchRecommendations(productId!),
    enabled: !!productId,
    staleTime: 10 * MINUTE,
  });
}

export function useCollectionOptional(handle: string | undefined) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['collection', language, handle],
    queryFn: () => fetchCollection(handle!),
    enabled: !!handle,
    staleTime: 10 * MINUTE,
  });
}

export function useProductsByIds(ids: string[]) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['products-by-ids', language, ids],
    queryFn: () => fetchProductsByIds(ids),
    staleTime: MINUTE,
  });
}

export function useCollections() {
  const language = useLanguage();
  return useQuery({ queryKey: ['collections', language], queryFn: () => fetchCollections(), staleTime: 10 * MINUTE });
}

export function useCollection(handle: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['collection', language, handle],
    queryFn: () => fetchCollection(handle),
    staleTime: 10 * MINUTE,
  });
}

export function useMenu(handle: string) {
  const language = useLanguage();
  return useQuery({ queryKey: ['menu', language, handle], queryFn: () => fetchMenu(handle), staleTime: 30 * MINUTE });
}

export function usePage(handle: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['page', language, handle],
    queryFn: () => fetchPage(handle),
    enabled: handle.length > 0,
    staleTime: 30 * MINUTE,
  });
}

export function usePolicies() {
  const language = useLanguage();
  return useQuery({ queryKey: ['policies', language], queryFn: fetchPolicies, staleTime: 30 * MINUTE });
}
