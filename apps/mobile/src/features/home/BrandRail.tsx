import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Skeleton } from '@/components/ui/Skeleton';
import { useBrands, type Brand } from '@/features/catalog/useBrands';
import { useTheme } from '@/theme/ThemeProvider';
import { lightPalette, spacing } from '@/theme/tokens';

const CIRCLE = 76;

export function BrandLogo({ brand, size }: { brand: Brand; size: number }) {
  const { colors } = useTheme();
  // Logos are designed on white, so they always sit on a white disc, in dark mode too.
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor: colors.border }]}>
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

export function BrandRail() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { brands, isLoading } = useBrands();
  if (!isLoading && brands.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <AppText variant="title" style={styles.title} accessibilityRole="header">
          {t('home.brands')}
        </AppText>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/shop', params: { view: 'brands' } })}
          style={styles.viewAll}>
          <AppText variant="label" color={colors.primaryText}>
            {t('common.viewAll')}
          </AppText>
        </Pressable>
      </View>
      {isLoading ? (
        <View style={styles.list}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={CIRCLE} height={CIRCLE} borderRadius={CIRCLE / 2} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={brands}
          keyExtractor={(brand) => brand.handle}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: item.handle } })}
              style={({ pressed }) => [styles.brand, { opacity: pressed ? 0.7 : 1 }]}>
              <BrandLogo brand={item} size={CIRCLE} />
              <AppText variant="caption" muted numberOfLines={1} style={styles.name}>
                {item.title}
              </AppText>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md },
  title: { flex: 1 },
  viewAll: { minHeight: 48, justifyContent: 'center' },
  list: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.md },
  brand: { width: CIRCLE + 8, alignItems: 'center', gap: spacing.xs },
  circle: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 10,
  },
  logo: { width: '100%', height: '100%' },
  fallback: { textAlign: 'center' },
  name: { textAlign: 'center' },
});
