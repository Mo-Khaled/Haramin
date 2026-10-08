import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { backend } from '@/lib/backend';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

const REMOVED_ITEMS = ['wishlist', 'points', 'devices', 'profile'] as const;

/** In-app account deletion, required by the App Store (guideline 5.1.1) for apps that offer sign-in. */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const deleteAccount = async () => {
    if (!auth.session) return;
    setBusy(true);
    setFailed(false);
    try {
      await backend.deleteAccount(auth.session.accessToken);
    } catch {
      setFailed(true);
      setBusy(false);
      return;
    }
    await auth.signOut();
    Alert.alert(t('deleteAccount.doneTitle'), t('deleteAccount.doneBody'));
    router.replace('/');
  };

  const confirm = () =>
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmBody'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirm'), style: 'destructive', onPress: deleteAccount },
    ]);

  return (
    <Screen>
      <Header title={t('deleteAccount.title')} />
      <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.content}>
        <AppText>{t('deleteAccount.intro')}</AppText>
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="label">{t('deleteAccount.removedTitle')}</AppText>
          {REMOVED_ITEMS.map((item) => (
            <AppText key={item} muted>
              {`• ${t(`deleteAccount.removed.${item}`)}`}
            </AppText>
          ))}
        </View>
        <AppText variant="caption" muted>
          {t('deleteAccount.orders')}
        </AppText>
        {failed ? (
          <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
            {t('deleteAccount.failed')}
          </AppText>
        ) : null}
        <Button label={t('deleteAccount.button')} onPress={confirm} loading={busy} disabled={!auth.session} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
});
