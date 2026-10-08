import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Header } from '@/components/ui/Header';
import { OptionList, type Option } from '@/components/ui/OptionList';
import { Screen } from '@/components/ui/Screen';
import { setLanguage, type AppLanguage } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

/** Each language is named in its own script so it can always be found, whichever language is active. */
const LANGUAGES: Option<AppLanguage>[] = [
  { value: 'en', label: 'English' },
  { value: 'ar', label: 'العربية' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const current: AppLanguage = i18n.language === 'ar' ? 'ar' : 'en';

  return (
    <Screen>
      <Header title={t('language.title')} />
      <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.body}>
        <OptionList options={LANGUAGES} selected={current} onSelect={(language) => language !== current && setLanguage(language)} />
        <AppText variant="caption" muted>
          {t('language.restartBody')}
        </AppText>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, gap: spacing.md },
});
