import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Accordion } from '@/components/ui/Accordion';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Price } from '@/components/ui/Price';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useAddToCart } from '@/features/cart/useAddToCart';
import { BestForChips } from '@/features/catalog/BestForChips';
import { useBrandName } from '@/features/catalog/brandNames';
import { FragranceJourney } from '@/features/catalog/FragranceJourney';
import { findBrandHandle } from '@/features/catalog/brandMatch';
import { DeliveryEstimate } from '@/features/catalog/DeliveryEstimate';
import { useCollectionOptional, useProduct, useProductsByIds, useRecommendations } from '@/features/catalog/hooks';
import { ProductCarousel } from '@/features/catalog/ProductCarousel';
import { parseBestFor } from '@/features/catalog/productTags';
import { useBrands } from '@/features/catalog/useBrands';
import { useRecentlyViewed } from '@/features/catalog/useRecentlyViewed';
import { findVariant, initialSelection, VariantPicker, type Selection } from '@/features/catalog/VariantPicker';
import { RatingLine, ReviewsSection } from '@/features/reviews/ReviewsSection';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { discountPercent, formatMoney } from '@/lib/format';
import { htmlToText } from '@/lib/html';
import { SHOP_URL } from '@/lib/shopify/client';
import type { ProductDetail, ShopImage } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { useActiveIndex, useIsRTL } from '@/lib/direction';

function Gallery({ images, title }: { images: ShopImage[]; title: string }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const { index, viewabilityProps } = useActiveIndex();

  return (
    <View>
      <FlatList
        {...viewabilityProps}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(img) => img.url}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.url }}
            style={{ width, height: width * 1.05, backgroundColor: colors.surface }}
            contentFit="contain"
            transition={150}
            accessibilityLabel={item.altText ?? title}
          />
        )}
      />
      {images.length > 1 ? (
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]} accessibilityLabel={`${index + 1} / ${images.length}`}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primaryText, width: `${100 / images.length}%`, start: `${(100 / images.length) * index}%` },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

function BrandSection({ product }: { product: ProductDetail }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { brands } = useBrands();
  const handle = findBrandHandle(product.vendor, brands.map((b) => b.handle)) ?? undefined;
  const collection = useCollectionOptional(handle);
  if (!handle || !collection.data?.description) return null;

  return (
    <Accordion title={t('product.aboutBrand')}>
      <AppText muted>{collection.data.description}</AppText>
      <Pressable
        accessibilityRole="link"
        onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle } })}
        style={styles.link}>
        <AppText variant="label" color={colors.primaryText}>
          {t('product.viewBrand', { brand: collection.data.title })}
        </AppText>
      </Pressable>
    </Accordion>
  );
}

function RelatedRails({ product }: { product: ProductDetail }) {
  const { t } = useTranslation();
  const recommendations = useRecommendations(product.id);
  const { ids, record } = useRecentlyViewed();
  const recentIds = ids.filter((id) => id !== product.id);
  const recent = useProductsByIds(recentIds);

  useEffect(() => {
    record(product.id);
  }, [product.id, record]);

  return (
    <View style={styles.rails}>
      <ProductCarousel
        title={t('product.youMayAlsoLike')}
        products={recommendations.data ?? []}
        loading={recommendations.isLoading}
      />
      <ProductCarousel title={t('product.recentlyViewed')} products={recentIds.length ? (recent.data ?? []) : []} />
    </View>
  );
}

function LoadingProduct() {
  const { width } = useWindowDimensions();
  return (
    <Screen>
      <Header />
      <Skeleton width={width} height={width} borderRadius={0} />
      <View style={styles.info}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="80%" height={28} />
        <Skeleton width="40%" height={20} />
      </View>
    </Screen>
  );
}

export default function ProductScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { add, busy } = useAddToCart();
  const wishlist = useWishlist();
  const isRTL = useIsRTL();
  const query = useProduct(handle);
  const product = query.data;
  const vendor = useBrandName(product?.vendor ?? '');
  const [selection, setSelection] = useState<Selection>({});
  // Measured so the page ends exactly above the add-to-cart bar instead of leaving empty space below.
  const [barHeight, setBarHeight] = useState(0);

  useEffect(() => {
    if (product) setSelection(initialSelection(product));
  }, [product]);

  if (query.isLoading) return <LoadingProduct />;
  if (query.isError || !product) {
    return (
      <Screen>
        <Header />
        {query.isError ? <ErrorState onRetry={() => query.refetch()} /> : <EmptyState message={t('product.notFound')} />}
      </Screen>
    );
  }

  const variant = findVariant(product, selection);
  const price = variant?.price ?? product.price;
  const compareAt = variant ? variant.compareAtPrice : product.compareAtPrice;
  const percent = discountPercent(price.amount, compareAt?.amount);
  const saved = wishlist.has(product.id);
  const images = product.images.length > 0 ? product.images : product.featuredImage ? [product.featuredImage] : [];
  const available = !!variant?.availableForSale;
  const share = () => Share.share({ message: `${product.title}\n${SHOP_URL}/products/${product.handle}` });

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: barHeight + spacing.md }}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}>
        <Gallery images={images} title={product.title} />

        <View style={styles.info}>
          <AppText variant="label" color={colors.primaryText} style={styles.vendor}>
            {vendor}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {product.title}
          </AppText>
          <RatingLine handle={product.handle} />
          {product.productType ? <AppText muted>{product.productType}</AppText> : null}
          <View style={styles.priceRow}>
            <Price price={price} compareAt={compareAt} large />
            {percent ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <AppText variant="caption" color={colors.onPrimary}>
                  {t('common.off', { percent })}
                </AppText>
              </View>
            ) : null}
          </View>

          <VariantPicker product={product} selection={selection} onChange={setSelection} />
          <FragranceJourney notes={product.notes} />
          <BestForChips bestFor={parseBestFor(product.tags)} />
          <DeliveryEstimate />

          <View>
            {product.description ? (
              <Accordion title={t('product.description')} initiallyOpen>
                <AppText muted>{htmlToText(product.descriptionHtml)}</AppText>
              </Accordion>
            ) : null}
            <BrandSection product={product} />
          </View>
        </View>

        <ReviewsSection productId={product.id} handle={product.handle} />
        <RelatedRails product={product} />
      </ScrollView>

      {/* Keeps scrolled content from running under the clock and battery icons. */}
      <View style={[styles.statusBackdrop, { height: insets.top, backgroundColor: colors.background }]} />
      <View style={[styles.topBar, { top: insets.top + spacing.xs }]} pointerEvents="box-none">
        <IconButton
          filled
          name={isRTL ? 'chevron-forward' : 'chevron-back'}
          label={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        />
        <View style={styles.topActions}>
          <IconButton filled name="share-outline" label={t('product.share')} onPress={share} />
        </View>
      </View>

      <View
        onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
        style={[
          styles.bottomBar,
          { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: insets.bottom + spacing.sm },
        ]}>
        <Button
          style={styles.addButton}
          label={
            available
              ? t('product.addToBagPrice', { price: formatMoney(price.amount, i18n.language, price.currencyCode) })
              : t('product.unavailable')
          }
          onPress={() => variant && add(variant.id)}
          loading={busy}
          disabled={!available}
        />
        <View style={[styles.heart, { borderColor: colors.border }]}>
          <IconButton
            name={saved ? 'heart' : 'heart-outline'}
            color={saved ? colors.danger : colors.text}
            label={t(saved ? 'product.removeFromWishlist' : 'product.addToWishlist')}
            onPress={() => wishlist.toggle(product.id)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  progressTrack: { height: 2, marginHorizontal: spacing.md, marginTop: spacing.sm, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { position: 'absolute', top: 0, bottom: 0, borderRadius: radius.pill },
  info: { padding: spacing.md, gap: spacing.md },
  vendor: { letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
  link: { minHeight: 44, justifyContent: 'center' },
  rails: { gap: spacing.xl, paddingTop: spacing.md },
  topBar: {
    position: 'absolute',
    start: spacing.sm,
    end: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  topActions: { flexDirection: 'row', gap: spacing.sm },
  statusBackdrop: { position: 'absolute', top: 0, start: 0, end: 0 },
  bottomBar: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addButton: { flex: 1 },
  heart: { borderWidth: 1, borderRadius: radius.md },
});
