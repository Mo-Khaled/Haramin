import { useEffect, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useSearch } from '@/features/catalog/hooks';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

const DEBOUNCE_MS = 350;

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handle = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [text]);

  const search = useSearch(query);
  const products = search.data?.pages.flatMap((p) => p.products) ?? [];
  const active = query.length >= 2;

  return (
    <Screen>
      <Header title={t('search.placeholder')} />
      <View style={styles.inputWrap}>
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          placeholder={t('search.placeholder')}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={t('search.placeholder')}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />
      </View>
      {!active ? (
        <EmptyState message={t('search.prompt')} />
      ) : search.isLoading ? (
        <ProductGridSkeleton />
      ) : search.isError ? (
        <ErrorState onRetry={() => search.refetch()} />
      ) : (
        <ProductGrid
          products={products}
          empty={<EmptyState message={t('search.empty', { query })} />}
          loadingMore={search.isFetchingNextPage}
          onEndReached={() => search.hasNextPage && !search.isFetchingNextPage && search.fetchNextPage()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  inputWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  input: {
    minHeight: minTouch,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
});
