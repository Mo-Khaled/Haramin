import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import type { ProductCard } from '@/lib/shopify/types';
import { useCollectionProducts } from './hooks';
import { ProductCardItem } from './ProductCard';
import { QuickViewSheet } from './QuickViewSheet';

interface Props {
  title: string;
  handle: string;
}

export function ProductRail({ title, handle }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const query = useCollectionProducts(handle, 'FEATURED', []);
  const [quickView, setQuickView] = useState<ProductCard | null>(null);
  const products = query.data?.pages[0]?.products.slice(0, 10) ?? [];

  if (!query.isLoading && products.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.title} accessibilityRole="header">
          {title}
        </AppText>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle } })}
          style={styles.viewAll}>
          <AppText variant="label" color={colors.primaryText}>
            {t('common.viewAll')}
          </AppText>
        </Pressable>
      </View>
      <FlatList
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
