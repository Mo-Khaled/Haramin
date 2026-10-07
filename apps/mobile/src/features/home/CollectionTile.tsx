import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { sizedImage } from '@/lib/shopify/imageUrl';
import type { ShopImage } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const IMAGE_WIDTH = 600;

interface Props {
  title: string;
  image: ShopImage | null;
  /** Shown on a plain wine tile when the collection has no image. */
  fallbackIcon: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Portrait collection image with a wine label chip overlapping its bottom-start corner. */
export function CollectionTile({ title, image, fallbackIcon, onPress, style }: Props) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[styles.tile, { backgroundColor: colors.primary }, style]}>
      {image ? (
        <Image source={{ uri: sizedImage(image.url, IMAGE_WIDTH) }} style={styles.image} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.fallback}>
          <Icon name={fallbackIcon} color={colors.onPrimary} size="lg" />
        </View>
      )}
      <View style={[styles.chip, { backgroundColor: colors.primary }]}>
        <AppText variant="label" color={colors.onPrimary} numberOfLines={2} style={styles.label}>
          {title}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { aspectRatio: 3 / 4, borderRadius: radius.sm, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chip: { position: 'absolute', bottom: spacing.sm, start: 0, maxWidth: '88%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { textTransform: 'uppercase', letterSpacing: 0.5 },
});
