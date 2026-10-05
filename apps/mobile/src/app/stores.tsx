import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Icon } from '@/components/ui/Icon';
import { Screen } from '@/components/ui/Screen';
import { STORE_LOCATIONS, whatsappUrl } from '@/features/info/storeInfo';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function StoresScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  return (
    <Screen>
      <Header title={t('info.stores')} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppText muted>{t('info.storesIntro')}</AppText>
        {STORE_LOCATIONS.map((store) => (
          <View key={store.mapsUrl} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.titleRow}>
              <Icon name="storefront-outline" color={colors.primaryText} />
              <AppText variant="heading" style={styles.flex}>
                {store.name[lang]}
              </AppText>
            </View>
            {store.address[lang].map((line) => (
              <AppText key={line} muted>
                {line}
              </AppText>
            ))}
            <View style={styles.actions}>
              <Button label={t('info.openMaps')} onPress={() => Linking.openURL(store.mapsUrl)} style={styles.flex} />
              <Button
                label={t('info.whatsapp')}
                variant="secondary"
                onPress={() => Linking.openURL(whatsappUrl(store.whatsapp))}
                style={styles.flex}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  card: { padding: spacing.md, gap: spacing.xs, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
