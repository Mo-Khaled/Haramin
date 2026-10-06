import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { RailSkeleton } from '@/components/ui/Skeleton';
import { useReadingStart } from '@/lib/direction';
import type { ProductCard } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ProductCardItem } from './ProductCard';
import { QuickViewSheet } from './QuickViewSheet';

interface Props {
  title: string;
  products: ProductCard[];
  loading?: boolean;
  onViewAll?: () => void;
}

/** Titled horizontal row of product cards; renders nothing once loaded with no products. */
export function ProductCarousel({ title, products, loading, onViewAll }: Props) {
  const start = useReadingStart<FlatList<ProductCard>>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [quickView, setQuickView] = useState<ProductCard | null>(null);

  if (!loading && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
        {onViewAll ? (
          <Pressable accessibilityRole="link" onPress={onViewAll} style={styles.viewAll}>
            <AppText variant="label" color={colors.primaryText}>
              {t('common.viewAll')}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {loading ? (
        <RailSkeleton />
      ) : (
        <FlatList
          ref={start.ref}
          {...start.scrollProps}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ProductCardItem product={item} onQuickAdd={setQuickView} />
            </View>
          )}
        />
      )}
      <QuickViewSheet product={quickView} onClose={() => setQuickView(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  title: { flex: 1 },
  viewAll: { minHeight: 48, justifyContent: 'center' },
  list: { paddingHorizontal: spacing.md, gap: spacing.md },
  item: { width: 168 },
});
