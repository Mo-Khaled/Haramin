import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { hasBestFor, type BestFor } from './productTags';

const SEASON_ICONS: Record<string, IconName> = { summer: 'sunny-outline', winter: 'snow-outline' };
const TIME_ICONS: Record<string, IconName> = { morning: 'partly-sunny-outline', evening: 'moon-outline' };

function Pill({ icon, label }: { icon: IconName; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.pill, { backgroundColor: colors.surfaceAlt }]}>
      <Icon name={icon} size="sm" color={colors.primaryText} />
      <AppText variant="caption">{label}</AppText>
    </View>
  );
}

export function BestForChips({ bestFor }: { bestFor: BestFor }) {
  const { t } = useTranslation();
  if (!hasBestFor(bestFor)) return null;

  // Tag values outside the known vocabulary fall back to the raw value so new tags still show.
  const label = (group: string, value: string) => t(`bestFor.${group}.${value}`, { defaultValue: value });

  return (
    <View style={styles.wrap}>
      <AppText variant="label" muted>
        {t('bestFor.title')}
      </AppText>
      <View style={styles.row}>
        {bestFor.gender ? <Pill icon="person-outline" label={label('gender', bestFor.gender)} /> : null}
        {bestFor.occasions.map((value) => (
          <Pill key={`o-${value}`} icon="calendar-outline" label={label('occasion', value)} />
        ))}
        {bestFor.seasons.map((value) => (
          <Pill key={`s-${value}`} icon={SEASON_ICONS[value] ?? 'leaf-outline'} label={label('season', value)} />
        ))}
        {bestFor.times.map((value) => (
          <Pill key={`t-${value}`} icon={TIME_ICONS[value] ?? 'time-outline'} label={label('time', value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
});
