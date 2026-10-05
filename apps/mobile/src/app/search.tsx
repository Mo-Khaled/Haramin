import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useSearch, useSearchSuggestions } from '@/features/catalog/hooks';
import { ProductGrid } from '@/features/catalog/ProductGrid';
import { CATEGORY_TABS } from '@/features/home/homeContent';
import { useRecentSearches } from '@/features/search/recentSearches';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

const DEBOUNCE_MS = 300;

function ChipRow({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <AppText variant="label" muted style={styles.flex}>
          {title}
        </AppText>
        {action}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

/** Shown before typing: recent searches and quick categories. */
function SearchStart({ onPick }: { onPick: (query: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const recent = useRecentSearches();
  return (
    <View style={styles.start}>
      {recent.searches.length > 0 ? (
        <ChipRow
          title={t('search.recent')}
          action={
            <Pressable accessibilityRole="button" onPress={recent.clear} style={styles.clear}>
              <AppText variant="label" color={colors.primaryText}>
                {t('search.clear')}
              </AppText>
            </Pressable>
          }>
          {recent.searches.map((query) => (
            <Chip key={query} label={query} onPress={() => onPick(query)} />
          ))}
        </ChipRow>
      ) : null}
      <ChipRow title={t('search.browse')}>
        {CATEGORY_TABS.filter((tab) => tab.target !== 'brands').map((tab) => (
          <Chip
            key={tab.target}
            label={t(tab.labelKey)}
            onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: tab.target } })}
          />
        ))}
      </ChipRow>
    </View>
  );
}

/** Shown while typing: Shopify's suggested searches and matching brands or collections. */
function Suggestions({ query, onPick }: { query: string; onPick: (query: string) => void }) {
  const { t } = useTranslation();
  const suggestions = useSearchSuggestions(query);
  const data = suggestions.data;
  const queries = (data?.queries ?? []).filter((q) => q.toLowerCase() !== query.toLowerCase());
  if (!data || (queries.length === 0 && data.collections.length === 0)) return null;

  return (
    <View style={[styles.start, styles.bleed]}>
      {data.collections.length > 0 ? (
        <ChipRow title={t('search.brandsAndCollections')}>
          {data.collections.map((c) => (
            <Chip
              key={c.handle}
              label={c.title}
              selected
              onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: c.handle } })}
            />
          ))}
        </ChipRow>
      ) : null}
      {queries.length > 0 ? (
        <ChipRow title={t('search.suggestions')}>
          {queries.map((q) => (
            <Chip key={q} label={q} onPress={() => onPick(q)} />
          ))}
        </ChipRow>
      ) : null}
    </View>
  );
}

export default function SearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const recent = useRecentSearches();

  useEffect(() => {
    const handle = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [text]);

  const search = useSearch(query);
  const products = search.data?.pages.flatMap((p) => p.products) ?? [];
  const active = query.length >= 2;

  const pick = (value: string) => {
    setText(value);
    setQuery(value);
    recent.remember(value);
  };

  return (
    <Screen>
      <Header title={t('search.placeholder')} />
      <View style={styles.inputWrap}>
        <TextInput
          autoFocus
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => recent.remember(text)}
          placeholder={t('home.search')}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          accessibilityLabel={t('search.placeholder')}
          style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
        />
      </View>
      {!active ? (
        <SearchStart onPick={pick} />
      ) : search.isError ? (
        <ErrorState onRetry={() => search.refetch()} />
      ) : (
        <ProductGrid
          header={<Suggestions query={query} onPick={pick} />}
          products={products}
          empty={search.isLoading ? (
            <View style={styles.bleed}>
              <ProductGridSkeleton />
            </View>
          ) : <EmptyState message={t('search.empty', { query })} />}
          loadingMore={search.isFetchingNextPage}
          onEndReached={() => search.hasNextPage && !search.isFetchingNextPage && search.fetchNextPage()}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inputWrap: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  input: {
    minHeight: minTouch,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
  },
  start: { gap: spacing.md, paddingVertical: spacing.sm },
  /** Cancels ProductGrid's side padding for full-width rows inside the grid. */
  bleed: { marginHorizontal: -spacing.md },
  group: { gap: spacing.sm },
  groupHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  clear: { minHeight: 44, justifyContent: 'center' },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.md },
});
