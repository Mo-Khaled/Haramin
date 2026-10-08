import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ListRow } from '@/components/ui/ListRow';
import { RowGroup } from '@/components/ui/RowGroup';
import { TabHeader } from '@/components/ui/TabHeader';
import { TabScroll } from '@/components/ui/TabScroll';
import { useAuth } from '@/features/auth/AuthProvider';
import { STORE_INFO, whatsappUrl } from '@/features/info/storeInfo';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const go = (href: Href) => () => router.push(href);

const THEME_LABEL: Record<ThemePreference, string> = {
  system: 'appearance.system',
  light: 'appearance.light',
  dark: 'appearance.dark',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="label" muted accessibilityRole="header">
        {title}
      </AppText>
      <RowGroup>{children}</RowGroup>
    </View>
  );
}

function WelcomeCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuth();
  const [failed, setFailed] = useState(false);

  const signIn = async () => {
    setFailed(false);
    try {
      await auth.signIn();
    } catch {
      setFailed(true);
    }
  };

  if (auth.customer) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <AppText variant="heading">{t('account.hello', { name: auth.customer.firstName ?? auth.customer.email ?? '' })}</AppText>
        {auth.customer.email ? <AppText muted>{auth.customer.email}</AppText> : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
      <AppText variant="heading">{t('account.welcome')}</AppText>
      <AppText muted>{t('account.welcomeBody')}</AppText>
      {auth.configured ? (
        <Button label={t('account.signIn')} onPress={signIn} loading={auth.loading} />
      ) : (
        <AppText variant="caption" muted>
          {t('account.notConfigured')}
        </AppText>
      )}
      {failed ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {t('account.signInFailed')}
        </AppText>
      ) : null}
    </View>
  );
}

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const { preference } = useTheme();
  const auth = useAuth();

  return (
    <TabScroll header={<TabHeader title={t('account.title')} />}>
      <View style={styles.content}>
      <WelcomeCard />

      <Section title={t('account.manage')}>
        <ListRow icon="receipt-outline" label={t('account.track')} onPress={go('/orders')} />
        <ListRow icon="gift-outline" label={t('account.loyalty')} onPress={go('/loyalty')} />
        <ListRow icon="heart-outline" label={t('tabs.wishlist')} onPress={go('/wishlist')} />
      </Section>

      <Section title={t('account.learnMore')}>
        <ListRow icon="storefront-outline" label={t('info.stores')} onPress={go('/stores')} />
        <ListRow icon="information-circle-outline" label={t('info.about')} onPress={go('/about')} />
        <ListRow icon="document-text-outline" label={t('account.legal')} onPress={go('/policies')} />
        <ListRow icon="chatbubbles-outline" label={t('info.contact')} onPress={go('/contact')} />
        <ListRow
          icon="logo-whatsapp"
          label={t('account.whatsapp')}
          onPress={() => Linking.openURL(whatsappUrl(STORE_INFO.whatsapp))}
        />
      </Section>

      <Section title={t('account.settings')}>
        <ListRow
          icon="language-outline"
          label={t('account.language')}
          detail={i18n.language === 'ar' ? t('language.arabic') : t('language.english')}
          onPress={go('/language')}
        />
        <ListRow
          icon="contrast-outline"
          label={t('account.appearance')}
          detail={t(THEME_LABEL[preference])}
          onPress={go('/appearance')}
        />
      </Section>

      {auth.session ? (
        <>
          <Button label={t('account.signOut')} variant="secondary" onPress={() => auth.signOut()} />
          <RowGroup>
            <ListRow icon="trash-outline" label={t('deleteAccount.title')} onPress={go('/delete-account')} />
          </RowGroup>
        </>
      ) : null}
      </View>
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.lg },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  section: { gap: spacing.xs },
});
