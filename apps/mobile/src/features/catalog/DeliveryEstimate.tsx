import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { env } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export function DeliveryEstimate() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.box, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <Icon name="car-outline" color={colors.primaryText} />
        <View style={styles.text}>
          <AppText variant="label">{t('delivery.estimate', { days: env.deliveryDays })}</AppText>
          <AppText variant="caption" muted>
            {t('delivery.fee', {
              fee: formatMoney(env.shippingFee, i18n.language),
              threshold: formatMoney(env.freeShippingThreshold, i18n.language),
            })}
          </AppText>
        </View>
      </View>
      <View style={styles.row}>
        <Icon name="cash-outline" color={colors.primaryText} />
        <AppText variant="label" style={styles.text}>
          {t('delivery.payment')}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, gap: 2 },
});
