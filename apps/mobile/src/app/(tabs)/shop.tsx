import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import type { IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { SearchBar } from '@/components/ui/SearchBar';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { TabScroll } from '@/components/ui/TabScroll';
import { useBrandName } from '@/features/catalog/brandNames';
import { useCollections } from '@/features/catalog/hooks';
import { useBrands, type Brand } from '@/features/catalog/useBrands';
import { BrandMark } from '@/features/home/BrandRail';
import { CollectionTile } from '@/features/home/CollectionTile';
import { SHOP_COLLECTION_GROUPS, type CollectionGroup } from '@/features/home/homeContent';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type ShopView = 'brands' | 'categories';

const MAIN_CATEGORIES: { labelKey: string; handle: string; icon: IconName; wide?: true }[] = [
  { labelKey: 'home.forHer', handle: 'for-her', icon: 'flower-outline' },
  { labelKey: 'home.forHim', handle: 'for-him', icon: 'water-outline' },
  { labelKey: 'home.homeIncense', handle: 'insence', icon: 'flame-outline', wide: true },
];

function openCollection(handle: string) {
  router.push({ pathname: '/collection/[handle]', params: { handle } });
}

function BrandCard({ brand }: { brand: Brand }) {
  const { colors } = useTheme();
  const name = useBrandName(brand.title);
  const { width: screenWidth } = useWindowDimensions();
  const markWidth = (screenWidth - spacing.md * 2) / 2 - spacing.xs * 2 - spacing.sm * 2;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => openCollection(brand.handle)}
      style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <BrandMark brand={brand} width={markWidth} />
      <AppText variant="label" numberOfLines={1} style={styles.center}>
        {name}
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

function CollectionGroupChips({ group, titles }: { group: CollectionGroup; titles: Map<string, string> }) {
  const { t } = useTranslation();
  const available = group.handles.filter((handle) => titles.has(handle));
  if (available.length === 0) return null;
  return (
    <View style={styles.group}>
      <AppText variant="heading" accessibilityRole="header">
        {t(group.titleKey)}
      </AppText>
      <View style={styles.chips}>
        {available.map((handle) => (
          <Chip key={handle} label={titles.get(handle) ?? handle} onPress={() => openCollection(handle)} />
        ))}
      </View>
    </View>
  );
}

function Categories() {
  const { t } = useTranslation();
  const collections = useCollections();
  const { width: screenWidth } = useWindowDimensions();
  const halfWidth = (screenWidth - spacing.md * 2 - spacing.sm) / 2;
  const titles = new Map((collections.data ?? []).map((c) => [c.handle, c.title]));

  return (
    <View style={styles.categories}>
      <View style={styles.tiles}>
        {MAIN_CATEGORIES.map((tile) => (
          <CollectionTile
            key={tile.handle}
            title={t(tile.labelKey)}
            image={collections.data?.find((c) => c.handle === tile.handle)?.image ?? null}
            fallbackIcon={tile.icon}
            onPress={() => openCollection(tile.handle)}
            style={tile.wide ? styles.wideTile : { width: halfWidth }}
          />
        ))}
      </View>
      {collections.isError ? (
        <ErrorState onRetry={() => collections.refetch()} />
      ) : collections.isLoading ? (
        <Skeleton height={200} />
      ) : (
        SHOP_COLLECTION_GROUPS.map((group) => <CollectionGroupChips key={group.titleKey} group={group} titles={titles} />)
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
  page: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 },
  center: { textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  gridCell: { width: '50%', padding: spacing.xs },
  brandCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  categories: { gap: spacing.md },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  halfTile: { flexBasis: '48%', flexGrow: 1 },
  wideTile: { width: '100%', aspectRatio: 3.2 },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
