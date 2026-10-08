import { useQuery } from '@tanstack/react-query';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/States';
import { useAuth } from '@/features/auth/AuthProvider';
import { SignInPrompt } from '@/features/auth/SignInPrompt';
import { fetchOrders, type OrderSummary } from '@/lib/customerAccount';
import { formatMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

function OrderRow({ order }: { order: OrderSummary }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const statusKey = order.fulfillmentStatus ?? order.financialStatus ?? 'PENDING';
  const status = t(`orders.status.${statusKey}`, { defaultValue: statusKey });
  const date = new Date(order.processedAt).toLocaleDateString(i18n.language);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.rowTop}>
        <AppText variant="bodyStrong">{t('orders.number', { name: order.name })}</AppText>
        <AppText variant="label" color={colors.primaryText}>
          {status}
        </AppText>
      </View>
      <AppText variant="caption" muted>
        {date} · {t('orders.items', { count: order.itemCount })}
      </AppText>
      <AppText variant="label">{formatMoney(order.total.amount, i18n.language, order.total.currencyCode)}</AppText>
      {order.trackingUrl ? (
        <Pressable accessibilityRole="link" onPress={() => openTrackingUrl(order.trackingUrl!)} style={styles.track}>
          <AppText variant="label" color={colors.primaryText}>
            {t('orders.track')}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Tracking links come from fulfillment data, so only plain web links may open (never tel:, intent: or app schemes). */
function openTrackingUrl(url: string): void {
  if (/^https:\/\//i.test(url)) Linking.openURL(url).catch(() => undefined);
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const query = useQuery({
    queryKey: ['orders', session?.accessToken],
    queryFn: () => fetchOrders(session!.accessToken),
    enabled: !!session,
  });

  return (
    <Screen>
      <Header title={t('orders.title')} />
      {!session ? (
        <SignInPrompt message={t('orders.needSignIn')} />
      ) : query.isLoading ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} />
      ) : !query.data?.length ? (
        <EmptyState message={t('orders.empty')} />
      ) : (
        <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.list}>
          {query.data.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { minHeight: 44, justifyContent: 'center' },
});
