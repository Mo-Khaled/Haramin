import { router } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useCart } from '@/features/cart/CartProvider';
import { classifyCheckoutUrl } from '@/features/checkout/checkoutNavigation';
import { env } from '@/lib/env';
import { useTheme } from '@/theme/ThemeProvider';

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cart = useCart();
  const finished = useRef(false);
  const checkoutUrl = cart.cart?.checkoutUrl;

  const confirmLeave = useCallback(() => {
    Alert.alert(t('checkout.leaveTitle'), t('checkout.leaveBody'), [
      { text: t('checkout.stay'), style: 'cancel' },
      { text: t('checkout.leave'), style: 'destructive', onPress: () => router.back() },
    ]);
  }, [t]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmLeave();
      return true;
    });
    return () => subscription.remove();
  }, [confirmLeave]);

  /** Returns whether the WebView may load the URL; completes or exits the checkout as a side effect. */
  const handleUrl = useCallback(
    (url: string): boolean => {
      if (finished.current) return false;
      const decision = classifyCheckoutUrl(url, env.shopDomain);
      if (decision === 'complete') {
        finished.current = true;
        cart.reset().finally(() => router.replace('/order-confirmed'));
        return true;
      }
      if (decision === 'exit') {
        finished.current = true;
        router.back();
        return false;
      }
      return true;
    },
    [cart],
  );

  if (!checkoutUrl) {
    return (
      <Screen>
        <Header title={t('checkout.title')} />
        <EmptyState message={t('cart.empty')} actionLabel={t('cart.continue')} onAction={() => router.replace('/shop')} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header
        title={t('checkout.title')}
        showBack={false}
        right={<IconButton name="close" label={t('common.close')} color={colors.onHeader} onPress={confirmLeave} />}
      />
      <View style={styles.flex}>
        <WebView
          source={{ uri: checkoutUrl }}
          onShouldStartLoadWithRequest={(request: ShouldStartLoadRequest) =>
            request.isTopFrame === false ? true : handleUrl(request.url)
          }
          onNavigationStateChange={(nav: WebViewNavigation) => {
            handleUrl(nav.url);
          }}
          startInLoadingState
          renderLoading={() => <LoadingState />}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
