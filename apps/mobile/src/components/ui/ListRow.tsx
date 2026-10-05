import { I18nManager, Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface Props {
  icon: IconName;
  label: string;
  detail?: string;
  onPress: () => void;
}

/** Settings-style navigation row: leading icon, label, optional detail, trailing chevron. */
export function ListRow({ icon, label, detail, onPress }: Props) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}, ${detail}` : label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} color={colors.primaryText} />
      <AppText style={styles.label}>{label}</AppText>
      {detail ? (
        <AppText variant="caption" muted>
          {detail}
        </AppText>
      ) : null}
      <Icon name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size="sm" color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouch + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { flex: 1 },
});
