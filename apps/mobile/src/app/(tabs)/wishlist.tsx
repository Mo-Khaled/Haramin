import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottleIllustration } from '@/components/ui/BottleIllustration';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { TabHeader } from '@/components/ui/TabHeader';
import { TabScroll, useTabTopInset } from '@/components/ui/TabScroll';
import { useAuth } from '@/features/auth/AuthProvider';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { useProductsByIds } from '@/features/catalog/hooks';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { spacing } from '@/theme/tokens';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { ids } = useWishlist();
  const query = useProductsByIds(ids);
  const topInset = useTabTopInset();

  const header = <TabHeader title={t('tabs.wishlist')} />;

  if (!session) {
    return (
      <TabScroll header={header}>
        <SignInPrompt message={t('wishlist.needSignIn')} />
      </TabScroll>
    );
  }

  if (ids.length > 0 && query.data) {
    return (
      <ProductGrid
        products={query.data}
        header={<TabHeader title={t('tabs.wishlist')} style={styles.gridHeader} />}
        stickyHeaderIndices={[0]}
        topInset={topInset}
      />
    );
  }

  return (
    <TabScroll header={header}>
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
  // Cancels ProductGrid's side padding so the brand block spans the full width.
  gridHeader: { marginHorizontal: -spacing.md, marginBottom: spacing.md },
});
