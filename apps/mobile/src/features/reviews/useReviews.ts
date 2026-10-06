import { useQuery } from '@tanstack/react-query';

import { backend } from '@/lib/backend';
import { env } from '@/lib/env';

/** Judge.me reviews for a product, through the Haramain API (which holds the private token). */
export function useReviews(handle: string) {
  return useQuery({
    queryKey: ['reviews', handle],
    queryFn: () => backend.getReviews(handle),
    enabled: env.apiUrl.length > 0 && handle.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
