import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

const LOGO = require('@/assets/images/logo.png');

/** The wordmark is single-colour on a transparent background, so it is tinted to stay legible in both themes. */
export function Logo() {
  const { colors } = useTheme();
  return (
    <Image
      source={LOGO}
      style={styles.logo}
      contentFit="contain"
      tintColor={colors.primaryText}
      accessibilityLabel="Haramain Perfumes"
    />
  );
}

const styles = StyleSheet.create({ logo: { width: 240, aspectRatio: 800 / 150 } });
