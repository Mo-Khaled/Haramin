import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBrandName } from '@/features/catalog/brandNames';
import { useBrands, type Brand } from '@/features/catalog/useBrands';
import { sizedImage } from '@/lib/shopify/imageUrl';
import { lightPalette, radius, spacing } from '@/theme/tokens';
import { SectionHeading } from './SectionHeading';

const BAND_HEIGHT = 64;
/** Brand collection images are 4226x1421 wine banners with the logo in cream. */
const LOGO_ASPECT = 4226 / 1421;
const LOGO_WIDTH = Math.round(BAND_HEIGHT * LOGO_ASPECT);
const TILE_GAP = 6;
/** Plain logos are drawn for white paper, so their tile is white; the border shows every tile is tappable. */
const PLAIN_TILE = '#FFFFFF';
const PLAIN_BORDER = '#C9A66B';
const BANNER_BORDER = 'rgba(251, 245, 238, 0.55)';

/** Brands whose collection image is a plain dark or gold logo, not a wine banner, so it needs a light tile. */
const PLAIN_LOGO_BRANDS = new Set([
  'ajmal',
  'almas',
  'amarah-perfumes',
  'arabiyat-sugar',
  'asdaf',
  'banafa-for-oud',
  'french-avenue',
  'jean-antone',
  'maison-alhambra',
]);

/** A brand logo at the banner's 3:1 shape: banners show as they are, plain logos sit on a cream tile. */
export function BrandMark({ brand, width }: { brand: Brand; width: number }) {
  const plain = PLAIN_LOGO_BRANDS.has(brand.handle);
  const name = useBrandName(brand.title);
  return (
    <View
      style={[
        styles.mark,
        { width, aspectRatio: LOGO_ASPECT, backgroundColor: plain ? PLAIN_TILE : lightPalette.primary, borderColor: plain ? PLAIN_BORDER : BANNER_BORDER },
        plain && styles.plainMark,
      ]}>
      {brand.logo ? (
        <Image
          source={{ uri: sizedImage(brand.logo.url, width * 2) }}
          style={styles.logo}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <AppText variant="label" color={plain ? lightPalette.text : lightPalette.onPrimary}>
          {name}
        </AppText>
      )}
    </View>
  );
}

function BandLogo({ brand }: { brand: Brand }) {
  const name = useBrandName(brand.title);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: brand.handle } })}
      style={({ pressed }) => [styles.bandLogo, { opacity: pressed ? 0.7 : 1 }]}>
      <BrandMark brand={brand} width={LOGO_WIDTH - 8} />
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
          <Skeleton height={BAND_HEIGHT + TILE_GAP * 2} borderRadius={0} />
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
  // Banner images carry their own wine background, so the band uses the same fixed colour in both themes.
  band: { backgroundColor: lightPalette.primary, height: BAND_HEIGHT + TILE_GAP * 2 },
  bandLogo: { width: LOGO_WIDTH - 8 + TILE_GAP, height: BAND_HEIGHT + TILE_GAP * 2, alignItems: 'center', justifyContent: 'center' },
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: radius.sm, borderWidth: 1.5 },
  plainMark: { padding: 8 },
  logo: { width: '100%', height: '100%' },
});
