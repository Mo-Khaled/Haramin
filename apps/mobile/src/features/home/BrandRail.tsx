import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { localizedBrandName } from '@/features/catalog/brandNames';
import { useBrands, type Brand } from '@/features/catalog/useBrands';
import { sizedImage } from '@/lib/shopify/imageUrl';
import { lightPalette, spacing } from '@/theme/tokens';
import { SectionHeading } from './SectionHeading';

const BAND_HEIGHT = 64;
/** Brand collection images are 4226x1421 wine banners with the logo in cream. */
const LOGO_ASPECT = 4226 / 1421;
const LOGO_WIDTH = Math.round(BAND_HEIGHT * LOGO_ASPECT);

export function BrandLogo({ brand, size }: { brand: Brand; size: number }) {
  // Logos are designed on white, so they always sit on a white disc, in dark mode too.
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {brand.logo ? (
        <Image source={{ uri: brand.logo.url }} style={styles.logo} contentFit="contain" accessibilityIgnoresInvertColors />
      ) : (
        <AppText variant="caption" color={lightPalette.text} numberOfLines={2} style={styles.fallback}>
          {brand.title}
        </AppText>
      )}
    </View>
  );
}

function BandLogo({ brand }: { brand: Brand }) {
  const { i18n } = useTranslation();
  const name = localizedBrandName(brand.title, i18n.language);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: brand.handle } })}
      style={({ pressed }) => [styles.bandLogo, { opacity: pressed ? 0.7 : 1 }]}>
      {brand.logo ? (
        <Image source={{ uri: sizedImage(brand.logo.url, LOGO_WIDTH * 2) }} style={styles.bandImage} contentFit="contain" accessibilityIgnoresInvertColors />
      ) : (
        <AppText variant="label" color={lightPalette.onPrimary}>
          {name}
        </AppText>
      )}
    </Pressable>
  );
}

/** The website's BRANDS band: brand logos side by side on a wine strip. */
export function BrandRail() {
  const { t } = useTranslation();
  const { brands, isLoading } = useBrands();
  if (!isLoading && brands.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionHeading title={t('shop.brands')} />
      <View style={styles.band}>
        {isLoading ? (
          <Skeleton height={BAND_HEIGHT} borderRadius={0} />
        ) : (
          <FlatList
            horizontal
            data={brands}
            keyExtractor={(brand) => brand.handle}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <BandLogo brand={item} />}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  // The logo images carry their own wine background, so the band uses the same fixed colour in both themes.
  band: { backgroundColor: lightPalette.primary, height: BAND_HEIGHT },
  bandLogo: { width: LOGO_WIDTH, height: BAND_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  bandImage: { width: '100%', height: '100%' },
  circle: {
    backgroundColor: lightPalette.surface,
    borderColor: lightPalette.border,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  logo: { width: '100%', height: '100%' },
  fallback: { textAlign: 'center' },
});
