import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { TabScroll } from '@/components/ui/TabScroll';
import { FreeShippingBar } from '@/features/cart/FreeShippingBar';
import { useBrandName } from '@/features/catalog/brandNames';
import { useCart } from '@/features/cart/CartProvider';
import { formatMoney } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import type { CartLine } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

function LineItem({ line }: { line: CartLine }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();
  const vendor = useBrandName(line.vendor);
  const showVariant = line.variantTitle && line.variantTitle !== 'Default Title';

  return (
    <View style={[styles.line, { backgroundColor: colors.surface }]}>
      {line.image ? (
        <Image source={{ uri: line.image.url }} style={styles.thumb} contentFit="cover" accessibilityLabel={line.productTitle} />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.lineBody}>
        <Pressable
          accessibilityRole="link"
          onPress={() => router.push({ pathname: '/product/[handle]', params: { handle: line.productHandle } })}>
          <AppText variant="caption" muted>
            {vendor}
          </AppText>
          <AppText variant="label" numberOfLines={2}>
            {line.productTitle}
          </AppText>
        </Pressable>
        {showVariant ? (
          <AppText variant="caption" muted>
            {line.variantTitle}
          </AppText>
        ) : null}
        <AppText variant="label">{formatMoney(line.total.amount, i18n.language, line.total.currencyCode)}</AppText>
        <View style={styles.stepper}>
          <IconButton
            name="remove-circle-outline"
            label={t('cart.decrease')}
            onPress={() => {
              haptics.tap();
              cart.setQuantity(line.id, line.quantity - 1);
            }}
            disabled={cart.busy}
          />
          <AppText variant="bodyStrong" accessibilityLabel={String(line.quantity)}>
            {line.quantity}
          </AppText>
          <IconButton
            name="add-circle-outline"
            label={t('cart.increase')}
            onPress={() => {
              haptics.tap();
              cart.setQuantity(line.id, line.quantity + 1);
            }}
            disabled={cart.busy}
          />
          <View style={styles.spacer} />
          <IconButton
            name="trash-outline"
            label={t('cart.remove')}
            onPress={() => cart.removeLine(line.id)}
            color={colors.danger}
            disabled={cart.busy}
          />
        </View>
      </View>
    </View>
  );
}

function DiscountField() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  const applied = cart.cart?.discountCodes.find((d) => d.applicable);

  const apply = async () => {
    if (!code.trim()) return;
    const ok = await cart.applyDiscount(code);
    setInvalid(!ok);
    if (ok) setCode('');
  };

  if (applied) {
    return (
      <View style={[styles.discountRow, { backgroundColor: colors.surfaceAlt }]}>
        <Icon name="pricetag" color={colors.success} />
        <AppText variant="label" style={styles.flex}>
          {t('cart.discountApplied', { code: applied.code })}
        </AppText>
        <IconButton name="close" label={t('cart.remove')} onPress={() => cart.clearDiscounts()} />
      </View>
    );
  }

  return (
    <View style={styles.discountWrap}>
      <View style={styles.discountRow}>
        <TextInput
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setInvalid(false);
          }}
          placeholder={t('cart.discountPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel={t('cart.discountPlaceholder')}
          style={[styles.input, { textAlign: 'left', color: colors.text, borderColor: invalid ? colors.danger : colors.border, backgroundColor: colors.surface }]}
        />
        <Button label={t('common.apply')} variant="secondary" onPress={apply} loading={cart.busy} />
      </View>
      {invalid ? (
        <AppText variant="caption" color={colors.danger} accessibilityLiveRegion="polite">
          {t('cart.discountInvalid')}
        </AppText>
      ) : null}
    </View>
  );
}

function SummaryRow({ label, amount, strong }: { label: string; amount: string; strong?: boolean }) {
  const { i18n } = useTranslation();
  return (
    <View style={styles.totalRow}>
      <AppText variant={strong ? 'bodyStrong' : 'body'} muted={!strong}>
        {label}
      </AppText>
      <AppText variant={strong ? 'heading' : 'body'}>{formatMoney(amount, i18n.language)}</AppText>
    </View>
  );
}

function OrderSummary() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { cart, busy } = useCart();
  if (!cart) return null;

  const subtotal = parseFloat(cart.subtotal.amount);
  const total = parseFloat(cart.total.amount);
  const extraCharges = total - subtotal;

  return (
    <View style={[styles.summary, { backgroundColor: colors.surface }]}>
      <SummaryRow label={t('cart.subtotal')} amount={cart.subtotal.amount} />
      {extraCharges > 0 ? <SummaryRow label={t('cart.estimatedShipping')} amount={extraCharges.toFixed(2)} /> : null}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <SummaryRow label={t('cart.total')} amount={cart.total.amount} strong />
      <AppText variant="caption" muted>
        {t('cart.shippingNote')}
      </AppText>
      <Button label={t('cart.checkout')} onPress={() => router.push('/checkout')} disabled={busy} />
    </View>
  );
}

export default function CartScreen() {
  const { t } = useTranslation();
  const cart = useCart();
  const data = cart.cart;

  if (cart.loading) {
    return (
      <TabScroll>
        <LoadingState />
      </TabScroll>
    );
  }

  if (!data || data.lines.length === 0) {
    return (
      <TabScroll>
        <EmptyState message={t('cart.empty')} actionLabel={t('cart.continue')} onAction={() => router.push('/shop')} />
      </TabScroll>
    );
  }

  return (
    <TabScroll contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppText variant="title" accessibilityRole="header">
        {t('cart.title')}
      </AppText>
      <FreeShippingBar subtotal={parseFloat(data.subtotal.amount)} />
      {data.lines.map((line) => (
        <LineItem key={line.id} line={line} />
      ))}
      <DiscountField />
      <OrderSummary />
    </TabScroll>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md },
  line: { flexDirection: 'row', gap: spacing.md, padding: spacing.sm, borderRadius: radius.md },
  thumb: { width: 88, height: 110, borderRadius: radius.sm },
  lineBody: { flex: 1, gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
  discountWrap: { gap: spacing.xs },
  discountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: 0, borderRadius: radius.md },
  input: {
    flex: 1,
    minHeight: minTouch,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  summary: { padding: spacing.md, gap: spacing.sm, borderRadius: radius.md },
  divider: { height: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
