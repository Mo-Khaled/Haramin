import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

export interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Single-choice settings list: one card, a divider between rows, and a check on the active option. */
export function OptionList<T extends string>({ options, selected, onSelect }: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} accessibilityRole="radiogroup">
      {options.map((option, index) => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            accessibilityLabel={option.hint ? `${option.label}, ${option.hint}` : option.label}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.row,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              { opacity: pressed ? 0.7 : 1 },
            ]}>
            <View style={styles.text}>
              <AppText variant="bodyStrong">{option.label}</AppText>
              {option.hint ? (
                <AppText variant="caption" muted>
                  {option.hint}
                </AppText>
              ) : null}
            </View>
            <Icon
              name={active ? 'checkmark-circle' : 'ellipse-outline'}
              color={active ? colors.primaryText : colors.textSecondary}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: minTouch + 8, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  text: { flex: 1, gap: 2 },
});
