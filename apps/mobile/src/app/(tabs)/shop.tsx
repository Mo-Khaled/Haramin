import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { TabScroll } from '@/components/ui/TabScroll';
import { useCollections } from '@/features/catalog/hooks';
import { useBrands, type Brand } from '@/features/catalog/useBrands';
import { BrandLogo } from '@/features/home/BrandRail';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

type ShopView = 'brands' | 'categories';

const GENDER_TILES: { labelKey: string; handle: string; icon: IconName }[] = [
  { labelKey: 'home.forHer', handle: 'for-her', icon: 'flower-outline' },
  { labelKey: 'home.forHim', handle: 'for-him', icon: 'water-outline' },
  { labelKey: 'home.homeIncense', handle: 'insence', icon: 'flame-outline' },
];

function openCollection(handle: string) {
  router.push({ pathname: '/collection/[handle]', params: { handle } });
}

function BrandCard({ brand }: { brand: Brand }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={brand.title}
      onPress={() => openCollection(brand.handle)}
      style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <BrandLogo brand={brand} size={88} />
      <AppText variant="label" numberOfLines={1} style={styles.center}>
        {brand.title}
      </AppText>
    </PressableScale>
  );
}

function BrandsGrid() {
  const { brands, isLoading, isError, refetch } = useBrands();
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading) {
    return (
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.gridCell}>
            <Skeleton height={150} borderRadius={radius.md} />
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.grid}>
      {brands.map((brand) => (
        <View key={brand.handle} style={styles.gridCell}>
          <BrandCard brand={brand} />
        </View>
      ))}
    </View>
  );
}

function CategoryRow({ label, handle }: { label: string; handle: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openCollection(handle)}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <AppText style={styles.rowLabel}>{label}</AppText>
      <Icon name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} color={colors.textSecondary} size="sm" />
    </Pressable>
  );
}

function Categories() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const collections = useCollections();
  const { brands } = useBrands();
  const brandHandles = new Set(brands.map((b) => b.handle));
  const others = (collections.data ?? []).filter((c) => !brandHandles.has(c.handle));

  return (
    <View style={styles.categories}>
      <View style={styles.tiles}>
        {GENDER_TILES.map((tile) => (
          <PressableScale
            key={tile.handle}
            accessibilityRole="button"
            accessibilityLabel={t(tile.labelKey)}
            onPress={() => openCollection(tile.handle)}
            style={[styles.tile, { backgroundColor: colors.primary }]}>
            <Icon name={tile.icon} color={colors.onPrimary} size="lg" />
            <AppText variant="label" color={colors.onPrimary} style={styles.center}>
              {t(tile.labelKey)}
            </AppText>
          </PressableScale>
        ))}
      </View>
      {collections.isError ? (
        <ErrorState onRetry={() => collections.refetch()} />
      ) : collections.isLoading ? (
        <Skeleton height={200} />
      ) : (
        <View>
          <CategoryRow label={t('shop.all')} handle="all-perfumes" />
          {others.map((c) => (
            <CategoryRow key={c.id} label={c.title} handle={c.handle} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ShopScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ view?: ShopView }>();
  const [view, setView] = useState<ShopView>(params.view ?? 'brands');

  useEffect(() => {
    if (params.view) setView(params.view);
  }, [params.view]);

  return (
    <TabScroll contentContainerStyle={styles.page}>
      <AppText variant="title" accessibilityRole="header">
        {t('shop.title')}
      </AppText>
      <SearchBar placeholder={t('search.placeholder')} />
      <SegmentedControl<ShopView>
        value={view}
        onChange={setView}
        options={[
          { value: 'brands', label: t('shop.brands') },
          { value: 'categories', label: t('shop.collections') },
        ]}
      />
      {view === 'brands' ? <BrandsGrid /> : <Categories />}
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  page: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  gridCell: { width: '50%', padding: spacing.xs },
  brandCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categories: { gap: spacing.md },
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
  row: {
    minHeight: minTouch + 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1 },
});
