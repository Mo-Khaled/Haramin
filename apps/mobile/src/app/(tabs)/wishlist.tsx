import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
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
    <TabScroll contentContainerStyle={styles.page}>
      {title}
      {ids.length === 0 ? (
        <EmptyState
          message={`${t('wishlist.empty')}\n${t('wishlist.emptyHint')}`}
          actionLabel={t('wishlist.browse')}
          onAction={() => router.push('/shop')}
        />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <LoadingState />
      )}
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  page: { paddingHorizontal: spacing.md },
  header: { paddingVertical: spacing.md },
});
