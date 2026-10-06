import { ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Header } from '@/components/ui/Header';
import { OptionList, type Option } from '@/components/ui/OptionList';
import { Screen } from '@/components/ui/Screen';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();
  const options: Option<ThemePreference>[] = THEMES.map((value) => ({ value, label: t(`appearance.${value}`) }));

  return (
    <Screen>
      <Header title={t('appearance.title')} />
      <ScrollView contentContainerStyle={styles.body}>
        <OptionList options={options} selected={preference} onSelect={setPreference} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: spacing.md },
});
