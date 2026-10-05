import { router } from 'expo-router';

import { useCollectionProducts } from './hooks';
import { ProductCarousel } from './ProductCarousel';

interface Props {
  title: string;
  handle: string;
}

/** The first products of a collection as a carousel, with View all opening the full collection. */
export function ProductRail({ title, handle }: Props) {
  const query = useCollectionProducts(handle, 'FEATURED', []);
  return (
    <ProductCarousel
      title={title}
      products={query.data?.pages[0]?.products.slice(0, 10) ?? []}
      loading={query.isLoading}
      onViewAll={() => router.push({ pathname: '/collection/[handle]', params: { handle } })}
    />
  );
}
