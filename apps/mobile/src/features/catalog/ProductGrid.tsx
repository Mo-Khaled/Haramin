import { useCallback, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import type { ProductCard } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ProductCardItem } from './ProductCard';
import { QuickViewSheet } from './QuickViewSheet';

interface Props {
  products: ProductCard[];
  header?: ReactElement | null;
  empty?: ReactElement | null;
  onEndReached?: () => void;
  loadingMore?: boolean;
  /** Extra top padding when the grid is a tab screen's root (see useTabTopInset). */
  topInset?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function ProductGrid({ products, header, empty, onEndReached, loadingMore, topInset = 0, refreshing, onRefresh }: Props) {
  const { colors } = useTheme();
  const [quickView, setQuickView] = useState<ProductCard | null>(null);

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
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.row}
        style={{ backgroundColor: colors.background }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingTop: topInset, paddingBottom: spacing.xl }]}
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
