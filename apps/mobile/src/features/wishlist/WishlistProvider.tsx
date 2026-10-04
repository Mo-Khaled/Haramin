import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { backend } from '@/lib/backend';

const STORAGE_KEY = 'haramain.wishlist';

interface WishlistContextValue {
  ids: string[];
  has: (productId: string) => boolean;
  toggle: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setIds(JSON.parse(raw) as string[]))
      .catch(() => undefined);
  }, []);

  // On sign-in, merge the guest wishlist into the server copy, then adopt the merged result.
  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const remote = await backend.getWishlist(session.accessToken);
        const merged = Array.from(new Set([...remote, ...ids]));
        const missing = merged.filter((id) => !remote.includes(id));
        await Promise.all(missing.map((id) => backend.addWishlist(session.accessToken, id)));
        setIds(merged);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Keep the local copy; the next sign-in retries the merge.
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  const toggle = useCallback(
    (productId: string) => {
      const exists = ids.includes(productId);
      const next = exists ? ids.filter((id) => id !== productId) : [productId, ...ids];
      setIds(next);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
      if (session) {
        const call = exists ? backend.removeWishlist : backend.addWishlist;
        call(session.accessToken, productId).catch(() => undefined);
      }
    },
    [ids, session],
  );

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
