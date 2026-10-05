import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { BottleIllustration } from '@/components/ui/BottleIllustration';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TabScroll, useTabTopInset } from '@/components/ui/TabScroll';
import { useProductsByIds } from '@/features/catalog/hooks';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { spacing } from '@/theme/tokens';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { ids } = useWishlist();
  const query = useProductsByIds(ids);
  const topInset = useTabTopInset();

  const title = (
    <View style={styles.header}>
      <AppText variant="title" accessibilityRole="header">
        {t('tabs.wishlist')}
      </AppText>
    </View>
  );

  if (ids.length > 0 && query.data) {
    return <ProductGrid products={query.data} header={title} topInset={topInset} />;
  }

  return (
    <TabScroll>
      {title}
      {ids.length === 0 ? (
        <EmptyState
          illustration={<BottleIllustration />}
          message={t('wishlist.empty')}
          hint={t('wishlist.emptyHint')}
          actionLabel={t('wishlist.browse')}
          onAction={() => router.push('/shop')}
          secondaryLabel={t('wishlist.search')}
          onSecondary={() => router.push('/search')}
        />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <ProductGridSkeleton />
      )}
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md },
});
