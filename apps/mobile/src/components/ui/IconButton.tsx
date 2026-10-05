import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';

interface Props {
  name: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
  disabled?: boolean;
}

export function IconButton({ name, label, onPress, color, filled, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: filled ? colors.surface : 'transparent', opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={name} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { width: minTouch, height: minTouch, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
