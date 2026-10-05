import { router } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { useCart } from './CartProvider';

/** Adds a variant and confirms it the same way everywhere: haptic, toast, and a shortcut to the bag. */
export function useAddToCart() {
  const { addItem, busy } = useCart();
  const showToast = useToast();
  const { t } = useTranslation();

  const add = useCallback(
    async (variantId: string): Promise<boolean> => {
      try {
        await addItem(variantId);
        haptics.success();
        showToast({ message: t('cart.added'), actionLabel: t('cart.viewBag'), onAction: () => router.push('/cart') });
        return true;
      } catch {
        haptics.error();
        showToast({ message: t('cart.addFailed') });
        return false;
      }
    },
    [addItem, showToast, t],
  );

  return { add, busy };
}
