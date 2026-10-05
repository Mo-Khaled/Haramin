import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Price } from '@/components/ui/Price';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useCart } from '@/features/cart/CartProvider';
import { useProduct } from '@/features/catalog/hooks';
import { findVariant, initialSelection, VariantPicker, type Selection } from '@/features/catalog/VariantPicker';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { SHOP_URL } from '@/lib/shopify/client';
import { htmlToText } from '@/lib/html';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const wishlist = useWishlist();
  const query = useProduct(handle);
  const product = query.data;

  const [selection, setSelection] = useState<Selection>({});
  const [imageIndex, setImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (product) setSelection(initialSelection(product));
  }, [product]);

  if (query.isLoading) {
    return (
      <Screen>
        <Header />
        <LoadingState />
      </Screen>
    );
  }
  if (query.isError) {
    return (
      <Screen>
        <Header />
        <ErrorState onRetry={() => query.refetch()} />
      </Screen>
    );
  }
  if (!product) {
    return (
      <Screen>
        <Header />
        <EmptyState message={t('product.notFound')} />
      </Screen>
    );
  }

  const variant = findVariant(product, selection);
  const price = variant?.price ?? product.price;
  const compareAt = variant ? variant.compareAtPrice : product.compareAtPrice;
  const saved = wishlist.has(product.id);
  const images = product.images.length > 0 ? product.images : product.featuredImage ? [product.featuredImage] : [];

  const addToCart = async () => {
    if (!variant) return;
    setFailed(false);
    try {
      await cart.addItem(variant.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      setFailed(true);
    }
  };

  return (
    <Screen>
      <Header
        title={product.vendor}
        right={
          <>
            <IconButton
              name="share-outline"
              label={t('product.share')}
              onPress={() => Share.share({ message: `${product.title}\n${SHOP_URL}/products/${product.handle}` })}
            />
            <IconButton
              name={saved ? 'heart' : 'heart-outline'}
              color={saved ? colors.danger : colors.text}
              label={t(saved ? 'product.removeFromWishlist' : 'product.addToWishlist')}
              onPress={() => wishlist.toggle(product.id)}
            />
          </>
        }
      />
      <FlatList
        data={[0]}
        keyExtractor={() => 'body'}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        renderItem={() => (
          <View style={styles.body}>
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(img) => img.url}
              onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item.url }}
                  style={{ width, height: width * 1.1, backgroundColor: colors.surfaceAlt }}
                  contentFit="cover"
                  accessibilityLabel={item.altText ?? product.title}
                />
              )}
            />
            {images.length > 1 ? (
              <View style={styles.dots} accessibilityLabel={`${imageIndex + 1}/${images.length}`}>
                {images.map((img, i) => (
                  <View
                    key={img.url}
                    style={[styles.dot, { backgroundColor: i === imageIndex ? colors.primaryText : colors.border }]}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.info}>
              <AppText variant="title" accessibilityRole="header">
                {product.title}
              </AppText>
              <Price price={price} compareAt={compareAt} large />
              <VariantPicker product={product} selection={selection} onChange={setSelection} />
              {product.description ? (
                <View style={styles.description}>
                  <AppText variant="heading">{t('product.description')}</AppText>
                  <AppText muted>{htmlToText(product.descriptionHtml)}</AppText>
                </View>
              ) : null}
            </View>
          </View>
        )}
      />
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
        ]}>
        {failed ? (
          <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
            {t('common.error')}
          </AppText>
        ) : null}
        <Button
          label={added ? t('product.added') : variant?.availableForSale ? t('product.addToCart') : t('product.unavailable')}
          onPress={addToCart}
          loading={cart.busy}
          disabled={!variant?.availableForSale}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  info: { paddingHorizontal: spacing.md, gap: spacing.md },
  description: { gap: spacing.sm },
  bar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    padding: spacing.md,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
