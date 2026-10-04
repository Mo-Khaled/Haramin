import { router } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { EmptyState, LoadingState } from '@/components/ui/States';
import { useCart } from '@/features/cart/CartProvider';

const CONFIRMATION_PATTERN = /\/(thank[_-]you|thank_you)|\/orders\/[a-z0-9]+/i;

export default function CheckoutScreen() {
  const { t } = useTranslation();
  const cart = useCart();
  const finished = useRef(false);
  const checkoutUrl = cart.cart?.checkoutUrl;

  if (!checkoutUrl) {
    return (
      <Screen>
        <Header title={t('checkout.title')} />
        <EmptyState message={t('cart.empty')} actionLabel={t('cart.continue')} onAction={() => router.replace('/shop')} />
      </Screen>
    );
  }

  const onNavigate = (nav: WebViewNavigation) => {
    if (finished.current || !CONFIRMATION_PATTERN.test(nav.url)) return;
    finished.current = true;
    cart.reset().finally(() => router.replace('/order-confirmed'));
  };

  return (
    <Screen>
      <Header
        title={t('checkout.title')}
        showBack={false}
        right={<IconButton name="close" label={t('common.close')} onPress={() => router.back()} />}
      />
      <View style={styles.flex}>
        <WebView
          source={{ uri: checkoutUrl }}
          onNavigationStateChange={onNavigate}
          startInLoadingState
          renderLoading={() => <LoadingState />}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures
          originWhitelist={['https://*']}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
