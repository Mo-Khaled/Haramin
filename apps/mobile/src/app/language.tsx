import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { setLanguage, type AppLanguage } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const choose = (language: AppLanguage) => {
    if (language !== i18n.language) setLanguage(language);
  };

  return (
    <Screen>
      <Header title={t('language.title')} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Chip label={t('language.english')} selected={i18n.language === 'en'} onPress={() => choose('en')} />
          <Chip label={t('language.arabic')} selected={i18n.language === 'ar'} onPress={() => choose('ar')} />
        </View>
        <AppText muted>{t('language.restartBody')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
