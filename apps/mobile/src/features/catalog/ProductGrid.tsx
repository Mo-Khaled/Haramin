import { useCallback, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import type { ProductCard } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ProductCardItem } from './ProductCard';
import { NO_OVERSCROLL, useTopOnlyBounce } from '@/lib/scroll';
import { QuickViewSheet } from './QuickViewSheet';

interface Props {
  products: ProductCard[];
  header?: ReactElement | null;
  empty?: ReactElement | null;
  onEndReached?: () => void;
  loadingMore?: boolean;
  /** Space above the list when the grid is a tab screen's root (see useTabTopInset). */
  topInset?: number;
  stickyHeaderIndices?: number[];
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Told whether the list has left its top, e.g. to show a shadow under a pinned toolbar. */
  onScrolledChange?: (scrolled: boolean) => void;
}

export function ProductGrid({ products, header, empty, onEndReached, loadingMore, topInset = 0, stickyHeaderIndices, refreshing, onRefresh, onScrolledChange }: Props) {
  const { colors } = useTheme();
  const [quickView, setQuickView] = useState<ProductCard | null>(null);
  const topBounce = useTopOnlyBounce();
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    topBounce.onScroll(event);
    onScrolledChange?.(event.nativeEvent.contentOffset.y > 0);
  };

  const renderItem = useCallback(
    ({ item }: { item: ProductCard }) => (
      <View style={styles.cell}>
        <ProductCardItem product={item} onQuickAdd={setQuickView} />
      </View>
    ),
    [],
  );

  return (
    <>
      <FlatList
        {...(onRefresh ? topBounce : NO_OVERSCROLL)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={{ backgroundColor: colors.background, marginTop: topInset }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl }]}
        stickyHeaderIndices={stickyHeaderIndices}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primaryText} style={styles.footer} /> : null}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshing={refreshing}
        onRefresh={onRefresh}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
      <QuickViewSheet product={quickView} onClose={() => setQuickView(null)} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md, gap: spacing.md },
  row: { gap: spacing.md },
  cell: { flex: 1 },
  footer: { paddingVertical: spacing.lg },
});
