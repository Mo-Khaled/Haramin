import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, spacing } from '@/theme/tokens';
import { CATEGORY_TABS, type CategoryTab } from './homeContent';

function open(tab: CategoryTab) {
  if (tab.target === 'brands') router.push({ pathname: '/shop', params: { view: 'brands' } });
  else router.push({ pathname: '/collection/[handle]', params: { handle: tab.target } });
}

/** Plain-text shortcut row on the brand block; on iOS it sticks below the status bar while the home screen scrolls. */
export function CategoryTabs() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const outline = `${colors.onHeader}80`;
  return (
    <View style={{ backgroundColor: colors.header }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORY_TABS.map((tab) => (
          <Pressable
            key={tab.target}
            accessibilityRole="button"
            onPress={() => open(tab)}
            style={({ pressed }) => [styles.tab, { borderColor: outline, opacity: pressed ? 0.7 : 1 }]}>
            <AppText variant="bodyStrong" color={colors.onHeader}>
              {t(tab.labelKey)}
            </AppText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: { minHeight: minTouch - 8, justifyContent: 'center', paddingHorizontal: spacing.md, borderWidth: StyleSheet.hairlineWidth },
});
