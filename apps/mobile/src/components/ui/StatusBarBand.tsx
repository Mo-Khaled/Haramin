import { usePathname } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/** Screens whose photo runs up behind the clock and that draw their own bar once scrolled. */
const FULL_BLEED_ROUTE = /^\/product\//;

/** The top of every screen's header block, drawn over the system clock area so scrolled content never shows through it. */
export function StatusBarBand() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  if (FULL_BLEED_ROUTE.test(pathname)) return null;
  return <View pointerEvents="none" style={[styles.band, { height: insets.top, backgroundColor: colors.header }]} />;
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, start: 0, end: 0, zIndex: 100 },
});
