import { LOYALTY } from '@haramain/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
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
import { NO_OVERSCROLL } from '@/lib/scroll';

type HistoryEntry = Awaited<ReturnType<typeof backend.getLoyaltyHistory>>['entries'][number];

const historyQuery = (token: string) => ({ queryKey: ['loyalty-history', token], queryFn: () => backend.getLoyaltyHistory(token) });

function LoyaltyPage({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <Header title={t('loyalty.title')} />
      {children}
    </Screen>
  );
}

function BalanceCard({ points }: { points: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <AppText variant="label" color={colors.onPrimary}>
        {t('loyalty.balance')}
      </AppText>
      <AppText variant="display" color={colors.onPrimary}>
        {t('loyalty.points', { count: points })}
      </AppText>
    </View>
  );
}

function RedeemButton({ token, points }: { token: string; points: number }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const redeem = useMutation({
    mutationFn: (amount: number) => backend.redeemPoints(token, amount),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['loyalty-balance'] }).then(() => queryClient.invalidateQueries({ queryKey: ['loyalty-history'] })),
  });

  return (
    <>
      <Button
        label={t('loyalty.redeemAmount', { points: LOYALTY.redeemStep, amount: formatMoney(LOYALTY.redeemStepValueEgp, i18n.language) })}
        onPress={() => redeem.mutate(LOYALTY.redeemStep)}
        loading={redeem.isPending}
        disabled={points < LOYALTY.redeemStep}
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
    </>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const order = entry.orderId ? `#${entry.orderId.split(':')[0]}` : null;
  const date = new Date(entry.createdAt).toLocaleDateString(i18n.language);
  return (
    <View style={[styles.entry, { borderColor: colors.border }]}>
      <View style={styles.flex}>
        <AppText variant="label">{t(`loyalty.entry.${entry.type}`, { defaultValue: entry.type })}</AppText>
        <AppText variant="caption" muted>
          {[order, date].filter(Boolean).join(' · ')}
        </AppText>
      </View>
      <AppText variant="bodyStrong" color={entry.points >= 0 ? colors.success : colors.danger}>
        {entry.points > 0 ? `+${entry.points}` : String(entry.points)}
      </AppText>
    </View>
  );
}

function History({ token }: { token: string }) {
  const { t } = useTranslation();
  const history = useQuery(historyQuery(token));
  return (
    <>
      <AppText variant="heading" accessibilityRole="header">
        {t('loyalty.history')}
      </AppText>
      {history.data?.entries.length ? (
        history.data.entries.map((entry) => <HistoryRow key={entry.id} entry={entry} />)
      ) : (
        <AppText muted>{t('loyalty.emptyHistory')}</AppText>
      )}
    </>
  );
}

function LoyaltyBalance({ token }: { token: string }) {
  const { t } = useTranslation();
  const balance = useQuery({ queryKey: ['loyalty-balance', token], queryFn: () => backend.getLoyaltyBalance(token) });
  // Started alongside the balance so the history is ready when the page appears.
  useQuery(historyQuery(token));

  if (balance.isLoading) return <LoadingState />;
  if (balance.isError || !balance.data) return <ErrorState onRetry={() => balance.refetch()} />;

  return (
    <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.content}>
      <BalanceCard points={balance.data.points} />
      <AppText muted>{t('loyalty.howItWorks')}</AppText>
      <RedeemButton token={token} points={balance.data.points} />
      <History token={token} />
    </ScrollView>
  );
}

export default function LoyaltyScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  return (
    <LoyaltyPage>
      {session ? <LoyaltyBalance token={session.accessToken} /> : <SignInPrompt message={t('loyalty.needSignIn')} />}
    </LoyaltyPage>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, borderRadius: radius.lg, gap: spacing.xs },
  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
});
