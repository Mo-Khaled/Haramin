import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { darkPalette, lightPalette, type Palette } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'haramain.theme';

interface ThemeValue {
  colors: Palette;
  isDark: boolean;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Pushes the choice down to native UI (tab bar, keyboard, WebView); 'unspecified' follows the phone. */
function applyToNative(preference: ThemePreference): void {
  Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
          applyToNative(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    applyToNative(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const isDark = preference === 'system' ? scheme === 'dark' : preference === 'dark';
  const value = useMemo<ThemeValue>(
    () => ({ colors: isDark ? darkPalette : lightPalette, isDark, preference, setPreference }),
    [isDark, preference, setPreference],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
