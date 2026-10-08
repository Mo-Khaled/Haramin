import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

/** Solid brand band behind the clock and battery, so scrolled content never runs under the system icons. */
export function StatusBarBand() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[styles.band, { height: insets.top, backgroundColor: colors.primary }]} />;
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, start: 0, end: 0, zIndex: 100 },
});
