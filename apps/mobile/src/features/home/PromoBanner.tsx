import * as Clipboard from 'expo-clipboard';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/components/ui/Toast';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch, radius, spacing } from '@/theme/tokens';
import { PROMO } from './homeContent';

export function PromoBanner() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const showToast = useToast();
  if (!PROMO) return null;

  const promo = PROMO;
  const message = i18n.language === 'ar' ? promo.message.ar : promo.message.en;
  const copy = async () => {
    await Clipboard.setStringAsync(promo.code);
    haptics.success();
    showToast({ message: t('promo.copied', { code: promo.code }) });
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={t('promo.tapToCopy')}
      onPress={copy}
      style={({ pressed }) => [styles.banner, { backgroundColor: colors.surfaceAlt, borderColor: colors.primaryText, opacity: pressed ? 0.85 : 1 }]}>
      <Icon name="pricetag-outline" color={colors.primaryText} />
      <AppText variant="label" style={styles.text}>
        {t('promo.code', { code: promo.code })} · {message}
      </AppText>
      <Icon name="copy-outline" size="sm" color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: minTouch,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  text: { flex: 1 },
});
