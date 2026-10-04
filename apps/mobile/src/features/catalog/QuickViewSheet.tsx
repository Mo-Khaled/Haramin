import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Price } from '@/components/ui/Price';
import { Sheet } from '@/components/ui/Sheet';
import { LoadingState } from '@/components/ui/States';
import { useCart } from '@/features/cart/CartProvider';
import type { ProductCard } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { useProduct } from './hooks';
import { findVariant, initialSelection, VariantPicker, type Selection } from './VariantPicker';

interface Props {
  product: ProductCard | null;
  onClose: () => void;
}

export function QuickViewSheet({ product, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();
  const detail = useProduct(product?.handle ?? '');
  const [selection, setSelection] = useState<Selection>({});
  const [error, setError] = useState(false);

  useEffect(() => {
    if (detail.data) setSelection(initialSelection(detail.data));
    setError(false);
  }, [detail.data]);

  const data = product ? detail.data : null;
  const variant = data ? findVariant(data, selection) : undefined;

  const add = async () => {
    if (!variant) return;
    try {
      await cart.addItem(variant.id);
      onClose();
    } catch {
      setError(true);
    }
  };

  return (
    <Sheet
      visible={!!product}
      title={product?.title ?? ''}
      onClose={onClose}
      footer={
        data ? (
          <>
            {error ? <AppText variant="caption" color={colors.danger}>{t('common.error')}</AppText> : null}
            <Button
              label={variant?.availableForSale ? t('product.addToCart') : t('product.unavailable')}
              onPress={add}
              loading={cart.busy}
              disabled={!variant?.availableForSale}
            />
            <Button
              variant="secondary"
              label={t('product.description')}
              onPress={() => {
                onClose();
                router.push({ pathname: '/product/[handle]', params: { handle: data.handle } });
              }}
            />
          </>
        ) : null
      }>
      {!data ? (
        <View style={styles.loading}>
          <LoadingState />
        </View>
      ) : (
        <>
          <View style={styles.top}>
            {(variant?.image ?? data.featuredImage) ? (
              <Image
                source={{ uri: (variant?.image ?? data.featuredImage)!.url }}
                style={styles.image}
                contentFit="cover"
                accessibilityLabel={data.title}
              />
            ) : null}
            <View style={styles.meta}>
              <AppText variant="caption" muted>
                {data.vendor}
              </AppText>
              <Price price={variant?.price ?? data.price} compareAt={variant?.compareAtPrice ?? data.compareAtPrice} large />
            </View>
          </View>
          <VariantPicker product={data} selection={selection} onChange={setSelection} />
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  loading: { height: 160 },
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  image: { width: 96, height: 120, borderRadius: radius.md },
  meta: { flex: 1, gap: spacing.xs },
});
