import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { useDirectionStyle } from '@/lib/direction';

/** Pull-to-refresh can drag content this far down; the brand fill above the content covers it. */
const PULL_FILL = 1000;

/**
 * Space a tab screen's scroll view leaves above itself for the status bar band. Starting the scroll view below the
 * band (instead of letting iOS inset its content) keeps sticky headers visible: they pin to the scroll view's top
 * edge, which would otherwise sit under the band.
 */
export function useTabTopInset(): number {
  return useSafeAreaInsets().top;
}

interface Props {
  children: ReactNode;
  /** Pinned at the top while the screen scrolls, e.g. a TabHeader. */
  header?: ReactElement;
  contentContainerStyle?: ViewStyle;
  refreshControl?: ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'always' | 'handled' | 'never';
  stickyHeaderIndices?: number[];
}

/**
 * Root scroll container for tab screens. It must be the screen's first child: Expo native tabs only inset the first
 * ScrollView, which is what keeps content clear of the tab bar.
 */
export function TabScroll({ children, header, contentContainerStyle, refreshControl, keyboardShouldPersistTaps, stickyHeaderIndices }: Props) {
  const { colors } = useTheme();
  const topInset = useTabTopInset();
  const direction = useDirectionStyle();
  return (
    <ScrollView
      style={[styles.root, direction, { backgroundColor: colors.background, marginTop: topInset }]}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, contentContainerStyle]}
      refreshControl={refreshControl}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      stickyHeaderIndices={header ? [0] : stickyHeaderIndices}
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      {header}
      {children}
      {/* Last child so sticky indices are unaffected; it paints the area revealed by pulling the content down. */}
      <View pointerEvents="none" style={[styles.pullFill, { backgroundColor: colors.header }]} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1 },
  pullFill: { position: 'absolute', top: -PULL_FILL, height: PULL_FILL, start: 0, end: 0 },
});
