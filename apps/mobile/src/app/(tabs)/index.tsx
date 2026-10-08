import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Logo } from '@/components/ui/Logo';
import { HeaderSearch } from '@/components/ui/HeaderSearch';
import { TabScroll } from '@/components/ui/TabScroll';
import { localizedBrandName } from '@/features/catalog/brandNames';
import { ProductRail } from '@/features/catalog/ProductRail';
import { useBrands } from '@/features/catalog/useBrands';
import { BrandRail } from '@/features/home/BrandRail';
import { CategoryTabs } from '@/features/home/CategoryTabs';
import { HeroCarousel } from '@/features/home/HeroCarousel';
import { NewIn } from '@/features/home/NewIn';
import { BRAND_WORLDS } from '@/features/home/homeContent';
import { PromoBanner } from '@/features/home/PromoBanner';
import { TrustStrip } from '@/features/home/TrustStrip';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

/** Index of <CategoryTabs> among TabScroll's direct children; it stays pinned below the status bar band. */
const STICKY_TABS = [1];

function BrandWorlds() {
  const { t, i18n } = useTranslation();
  const { brands } = useBrands();
  return (
    <>
      {BRAND_WORLDS.map((handle) => {
        const brand = brands.find((b) => b.handle === handle);
        return brand ? <ProductRail key={handle} title={t('home.brandWorld', { brand: localizedBrandName(brand.title, i18n.language) })} handle={handle} /> : null;
      })}
    </>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ type: 'active' });
    setRefreshing(false);
  };

  return (
    <TabScroll
      stickyHeaderIndices={STICKY_TABS}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.onHeader} />}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Logo tintColor={colors.onHeader} />
        <AppText color={colors.onHeader} style={styles.tagline}>
          {t('home.tagline')}
        </AppText>
        <View style={styles.search}>
          <HeaderSearch placeholder={t('home.search')} />
        </View>
      </View>

      <CategoryTabs />

      <View style={styles.sections}>
        <PromoBanner />
        <HeroCarousel />
        <TrustStrip />
        <NewIn />
        <BrandRail />
        <ProductRail title={t('home.bestSellers')} handle="best-sellers" />
        <BrandWorlds />
        <ProductRail title={t('home.under300')} handle="under-300-egp" />
      </View>
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.xs, paddingTop: spacing.md, paddingBottom: spacing.xs },
  tagline: { textAlign: 'center' },
  search: { alignSelf: 'stretch', paddingHorizontal: spacing.md },
  sections: { gap: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.md },
});
