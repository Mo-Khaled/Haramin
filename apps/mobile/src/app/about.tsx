import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { NO_OVERSCROLL } from '@/lib/scroll';

const STATS = ['years', 'brands', 'fragrances', 'authentic'] as const;
const TIMELINE = ['2002', 'import', '2020', '2025'] as const;
const REASONS: { key: string; icon: IconName }[] = [
  { key: 'authentic', icon: 'shield-checkmark-outline' },
  { key: 'prices', icon: 'pricetag-outline' },
  { key: 'delivery', icon: 'car-outline' },
  { key: 'experts', icon: 'ribbon-outline' },
];

/** Brand story, adapted from the website's About page (which Shopify serves as theme sections). */
export default function AboutScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <Header title={t('info.about')} />
      <ScrollView {...NO_OVERSCROLL} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Logo />
          <AppText variant="title" style={styles.center}>
            {t('about.headline')}
          </AppText>
          <AppText muted style={styles.center}>
            {t('about.since')}
          </AppText>
        </View>

        <View style={[styles.stats, { backgroundColor: colors.primary }]}>
          {STATS.map((key) => (
            <View key={key} style={styles.stat}>
              <AppText variant="title" color={colors.onPrimary}>
                {t(`about.stats.${key}.value`)}
              </AppText>
              <AppText variant="caption" color={colors.onPrimary} style={styles.center}>
                {t(`about.stats.${key}.label`)}
              </AppText>
            </View>
          ))}
        </View>

        <AppText variant="heading" accessibilityRole="header">
          {t('about.storyTitle')}
        </AppText>
        {TIMELINE.map((key) => (
          <View key={key} style={styles.timelineItem}>
            <View style={[styles.dot, { backgroundColor: colors.primaryText }]} />
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(`about.timeline.${key}.title`)}</AppText>
              <AppText muted>{t(`about.timeline.${key}.body`)}</AppText>
            </View>
          </View>
        ))}

        <AppText variant="heading" accessibilityRole="header">
          {t('about.whyTitle')}
        </AppText>
        <AppText muted>{t('about.agency')}</AppText>
        {REASONS.map((reason) => (
          <View key={reason.key} style={[styles.reason, { backgroundColor: colors.surface }]}>
            <Icon name={reason.icon} color={colors.primaryText} />
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{t(`about.why.${reason.key}.title`)}</AppText>
              <AppText muted>{t(`about.why.${reason.key}.body`)}</AppText>
            </View>
          </View>
        ))}

        <Button label={t('info.findStore')} onPress={() => router.push('/stores')} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  center: { textAlign: 'center' },
  stats: { flexDirection: 'row', borderRadius: radius.md, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 2 },
  timelineItem: { flexDirection: 'row', gap: spacing.md },
  dot: { width: 10, height: 10, borderRadius: radius.pill, marginTop: 7 },
  flex: { flex: 1 },
  reason: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radius.md },
});
