import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  addCartLine,
  createCart,
  getCart,
  removeCartLine,
  setCartDiscountCodes,
  updateCartLine,
} from '@/lib/shopify/api';
import { ShopifyError } from '@/lib/shopify/client';
import type { Cart } from '@/lib/shopify/types';

const CART_ID_KEY = 'haramain.cartId';

/** Adds to the saved cart, or starts a new one if that cart has expired or was already checked out. */
async function addToSavedCart(cartId: string, variantId: string, quantity: number): Promise<Cart> {
  try {
    return await addCartLine(cartId, variantId, quantity);
  } catch (error) {
    if (!(error instanceof ShopifyError) || (await getCart(cartId))) throw error;
    return createCart(variantId, quantity);
  }
}

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  busy: boolean;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  setQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<boolean>;
  clearDiscounts: () => Promise<void>;
  reset: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const id = await AsyncStorage.getItem(CART_ID_KEY);
        if (id) setCart(await getCart(id));
      } catch {
        // A cart we cannot fetch (expired id, offline) is treated as empty; the next add creates a fresh one.
        setCart(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Cart | null) => {
    setCart(next);
    if (next) await AsyncStorage.setItem(CART_ID_KEY, next.id);
    else await AsyncStorage.removeItem(CART_ID_KEY);
  }, []);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setBusy(true);
    try {
      return await action();
    } finally {
      setBusy(false);
    }
  }, []);

  const addItem = useCallback(
    (variantId: string, quantity = 1) =>
      run(async () => {
        const next = cart ? await addToSavedCart(cart.id, variantId, quantity) : await createCart(variantId, quantity);
        await persist(next);
      }),
    [cart, persist, run],
  );

  const setQuantity = useCallback(
    (lineId: string, quantity: number) =>
      run(async () => {
        if (!cart) return;
        const next = quantity <= 0 ? await removeCartLine(cart.id, lineId) : await updateCartLine(cart.id, lineId, quantity);
        await persist(next);
      }),
    [cart, persist, run],
  );

  const removeLine = useCallback((lineId: string) => setQuantity(lineId, 0), [setQuantity]);

  const applyDiscount = useCallback(
    (code: string) =>
      run(async () => {
        if (!cart) return false;
        const next = await setCartDiscountCodes(cart.id, [code.trim()]);
        await persist(next);
        return next.discountCodes.some((d) => d.applicable);
      }),
    [cart, persist, run],
  );

  const clearDiscounts = useCallback(
    () =>
      run(async () => {
        if (!cart) return;
        await persist(await setCartDiscountCodes(cart.id, []));
      }),
    [cart, persist, run],
  );

  const reset = useCallback(() => persist(null), [persist]);

  const value = useMemo(
    () => ({ cart, loading, busy, addItem, setQuantity, removeLine, applyDiscount, clearDiscounts, reset }),
    [cart, loading, busy, addItem, setQuantity, removeLine, applyDiscount, clearDiscounts, reset],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
