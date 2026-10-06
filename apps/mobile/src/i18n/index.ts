import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { DevSettings, I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import en from './en.json';

export type AppLanguage = 'en' | 'ar';

const STORAGE_KEY = 'haramain.language';
const RELOAD_KEY = 'haramain.language.reloadedFor';
const deviceLanguage: AppLanguage = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

/**
 * Expo Go sets each project's layout direction itself (from app.json) on every load and cannot survive an
 * app-initiated reload, so there the direction is left alone and only the text language changes.
 * Development and store builds flip direction natively.
 */
const canFlipDirection = Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

function applyDirection(language: AppLanguage): boolean {
  if (!canFlipDirection) return false;
  const wantRtl = language === 'ar';
  I18nManager.allowRTL(wantRtl);
  if (I18nManager.isRTL !== wantRtl) {
    I18nManager.forceRTL(wantRtl);
    return true;
  }
  return false;
}

/**
 * Expo Go and dev clients lose their native modules after expo-updates reloads the runtime
 * ("Cannot find native module"), so only real builds use it; development uses the plain JS reload.
 */
async function reloadApp(): Promise<void> {
  if (!__DEV__) {
    try {
      const Updates = await import('expo-updates');
      await Updates.reloadAsync();
      return;
    } catch {
      // Fall through to the JS reload.
    }
  }
  DevSettings.reload();
}

/** A reload that did not flip direction within this window is not retried, so a platform that only applies RTL after a full restart cannot loop. */
const RELOAD_RETRY_MS = 30_000;

async function reloadForDirection(language: AppLanguage): Promise<boolean> {
  const [lastLanguage, lastAt] = ((await AsyncStorage.getItem(RELOAD_KEY)) ?? '').split('@');
  if (lastLanguage === language && Date.now() - Number(lastAt) < RELOAD_RETRY_MS) return false;
  await AsyncStorage.setItem(RELOAD_KEY, `${language}@${Date.now()}`);
  await reloadApp();
  return true;
}

/** Restores the saved language on launch. Returns true when a reload is required to flip layout direction. */
export async function restoreLanguage(): Promise<boolean> {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as AppLanguage | null;
  const language = stored ?? deviceLanguage;
  await i18n.changeLanguage(language);
  if (!applyDirection(language)) {
    await AsyncStorage.removeItem(RELOAD_KEY);
    return false;
  }
  return reloadForDirection(language);
}

export async function setLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, language);
  await i18n.changeLanguage(language);
  await AsyncStorage.removeItem(RELOAD_KEY);
  if (applyDirection(language)) await reloadForDirection(language);
}

export default i18n;
