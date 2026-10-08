import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import { withRecent } from '@/features/catalog/recentlyViewed';
import { reportFailure } from '@/lib/sentry';

const STORAGE_KEY = 'haramain.recentSearches';
const MAX_SEARCHES = 8;

/** Searches the customer submitted, newest first, kept on the device. */
export function useRecentSearches() {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setSearches(JSON.parse(raw) as string[]))
      .catch(reportFailure);
  }, []);

  const persist = useCallback((next: string[]) => {
    setSearches(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(reportFailure);
  }, []);

  const remember = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length >= 2) persist(withRecent(searches, trimmed, MAX_SEARCHES));
    },
    [persist, searches],
  );

  const clear = useCallback(() => persist([]), [persist]);

  return { searches, remember, clear };
}
