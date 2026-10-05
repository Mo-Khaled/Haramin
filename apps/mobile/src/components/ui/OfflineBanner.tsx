import { useNetInfo } from '@react-native-community/netinfo';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { AppText } from './AppText';

/** Thin notice under the status bar while the phone has no connection; cached screens stay usable. */
export function OfflineBanner() {
  const { isConnected } = useNetInfo();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (isConnected !== false) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { paddingTop: insets.top + spacing.xs, backgroundColor: colors.text }]}>
      <AppText variant="caption" color={colors.background} style={styles.text}>
        {t('common.offline')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', top: 0, start: 0, end: 0, paddingBottom: spacing.xs, zIndex: 999 },
  text: { textAlign: 'center' },
});
