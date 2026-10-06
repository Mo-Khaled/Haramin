import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { I18nManager, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCart } from '@/features/cart/CartProvider';
import { useIsRTL } from '@/lib/direction';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { cart } = useCart();
  const isRTL = useIsRTL();
  const count = cart?.totalQuantity ?? 0;

  const tabs = [
    <NativeTabs.Trigger key="index" name="index">
      <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="shop" name="shop">
      <NativeTabs.Trigger.Label>{t('tabs.shop')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} md="storefront" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="wishlist" name="wishlist">
      <NativeTabs.Trigger.Label>{t('tabs.wishlist')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="favorite" />
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="cart" name="cart">
      <NativeTabs.Trigger.Label>{t('tabs.cart')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'cart', selected: 'cart.fill' }} md="shopping_cart" />
      <NativeTabs.Trigger.Badge hidden={count === 0}>{String(count)}</NativeTabs.Trigger.Badge>
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="account" name="account">
      <NativeTabs.Trigger.Label>{t('tabs.account')}</NativeTabs.Trigger.Label>
      <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
    </NativeTabs.Trigger>,
  ];
  // The native tab bar ignores the JS layout direction; a natively-RTL build mirrors it by itself.
  const ordered = isRTL && !I18nManager.isRTL ? [...tabs].reverse() : tabs;

  return (
    <NativeTabs
      // iOS draws its own translucent glass bar; a forced colour makes it look muddy.
      backgroundColor={Platform.OS === 'android' ? colors.background : undefined}
      indicatorColor={colors.surfaceAlt}
      tintColor={colors.primaryText}
      labelStyle={{ selected: { color: colors.primaryText } }}>
      {ordered}
    </NativeTabs>
  );
}
