import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { unregisterDevice } from '@/features/notifications/registeredDevice';
import {
  fetchProfile,
  isSignInConfigured,
  loadSession,
  signIn as signInRequest,
  signOut as signOutRequest,
  type CustomerProfile,
  type Session,
} from '@/lib/customerAccount';

interface AuthContextValue {
  session: Session | null;
  customer: CustomerProfile | null;
  loading: boolean;
  configured: boolean;
  signIn: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(isSignInConfigured);

  const hydrate = useCallback(async (next: Session | null) => {
    setSession(next);
    setCustomer(next ? await fetchProfile(next.accessToken).catch(() => null) : null);
  }, []);

  useEffect(() => {
    if (!isSignInConfigured) return;
    loadSession()
      .then(hydrate)
      .catch(() => hydrate(null))
      .finally(() => setLoading(false));
  }, [hydrate]);

  const signIn = useCallback(async () => {
    const next = await signInRequest();
    if (!next) return false;
    await hydrate(next);
    return true;
  }, [hydrate]);

  const signOut = useCallback(async () => {
    if (session) {
      await unregisterDevice(session.accessToken);
      await signOutRequest(session);
    }
    await hydrate(null);
  }, [session, hydrate]);

  const value = useMemo(
    () => ({ session, customer, loading, configured: isSignInConfigured, signIn, signOut }),
    [session, customer, loading, signIn, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
