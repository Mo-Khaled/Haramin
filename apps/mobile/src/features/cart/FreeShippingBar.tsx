import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { env } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const threshold = env.freeShippingThreshold;
  const remaining = Math.max(threshold - subtotal, 0);
  const progress = Math.min(subtotal / threshold, 1);
  const message =
    remaining > 0
      ? t('cart.freeShippingLeft', { amount: formatMoney(remaining, i18n.language) })
      : t('cart.freeShippingDone');

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.surfaceAlt }]}
      accessible
      accessibilityLabel={message}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <AppText variant="label">{message}</AppText>
      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <View style={[styles.fill, { backgroundColor: colors.primaryText, width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
