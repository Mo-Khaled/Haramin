import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { DevSettings, I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import ar from './ar.json';
import en from './en.json';

export type AppLanguage = 'en' | 'ar';

const STORAGE_KEY = 'haramain.language';
const deviceLanguage: AppLanguage = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: deviceLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

function applyDirection(language: AppLanguage): boolean {
  const wantRtl = language === 'ar';
  I18nManager.allowRTL(wantRtl);
  if (I18nManager.isRTL !== wantRtl) {
    I18nManager.forceRTL(wantRtl);
    return true;
  }
  return false;
}

async function reloadApp(): Promise<void> {
  try {
    const Updates = await import('expo-updates');
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}

/** Restores the saved language on launch. Returns true when a reload is required to flip layout direction. */
export async function restoreLanguage(): Promise<boolean> {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as AppLanguage | null;
  const language = stored ?? deviceLanguage;
  await i18n.changeLanguage(language);
  const needsReload = applyDirection(language);
  if (needsReload) await reloadApp();
  return needsReload;
}

export async function setLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, language);
  await i18n.changeLanguage(language);
  if (applyDirection(language)) await reloadApp();
}

export default i18n;
