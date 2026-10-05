import { LOYALTY } from '@haramain/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { ErrorState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { backend } from '@/lib/backend';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function LoyaltyScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? '';

  const balance = useQuery({ queryKey: ['loyalty-balance', token], queryFn: () => backend.getLoyaltyBalance(token), enabled: !!session });
  const history = useQuery({ queryKey: ['loyalty-history', token], queryFn: () => backend.getLoyaltyHistory(token), enabled: !!session });
  const redeem = useMutation({
    mutationFn: (points: number) => backend.redeemPoints(token, points),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loyalty-balance'] }).then(() => queryClient.invalidateQueries({ queryKey: ['loyalty-history'] })),
  });

  if (!session) {
    return (
      <Screen>
        <Header title={t('loyalty.title')} />
        <SignInPrompt message={t('loyalty.needSignIn')} />
      </Screen>
    );
  }
  if (balance.isLoading) {
    return (
      <Screen>
        <Header title={t('loyalty.title')} />
        <LoadingState />
      </Screen>
    );
  }
  if (balance.isError || !balance.data) {
    return (
      <Screen>
        <Header title={t('loyalty.title')} />
        <ErrorState onRetry={() => balance.refetch()} />
      </Screen>
    );
  }

  const points = balance.data.points;
  const canRedeem = points >= LOYALTY.redeemStep;

  return (
    <Screen>
      <Header title={t('loyalty.title')} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.primary }]}>
          <AppText variant="label" color={colors.onPrimary}>
            {t('loyalty.balance')}
          </AppText>
          <AppText variant="display" color={colors.onPrimary}>
            {t('loyalty.points', { count: points })}
          </AppText>
        </View>
        <AppText muted>{t('loyalty.howItWorks')}</AppText>

        <Button
          label={t('loyalty.redeemAmount', {
            points: LOYALTY.redeemStep,
            amount: formatMoney(LOYALTY.redeemStepValueEgp, i18n.language),
          })}
          onPress={() => redeem.mutate(LOYALTY.redeemStep)}
          loading={redeem.isPending}
          disabled={!canRedeem}
        />
        {redeem.isSuccess ? (
          <AppText color={colors.success} accessibilityLiveRegion="polite">
            {t('loyalty.redeemed')}
          </AppText>
        ) : null}
        {redeem.isError ? (
          <AppText color={colors.danger} accessibilityLiveRegion="polite">
            {t('common.error')}
          </AppText>
        ) : null}

        <AppText variant="heading" accessibilityRole="header">
          {t('loyalty.history')}
        </AppText>
        {history.data?.entries.length ? (
          history.data.entries.map((entry) => (
            <View key={entry.id} style={[styles.entry, { borderColor: colors.border }]}>
              <View style={styles.flex}>
                <AppText variant="label">{entry.note ?? entry.type}</AppText>
                <AppText variant="caption" muted>
                  {new Date(entry.createdAt).toLocaleDateString(i18n.language)}
                </AppText>
              </View>
              <AppText variant="bodyStrong" color={entry.points >= 0 ? colors.success : colors.danger}>
                {entry.points > 0 ? `+${entry.points}` : String(entry.points)}
              </AppText>
            </View>
          ))
        ) : (
          <AppText muted>{t('loyalty.emptyHistory')}</AppText>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, borderRadius: radius.lg, gap: spacing.xs },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});
