import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.primary }]}>
            <AppText variant="label" color={selected ? colors.onPrimary : colors.text}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: radius.pill, padding: spacing.xs },
  segment: {
    flex: 1,
    minHeight: minTouch - 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
