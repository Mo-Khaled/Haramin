import type { ReactElement, ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, type RefreshControlProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/**
 * Top padding a tab screen must add itself. iOS native tabs adjust the first scroll view for the
 * status bar and the floating tab bar automatically; Android draws edge-to-edge under the status bar.
 */
export function useTabTopInset(): number {
  const insets = useSafeAreaInsets();
  return Platform.OS === 'android' ? insets.top : 0;
}

interface Props {
  children: ReactNode;
  contentContainerStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  stickyHeaderIndices?: number[];
}

/**
 * Root scroll container for tab screens. It must be the screen's first child: Expo native tabs only
 * inset the first ScrollView, which is what keeps content clear of the tab bar.
 */
export function TabScroll({
  children,
  contentContainerStyle,
  refreshControl,
  keyboardShouldPersistTaps,
  stickyHeaderIndices,
}: Props) {
  const { colors } = useTheme();
  const topInset = useTabTopInset();
  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingTop: topInset }, contentContainerStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      stickyHeaderIndices={stickyHeaderIndices}
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
});
