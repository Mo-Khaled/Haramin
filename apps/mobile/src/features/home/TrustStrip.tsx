import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { env } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { TRUST_ITEMS } from './homeContent';

export function TrustStrip() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const amount = formatMoney(env.freeShippingThreshold, i18n.language);

  return (
    <View style={[styles.strip, { backgroundColor: colors.primary }]}>
      {TRUST_ITEMS.map((item) => (
        <View key={item.labelKey} style={styles.item} accessible accessibilityLabel={t(item.labelKey, { amount })}>
          <Icon name={item.icon} color={colors.onPrimary} />
          <AppText variant="caption" color={colors.onPrimary} style={styles.label}>
            {t(item.labelKey, { amount })}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  item: { flex: 1, alignItems: 'center', gap: spacing.xs, paddingHorizontal: 2 },
  label: { textAlign: 'center' },
});
