import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { useTheme, type ThemePreference } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

const OPTIONS: ThemePreference[] = ['system', 'light', 'dark'];

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();

  return (
    <Screen>
      <Header title={t('appearance.title')} />
      <View style={styles.row}>
        {OPTIONS.map((option) => (
          <Chip
            key={option}
            label={t(`appearance.${option}`)}
            selected={preference === option}
            onPress={() => setPreference(option)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, padding: spacing.md },
});
