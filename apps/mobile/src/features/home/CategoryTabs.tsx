import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/Chip';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { CATEGORY_TABS, type CategoryTab } from './homeContent';

function open(tab: CategoryTab) {
  if (tab.target === 'brands') router.push({ pathname: '/shop', params: { view: 'brands' } });
  else router.push({ pathname: '/collection/[handle]', params: { handle: tab.target } });
}

/** Horizontal shortcut row; on iOS it sticks below the status bar while the home screen scrolls. */
export function CategoryTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.background }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORY_TABS.map((tab) => (
          <Chip key={tab.target} label={t(tab.labelKey)} onPress={() => open(tab)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
});
