import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { Price } from '@/components/ui/Price';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { FreeShippingBar } from '@/features/cart/FreeShippingBar';
import { useCart } from '@/features/cart/CartProvider';
import { formatMoney } from '@/lib/format';
import type { CartLine } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';

function LineItem({ line }: { line: CartLine }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();
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
            {line.vendor}
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
            onPress={() => cart.setQuantity(line.id, line.quantity - 1)}
          />
          <AppText variant="bodyStrong" accessibilityLabel={String(line.quantity)}>
            {line.quantity}
          </AppText>
          <IconButton
            name="add-circle-outline"
            label={t('cart.increase')}
            onPress={() => cart.setQuantity(line.id, line.quantity + 1)}
          />
          <View style={styles.spacer} />
          <IconButton name="trash-outline" label={t('cart.remove')} onPress={() => cart.removeLine(line.id)} color={colors.danger} />
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
          style={[styles.input, { color: colors.text, borderColor: invalid ? colors.danger : colors.border, backgroundColor: colors.surface }]}
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

export default function CartScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();

  if (cart.loading) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  const data = cart.cart;
  if (!data || data.lines.length === 0) {
    return (
      <Screen>
        <EmptyState message={t('cart.empty')} actionLabel={t('cart.continue')} onAction={() => router.push('/shop')} />
      </Screen>
    );
  }

  const subtotal = parseFloat(data.subtotal.amount);

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <AppText variant="title" accessibilityRole="header">
            {t('cart.title')}
          </AppText>
          <FreeShippingBar subtotal={subtotal} />
          {data.lines.map((line) => (
            <LineItem key={line.id} line={line} />
          ))}
          <DiscountField />
        </ScrollView>
        <View style={[styles.footer, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.totalRow}>
            <AppText variant="bodyStrong">{t('cart.total')}</AppText>
            <Price price={data.total} large />
          </View>
          <AppText variant="caption" muted>
            {t('cart.shippingNote')}
          </AppText>
          <Button label={t('cart.checkout')} onPress={() => router.push('/checkout')} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
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
  footer: { padding: spacing.md, gap: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
