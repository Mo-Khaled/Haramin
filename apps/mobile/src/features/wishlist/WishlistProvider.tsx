import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/AuthProvider';
import { backend } from '@/lib/backend';
import { haptics } from '@/lib/haptics';
import { reportFailure } from '@/lib/sentry';

/** Last known server list, so hearts render instantly on launch before the network answers. */
const CACHE_KEY = 'haramain.wishlist';

interface WishlistContextValue {
  ids: string[];
  has: (productId: string) => boolean;
  /** Adds or removes a product; asks a signed-out customer to sign in instead. */
  toggle: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const { session, loading } = auth;
  const [ids, setIds] = useState<string[]>([]);

  const store = useCallback((next: string[]) => {
    setIds(next);
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch(reportFailure);
  }, []);

  // The wishlist belongs to the signed-in customer: load theirs, and drop it when the session ends.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      setIds([]);
      AsyncStorage.removeItem(CACHE_KEY).catch(reportFailure);
      return;
    }
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => raw && setIds(JSON.parse(raw) as string[]))
      .catch(reportFailure);
    backend
      .getWishlist(session.accessToken)
      .then(store)
      .catch(reportFailure); // Offline: keep showing the cached list.
  }, [session, loading, store]);

  const promptSignIn = useCallback(() => {
    Alert.alert(t('wishlist.signInTitle'), t('wishlist.signInBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('account.signIn'), onPress: () => auth.signIn().catch(reportFailure) },
    ]);
  }, [auth, t]);

  const toggle = useCallback(
    (productId: string) => {
      if (!session) {
        promptSignIn();
        return;
      }
      const exists = ids.includes(productId);
      haptics.select();
      store(exists ? ids.filter((id) => id !== productId) : [productId, ...ids]);
      const call = exists ? backend.removeWishlist : backend.addWishlist;
      call(session.accessToken, productId).catch(() => store(ids)); // Undo the optimistic change.
    },
    [ids, session, store, promptSignIn],
  );

  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle }), [ids, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
