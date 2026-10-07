import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { localizedNote } from './noteNames';
import { hasScentNotes } from '@/lib/shopify/scentNotes';
import type { ScentNotes } from '@/lib/shopify/types';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { useTracking } from '@/lib/direction';

const TIERS: (keyof ScentNotes)[] = ['top', 'heart', 'base'];
/** Dots deepen from top to base so the eye reads the scent moving from light to lasting. */
const TIER_OPACITY: Record<keyof ScentNotes, number> = { top: 0.4, heart: 0.7, base: 1 };
const DOT = 11;
const EYEBROW_TRACKING = 1.2;

function Stage({ tier, notes, last }: { tier: keyof ScentNotes; notes: string[]; last: boolean }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const tracking = useTracking(EYEBROW_TRACKING);
  const accent = { backgroundColor: colors.primaryText, opacity: TIER_OPACITY[tier] };

  return (
    <View style={styles.stage}>
      <View style={styles.rail}>
        <View style={[styles.dot, accent]} />
        {last ? null : <View style={[styles.line, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[styles.body, !last && styles.bodySpaced]}>
        <AppText variant="caption" muted style={{ letterSpacing: tracking }}>
          {`${t(`journey.${tier}.label`)} · ${t(`journey.${tier}.time`)}`}
        </AppText>
        <AppText variant="title" style={styles.stageTitle}>
          {t(`journey.${tier}.title`)}
        </AppText>
        <View style={styles.notes}>
          {notes.map((note) => (
            <View key={note} style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.noteDot, accent]} />
              <AppText variant="label">{localizedNote(note, i18n.language)}</AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

/** The scent pyramid as a quiet vertical timeline: top, heart and base notes with how long each lasts. */
export function FragranceJourney({ notes }: { notes: ScentNotes }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (!hasScentNotes(notes)) return null;
  const tracking = useTracking(EYEBROW_TRACKING);
  const tiers = TIERS.filter((tier) => notes[tier].length > 0);

  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.heading}>
        <AppText variant="label" muted style={{ letterSpacing: tracking }} accessibilityRole="header">
          {t('journey.title')}
        </AppText>
        <View style={[styles.rule, { backgroundColor: colors.border }]} />
      </View>
      {tiers.map((tier, index) => (
        <Stage key={tier} tier={tier} notes={notes[tier]} last={index === tiers.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rule: { flex: 1, height: StyleSheet.hairlineWidth },
  stage: { flexDirection: 'row', gap: spacing.md },
  rail: { width: DOT, alignItems: 'center', paddingTop: 4 },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
  line: { flex: 1, width: StyleSheet.hairlineWidth, marginTop: spacing.xs },
  body: { flex: 1, gap: spacing.xs },
  bodySpaced: { paddingBottom: spacing.lg },
  stageTitle: { fontSize: 20, lineHeight: 28 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  noteDot: { width: 6, height: 6, borderRadius: 3 },
});
