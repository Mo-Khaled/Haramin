import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';

interface Props {
  title: string;
  /** Extra header content under the title, e.g. a search field. */
  children?: ReactNode;
  style?: ViewStyle;
}

/** Brand block with the screen title that tops every tab screen; the status bar band continues it upward. */
export function TabHeader({ title, children, style }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.block, { backgroundColor: colors.header }, style]}>
      <AppText variant="title" color={colors.onHeader} accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md },
});
