import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { sizedImage } from '@/lib/shopify/imageUrl';
import type { ShopImage } from '@/lib/shopify/types';
import { useTracking } from '@/lib/direction';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const IMAGE_WIDTH = 600;
const FALLBACK_ICON = 120;

interface Props {
  title: string;
  image: ShopImage | null;
  /** Drawn as a faint watermark on a deeper wine tile when the collection has no image. */
  fallbackIcon: IconName;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Portrait collection image with a wine label chip overlapping its bottom-start corner. */
export function CollectionTile({ title, image, fallbackIcon, onPress, style }: Props) {
  const { colors } = useTheme();
  const tracking = useTracking(0.5);
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress} style={[styles.tile, { backgroundColor: colors.primary, borderColor: colors.border }, style]}>
      {image ? (
        <Image source={{ uri: sizedImage(image.url, IMAGE_WIDTH) }} style={styles.image} contentFit="cover" transition={150} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.fallback}>
          <Ionicons name={fallbackIcon} size={FALLBACK_ICON} color={colors.onPrimary} style={styles.watermark} />
        </View>
      )}
      <View style={[styles.chip, { backgroundColor: colors.primary }]}>
        <AppText variant="label" color={colors.onPrimary} numberOfLines={2} style={[styles.label, { letterSpacing: tracking }]}>
          {title}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  tile: { aspectRatio: 3 / 4, borderRadius: radius.sm, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.18)' },
  watermark: { opacity: 0.22 },
  chip: { position: 'absolute', bottom: spacing.sm, start: 0, maxWidth: '88%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { textTransform: 'uppercase' },
});
