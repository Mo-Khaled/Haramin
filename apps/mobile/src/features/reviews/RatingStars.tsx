import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

interface Props {
  rating: number;
  size?: number;
}

/** Five stars filled to the nearest half; purely visual, so callers provide the spoken rating. */
export function RatingStars({ rating, size = 16 }: Props) {
  const { colors } = useTheme();
  const rounded = Math.round(rating * 2) / 2;
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[1, 2, 3, 4, 5].map((star) => {
        const name = rounded >= star ? 'star' : rounded >= star - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={star} name={name} size={size} color={colors.primaryText} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', gap: 2 } });
