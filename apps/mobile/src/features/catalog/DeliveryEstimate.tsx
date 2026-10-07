import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { env } from '@/lib/env';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

function Line({ icon, title, detail }: { icon: IconName; title: string; detail?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Icon name={icon} color={colors.primaryText} />
      <View style={styles.text}>
        <AppText variant="label">{title}</AppText>
        {detail ? (
          <AppText variant="caption" muted>
            {detail}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** Delivery and returns in a few lines; the full wording lives in the policies screens. */
export function DeliveryEstimate() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const money = (amount: number) => formatMoney(amount, i18n.language);

  return (
    <View style={[styles.box, { borderColor: colors.border }]}>
      <Line
        icon="car-outline"
        title={t('delivery.estimate', { days: env.deliveryDays })}
        detail={t('delivery.fee', { fee: money(env.shippingFee), threshold: money(env.freeShippingThreshold) })}
      />
      <Line icon="flash-outline" title={t('delivery.sameDay', { fee: money(env.sameDayFee) })} />
      <Pressable accessibilityRole="link" onPress={() => router.push('/stores')}>
        <Line icon="storefront-outline" title={t('delivery.pickup')} />
      </Pressable>
      <Line icon="cash-outline" title={t('delivery.payment')} />
      <Line icon="refresh-outline" title={t('delivery.returns')} />
      <Pressable accessibilityRole="link" onPress={() => router.push('/policies')}>
        <Line icon="document-text-outline" title={t('delivery.policies')} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 32 },
  text: { flex: 1, gap: 2 },
});
