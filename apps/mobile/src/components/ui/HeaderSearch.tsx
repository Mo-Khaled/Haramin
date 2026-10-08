import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Flat search field for the brand block: icon and hint on a single underline, no pill. */
export function HeaderSearch({ placeholder }: { placeholder: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="search"
      accessibilityLabel={placeholder}
      onPress={() => router.push('/search')}
      style={[styles.bar, { borderColor: colors.onHeader }]}>
      <Icon name="search" color={colors.onHeader} />
      <AppText color={colors.onHeader} style={styles.text} numberOfLines={1}>
        {placeholder}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { minHeight: minTouch, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { flex: 1, opacity: 0.8 },
});
