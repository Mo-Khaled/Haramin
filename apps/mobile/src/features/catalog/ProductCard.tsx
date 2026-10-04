import { Image } from 'expo-image';
import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { Price } from '@/components/ui/Price';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { discountPercent } from '@/lib/format';
import type { ProductCard as ProductCardData } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface Props {
  product: ProductCardData;
  onQuickAdd: (product: ProductCardData) => void;
}

function ProductCardView({ product, onQuickAdd }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);
  const percent = discountPercent(product.price.amount, product.compareAtPrice?.amount);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={product.title}
      onPress={() => router.push({ pathname: '/product/[handle]', params: { handle: product.handle } })}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? 0.9 : 1 }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.surfaceAlt }]}>
        {product.featuredImage ? (
          <Image
            source={{ uri: product.featuredImage.url }}
            style={styles.image}
            contentFit="cover"
            transition={150}
            accessibilityLabel={product.featuredImage.altText ?? product.title}
          />
        ) : null}
        {percent ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <AppText variant="caption" color={colors.onPrimary}>
              {t('common.off', { percent })}
            </AppText>
          </View>
        ) : null}
        <View style={styles.heart}>
          <IconButton
            filled
            name={saved ? 'heart' : 'heart-outline'}
            color={saved ? colors.danger : colors.text}
            label={t(saved ? 'product.removeFromWishlist' : 'product.addToWishlist')}
            onPress={() => wishlist.toggle(product.id)}
          />
        </View>
        {!product.availableForSale ? (
          <View style={[styles.soldOut, { backgroundColor: colors.overlay }]}>
            <AppText variant="label" color="#FFFFFF">
              {t('common.outOfStock')}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <AppText variant="caption" muted numberOfLines={1}>
          {product.vendor}
        </AppText>
        <AppText variant="label" numberOfLines={2} style={styles.title}>
          {product.title}
        </AppText>
        <Price price={product.price} compareAt={product.compareAtPrice} />
        {product.availableForSale && product.firstVariantId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t('product.quickAdd')}: ${product.title}`}
            onPress={() => onQuickAdd(product)}
            style={({ pressed }) => [
              styles.quickAdd,
              { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}>
            <AppText variant="label" color={colors.primary}>
              {t('product.quickAdd')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

export const ProductCardItem = memo(ProductCardView);

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.md, overflow: 'hidden' },
  imageWrap: { aspectRatio: 4 / 5, width: '100%' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    start: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  heart: { position: 'absolute', top: 0, end: 0 },
  soldOut: { position: 'absolute', bottom: 0, start: 0, end: 0, alignItems: 'center', paddingVertical: spacing.xs },
  info: { padding: spacing.sm, gap: 2 },
  title: { minHeight: 40 },
  quickAdd: {
    marginTop: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
