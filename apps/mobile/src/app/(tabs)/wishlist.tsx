import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useProductsByIds } from '@/features/catalog/hooks';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import { useWishlist } from '@/features/wishlist/WishlistProvider';
import { spacing } from '@/theme/tokens';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { ids } = useWishlist();
  const query = useProductsByIds(ids);

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('tabs.wishlist')}
        </AppText>
      </View>
      {ids.length === 0 ? (
        <EmptyState
          message={`${t('wishlist.empty')}\n${t('wishlist.emptyHint')}`}
          actionLabel={t('wishlist.browse')}
          onAction={() => router.push('/shop')}
        />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <ProductGrid products={query.data ?? []} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { padding: spacing.md } });
