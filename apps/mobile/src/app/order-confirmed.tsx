import { router } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { env } from '@/lib/env';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function OrderConfirmedScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const sendProof = () => {
    const number = env.whatsappNumber.replace(/\D/g, '');
    if (number) Linking.openURL(`https://wa.me/${number}`);
  };

  return (
    <Screen>
      <View style={styles.center}>
        <Icon name="checkmark-circle" size="lg" color={colors.success} />
        <AppText variant="title" accessibilityRole="header">
          {t('checkout.confirmedTitle')}
        </AppText>
        <AppText muted style={styles.text}>
          {t('checkout.confirmedBody')}
        </AppText>

        {env.whatsappNumber ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
            <AppText variant="bodyStrong">{t('checkout.instapayTitle')}</AppText>
            <AppText muted>{t('checkout.instapayBody')}</AppText>
            <Button label={t('checkout.sendProof')} variant="secondary" onPress={sendProof} />
          </View>
        ) : null}

        <Button label={t('checkout.backToShop')} onPress={() => router.replace('/')} style={styles.full} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  text: { textAlign: 'center' },
  card: { alignSelf: 'stretch', padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  full: { alignSelf: 'stretch' },
});
