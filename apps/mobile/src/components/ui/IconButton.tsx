import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

interface Props {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
  /** `compact` draws a small disc (for overlays on images) but keeps the full touch target through hitSlop. */
  size?: 'regular' | 'compact';
}

const COMPACT = 32;

export function IconButton({ name, label, onPress, color, filled, disabled, size = 'regular' }: Props) {
  const { colors } = useTheme();
  const compact = size === 'compact';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={compact ? (minTouch - COMPACT) / 2 : spacing.xs}
      style={({ pressed }) => [
        compact ? styles.compact : styles.base,
        { backgroundColor: filled ? colors.surface : 'transparent', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={name} color={color} size={compact ? 'sm' : undefined} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: minTouch, height: minTouch, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  compact: { width: COMPACT, height: COMPACT, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
