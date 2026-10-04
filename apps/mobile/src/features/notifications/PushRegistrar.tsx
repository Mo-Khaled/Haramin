import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import i18n from '@/i18n';
import { backend } from '@/lib/backend';
import { env } from '@/lib/env';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function getPushToken(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  const status = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!status.granted) return null;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}

/** Registers the device push token with the backend once the customer is signed in. */
export function PushRegistrar() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session || !env.apiUrl) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getPushToken();
        if (token && !cancelled) {
          await backend.registerDevice(session.accessToken, token, Platform.OS, i18n.language === 'ar' ? 'ar' : 'en');
        }
      } catch {
        // Push is optional; failing to register must never block the app.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return null;
}
