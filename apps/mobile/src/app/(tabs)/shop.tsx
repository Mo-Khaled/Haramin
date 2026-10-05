import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { TabScroll } from '@/components/ui/TabScroll';
import { SearchBar } from '@/components/ui/SearchBar';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useCollections, useMenu } from '@/features/catalog/hooks';
import { handleFromUrl } from '@/lib/shopify/api';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

function Row({ label, handle }: { label: string; handle: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle } })}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <Icon name="chevron-forward" color={colors.textSecondary} size="sm" />
    </Pressable>
  );
}

export default function ShopScreen() {
  const { t } = useTranslation();
  const menu = useMenu('main-menu');
  const collections = useCollections();

  const brands = menu.data?.find((item) => item.items.length > 0 && /brand/i.test(item.title))?.items ?? [];
  const brandHandles = new Set(brands.map((b) => handleFromUrl(b.url)));
  const other = (collections.data ?? []).filter((c) => !brandHandles.has(c.handle));

  const loading = collections.isLoading || menu.isLoading;

  return (
    <TabScroll>
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {t('shop.title')}
        </AppText>
        <SearchBar placeholder={t('search.placeholder')} />
      </View>
      {loading ? (
        <LoadingState />
      ) : collections.isError ? (
        <ErrorState onRetry={() => collections.refetch()} />
      ) : (
        <View style={styles.content}>
          <Row label={t('shop.all')} handle="all-perfumes" />
          <Row label={t('home.forHer')} handle="for-her" />
          <Row label={t('home.forHim')} handle="for-him" />

          <AppText variant="heading" style={styles.sectionTitle} accessibilityRole="header">
            {t('shop.brands')}
          </AppText>
          {brands.map((brand) => {
            const handle = handleFromUrl(brand.url);
            return handle ? <Row key={brand.url} label={brand.title} handle={handle} /> : null;
          })}

          <AppText variant="heading" style={styles.sectionTitle} accessibilityRole="header">
            {t('shop.collections')}
          </AppText>
          {other.map((c) => (
            <Row key={c.id} label={c.title} handle={c.handle} />
          ))}
        </View>
      )}
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  header: { padding: spacing.md, gap: spacing.md },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.xs },
  row: {
    minHeight: minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
  },
  rowLabel: { flex: 1 },
});
