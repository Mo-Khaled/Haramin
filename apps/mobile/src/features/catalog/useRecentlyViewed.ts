import { useCallback, useEffect, useState } from 'react';

import { loadRecentlyViewed, recordView } from './recentlyViewed';
import { reportFailure } from '@/lib/sentry';

/** Product ids the customer opened recently, newest first; stored on the device only. */
export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    loadRecentlyViewed().then(setIds).catch(reportFailure);
  }, []);

  const record = useCallback((productId: string) => {
    recordView(productId).then(setIds).catch(reportFailure);
  }, []);

  return { ids, record };
}
