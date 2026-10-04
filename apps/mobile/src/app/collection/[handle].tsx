import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useCollection, useCollectionProducts } from '@/features/catalog/hooks';
import { FilterSheet, SortSheet } from '@/features/catalog/FilterSheet';
import { countActive, NO_FILTERS, toFilterInputs, type ActiveFilters } from '@/features/catalog/filterInputs';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import type { SortKey } from '@/lib/shopify/types';
import { spacing } from '@/theme/tokens';

export default function CollectionScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortKey>('FEATURED');
  const [filters, setFilters] = useState<ActiveFilters>(NO_FILTERS);
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const collection = useCollection(handle);
  const inputs = useMemo(() => toFilterInputs(filters), [filters]);
  const query = useCollectionProducts(handle, sort, inputs);

  const products = query.data?.pages.flatMap((p) => p.products) ?? [];
  const availableFilters = query.data?.pages[0]?.filters ?? [];
  const activeCount = countActive(filters);

  const toolbar = (
    <View style={styles.toolbar}>
      <Chip label={t('collection.sort')} onPress={() => setSortOpen(true)} />
      <Chip
        label={activeCount ? `${t('collection.filter')} (${activeCount})` : t('collection.filter')}
        selected={activeCount > 0}
        onPress={() => setFilterOpen(true)}
      />
    </View>
  );

  return (
    <Screen>
      <Header
        title={collection.data?.title}
        right={<IconButton name="search" label={t('search.placeholder')} onPress={() => router.push('/search')} />}
      />
      {query.isLoading ? (
        <LoadingState />
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
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        />
      )}
      <SortSheet visible={sortOpen} value={sort} onSelect={setSort} onClose={() => setSortOpen(false)} />
      <FilterSheet
        visible={filterOpen}
        filters={filters}
        available={availableFilters}
        onChange={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.md },
  empty: { height: 300 },
});
