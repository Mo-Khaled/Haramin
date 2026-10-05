import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';
import { AppText } from './AppText';

interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

type ShowToast = (options: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);
const VISIBLE_MS = 3200;

/**
 * Shows one short confirmation at a time near the top of the screen, where it never covers the
 * tab bar or a screen's primary button.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(progress, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setToast(null));
  }, [progress]);

  const show = useCallback<ShowToast>(
    (options) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(options);
      Animated.timing(progress, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      hideTimer.current = setTimeout(hide, VISIBLE_MS);
    },
    [hide, progress],
  );

  useEffect(() => () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });

  return (
    <ToastContext.Provider value={useMemo(() => show, [show])}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { top: insets.top + spacing.sm, opacity: progress, transform: [{ translateY }] }]}>
          <View
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            style={[styles.toast, { backgroundColor: colors.text }]}>
            <AppText variant="label" color={colors.background} style={styles.message}>
              {toast.message}
            </AppText>
            {toast.actionLabel && toast.onAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  toast.onAction?.();
                  hide();
                }}
                style={styles.action}>
                <AppText variant="label" color={colors.background} style={styles.actionText}>
                  {toast.actionLabel}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: 'absolute', start: spacing.md, end: spacing.md, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: minTouch,
    paddingStart: spacing.md,
    borderRadius: radius.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: { flex: 1, paddingVertical: spacing.sm },
  action: { minHeight: minTouch, justifyContent: 'center', paddingHorizontal: spacing.md },
  actionText: { textDecorationLine: 'underline' },
});
