import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { SearchBar } from '@/components/ui/SearchBar';
import { TabScroll } from '@/components/ui/TabScroll';
import { useMenu } from '@/features/catalog/hooks';
import { ProductRail } from '@/features/catalog/ProductRail';
import { env } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { handleFromUrl } from '@/lib/shopify/api';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

function openCollection(handle: string) {
  router.push({ pathname: '/collection/[handle]', params: { handle } });
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const menu = useMenu('main-menu');
  const brands = menu.data?.find((item) => item.items.length > 0 && /brand/i.test(item.title))?.items ?? [];

  const tiles = [
    { key: 'her', label: t('home.forHer'), handle: 'for-her', icon: 'flower-outline' as const },
    { key: 'him', label: t('home.forHim'), handle: 'for-him', icon: 'water-outline' as const },
    { key: 'home', label: t('home.homeIncense'), handle: 'insence', icon: 'flame-outline' as const },
  ];

  return (
    <TabScroll contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Logo />
          <AppText muted style={styles.tagline}>
            {t('home.tagline')}
          </AppText>
        </View>

        <View style={styles.pad}>
          <SearchBar placeholder={t('home.search')} />
        </View>

        <View style={[styles.pad, styles.tiles]}>
          {tiles.map((tile) => (
            <Pressable
              key={tile.key}
              accessibilityRole="button"
              accessibilityLabel={tile.label}
              onPress={() => openCollection(tile.handle)}
              style={({ pressed }) => [styles.tile, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}>
              <Icon name={tile.icon} color={colors.onPrimary} size="lg" />
              <AppText variant="label" color={colors.onPrimary} style={styles.tileLabel}>
                {tile.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        <View style={[styles.pad, styles.banner, { backgroundColor: colors.surfaceAlt }]}>
          <Icon name="car-outline" color={colors.primaryText} />
          <AppText variant="label" style={styles.bannerText}>
            {t('home.freeShipping', { amount: formatMoney(env.freeShippingThreshold, i18n.language) })}
          </AppText>
        </View>

        <ProductRail title={t('home.newArrivals')} handle="new-arrivals" />
        <ProductRail title={t('home.bestSellers')} handle="best-sellers" />

        {brands.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="title" style={styles.pad} accessibilityRole="header">
              {t('home.brands')}
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
              {brands.map((brand) => {
                const handle = handleFromUrl(brand.url);
                if (!handle) return null;
                return (
                  <Pressable
                    key={brand.url}
                    accessibilityRole="button"
                    onPress={() => openCollection(handle)}
                    style={[styles.brand, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <AppText variant="label">{brand.title}</AppText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
        <ProductRail title={t('home.offers')} handle="under-300-egp" />
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl, gap: spacing.lg },
  pad: { paddingHorizontal: spacing.md },
  hero: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md },
  tagline: { textAlign: 'center' },
  tiles: { flexDirection: 'row', gap: spacing.sm },
  tile: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  tileLabel: { textAlign: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  bannerText: { flex: 1 },
  section: { gap: spacing.md },
  brandRow: { paddingHorizontal: spacing.md, gap: spacing.sm },
  brand: {
    minHeight: minTouch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
