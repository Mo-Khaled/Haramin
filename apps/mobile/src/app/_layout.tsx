import { IBMPlexSans_400Regular, IBMPlexSans_500Medium } from '@expo-google-fonts/ibm-plex-sans';
import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { Platypi_600SemiBold } from '@expo-google-fonts/platypi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { CartProvider } from '@/features/cart/CartProvider';
import { PushRegistrar } from '@/features/notifications/PushRegistrar';
import { WishlistProvider } from '@/features/wishlist/WishlistProvider';
import i18n, { restoreLanguage } from '@/i18n';
import { initSentry, Sentry } from '@/lib/sentry';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { lightPalette, minTouch, radius, spacing } from '@/theme/tokens';
import { useDirectionStyle } from '@/lib/direction';

initSentry();
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function Navigator() {
  const { colors, isDark } = useTheme();
  const direction = useDirectionStyle();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background, ...direction } }}>
        <Stack.Screen name="checkout" options={{ presentation: 'fullScreenModal' }} />
        <Stack.Screen name="order-confirmed" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

function RootLayout() {
  const [fontsLoaded] = useFonts({
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_600SemiBold,
    Platypi_600SemiBold,
  });
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    restoreLanguage().finally(() => setLanguageReady(true));
  }, []);

  const ready = fontsLoaded && languageReady;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    <PushRegistrar />
                    <Navigator />
                    <OfflineBanner />
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);

/**
 * Last-resort screen for a render crash. It sits outside the providers, so it uses plain
 * components and the light palette rather than the themed UI kit.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <View style={errorStyles.root}>
      <Text style={errorStyles.title}>{i18n.t('common.error')}</Text>
      <Pressable accessibilityRole="button" onPress={retry} style={errorStyles.button}>
        <Text style={errorStyles.buttonText}>{i18n.t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

const errorStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: lightPalette.background,
  },
  title: { fontSize: 18, color: lightPalette.text, textAlign: 'center' },
  button: {
    minHeight: minTouch,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    justifyContent: 'center',
    backgroundColor: lightPalette.primary,
  },
  buttonText: { fontSize: 16, color: lightPalette.onPrimary },
});
