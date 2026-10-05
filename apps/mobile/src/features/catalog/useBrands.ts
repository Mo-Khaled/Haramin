import { useMemo } from 'react';

import { handleFromUrl } from '@/lib/shopify/api';
import type { ShopImage } from '@/lib/shopify/types';
import { useCollections, useMenu } from './hooks';

export interface Brand {
  title: string;
  handle: string;
  logo: ShopImage | null;
}

/** Brands in the order the store's main menu lists them, with each brand collection's logo image. */
export function useBrands() {
  const menu = useMenu('main-menu');
  const collections = useCollections();

  const brands = useMemo<Brand[]>(() => {
    const brandMenu = menu.data?.find((item) => item.items.length > 0 && /brand|ماركات|العلامات/i.test(item.title));
    const images = new Map((collections.data ?? []).map((c) => [c.handle, c.image]));
    return (brandMenu?.items ?? []).flatMap((item) => {
      const handle = handleFromUrl(item.url);
      return handle ? [{ title: item.title, handle, logo: images.get(handle) ?? null }] : [];
    });
  }, [menu.data, collections.data]);

  return {
    brands,
    isLoading: menu.isLoading || collections.isLoading,
    isError: menu.isError || collections.isError,
    refetch: () => Promise.all([menu.refetch(), collections.refetch()]),
  };
}
