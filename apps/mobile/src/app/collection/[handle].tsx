import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useCollection, useCollectionProducts } from '@/features/catalog/hooks';
import { FilterSortSheet, SORT_OPTIONS } from '@/features/catalog/FilterSheet';
import { countActive, NO_FILTERS, toFilterInputs, type ActiveFilters } from '@/features/catalog/filterInputs';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import type { SortKey } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';

export default function CollectionScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [sort, setSort] = useState<SortKey>('FEATURED');
  const [filters, setFilters] = useState<ActiveFilters>(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);

  const collection = useCollection(handle);
  const inputs = useMemo(() => toFilterInputs(filters), [filters]);
  const query = useCollectionProducts(handle, sort, inputs);

  const products = query.data?.pages.flatMap((p) => p.products) ?? [];
  const availableFilters = query.data?.pages[0]?.filters ?? [];
  const activeCount = countActive(filters);

  const sortLabel = t(SORT_OPTIONS.find((option) => option.key === sort)!.label);
  const toolbar = (
    <View style={styles.toolbar}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setSheetOpen(true)}
        style={({ pressed }) => [styles.control, { opacity: pressed ? 0.7 : 1 }]}>
        <AppText variant="label">
          {`${t('collection.filterSort')} (${sortLabel})`}
          {activeCount ? ` · ${activeCount}` : ''}
        </AppText>
        <Icon name="options-outline" color={activeCount ? colors.primaryText : colors.text} />
      </Pressable>
    </View>
  );

  return (
    <Screen>
      <Header
        title={collection.data?.title}
        right={<IconButton name="search" label={t('search.placeholder')} color={colors.onHeader} onPress={() => router.push('/search')} />}
      />
      {query.isLoading ? (
        <ProductGridSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : (
        <ProductGrid
          products={products}
          header={toolbar}
          empty={
            <View style={styles.empty}>
              <EmptyState message={t('collection.empty')} />
            </View>
          }
          loadingMore={query.isFetchingNextPage}
          refreshing={query.isRefetching && !query.isFetchingNextPage}
          onRefresh={() => query.refetch()}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        />
      )}
      <FilterSortSheet
        visible={sheetOpen}
        sort={sort}
        filters={filters}
        available={availableFilters}
        onApply={(nextSort, nextFilters) => {
          setSort(nextSort);
          setFilters(nextFilters);
        }}
        onClose={() => setSheetOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', justifyContent: 'flex-end', paddingBottom: spacing.sm },
  control: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  empty: { height: 300 },
});
