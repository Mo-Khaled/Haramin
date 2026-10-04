import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  fetchCollection,
  fetchCollectionProducts,
  fetchCollections,
  fetchMenu,
  fetchPolicies,
  fetchProduct,
  fetchProductsByIds,
  searchProducts,
} from '@/lib/shopify/api';
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

export function useSearch(query: string) {
  const language = useLanguage();
  return useInfiniteQuery({
    queryKey: ['search', language, query],
    queryFn: ({ pageParam }) => searchProducts(query, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasNextPage ? last.endCursor : undefined),
    enabled: query.trim().length >= 2,
    staleTime: MINUTE,
  });
}

export function useProduct(handle: string) {
  const language = useLanguage();
  return useQuery({
    queryKey: ['product', language, handle],
    queryFn: () => fetchProduct(handle),
    staleTime: 5 * MINUTE,
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

export function usePolicies() {
  const language = useLanguage();
  return useQuery({ queryKey: ['policies', language], queryFn: fetchPolicies, staleTime: 30 * MINUTE });
}
