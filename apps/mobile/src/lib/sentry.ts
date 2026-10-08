import * as Sentry from '@sentry/react-native';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Crash and error reporting for customers' phones. Off in development so local testing does not
 * fill the dashboard; no personal data is attached (customers are identified only by Shopify id).
 */
export function initSentry(): void {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    enabled: !__DEV__,
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
}

/**
 * For best-effort work (saving a preference, registering for push, opening a link): the app carries on without it,
 * but the failure is still recorded instead of disappearing.
 */
export function reportFailure(error: unknown): void {
  Sentry.captureException(error);
}

export { Sentry };
