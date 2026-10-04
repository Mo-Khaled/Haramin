import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { env } from '@/lib/env';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

interface RowProps {
  icon: IconName;
  label: string;
  onPress: () => void;
}

function Row({ icon, label, onPress }: RowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}>
      <Icon name={icon} color={colors.primary} />
      <AppText style={styles.rowLabel}>{label}</AppText>
      <Icon name="chevron-forward" size="sm" color={colors.textSecondary} />
    </Pressable>
  );
}

export default function AccountScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuth();
  const [signInFailed, setSignInFailed] = useState(false);

  const go = (href: Href) => () => router.push(href);
  const openWhatsapp = () => {
    const number = env.whatsappNumber.replace(/\D/g, '');
    if (number) Linking.openURL(`https://wa.me/${number}`);
  };

  const signIn = async () => {
    setSignInFailed(false);
    try {
      await auth.signIn();
    } catch {
      setSignInFailed(true);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" accessibilityRole="header">
          {t('account.title')}
        </AppText>

        {auth.customer ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
            <AppText variant="heading">
              {t('account.hello', { name: auth.customer.firstName ?? auth.customer.email ?? '' })}
            </AppText>
            {auth.customer.email ? (
              <AppText muted>{auth.customer.email}</AppText>
            ) : null}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
            <AppText muted>{t('account.signInHint')}</AppText>
            {auth.configured ? (
              <Button label={t('account.signIn')} onPress={signIn} loading={auth.loading} />
            ) : (
              <AppText variant="caption" muted>
                {t('account.notConfigured')}
              </AppText>
            )}
            {signInFailed ? (
              <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
                {t('account.signInFailed')}
              </AppText>
            ) : null}
          </View>
        )}

        {auth.session ? (
          <View>
            <Row icon="receipt-outline" label={t('account.orders')} onPress={go('/orders')} />
            <Row icon="gift-outline" label={t('account.loyalty')} onPress={go('/loyalty')} />
          </View>
        ) : null}

        <View>
          <Row icon="language-outline" label={t('account.language')} onPress={go('/language')} />
          <Row icon="document-text-outline" label={t('account.policies')} onPress={go('/policies')} />
          {env.whatsappNumber ? (
            <Row icon="logo-whatsapp" label={t('account.whatsapp')} onPress={openWhatsapp} />
          ) : null}
        </View>

        {auth.session ? (
          <Button label={t('account.signOut')} variant="secondary" onPress={() => auth.signOut()} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  row: {
    minHeight: minTouch + 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { flex: 1 },
});
