import type { ReviewDto, ReviewSummaryDto } from '@haramain/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { RatingStars } from './RatingStars';
import { useReviews } from './useReviews';
import { WriteReviewSheet } from './WriteReviewSheet';

const SHOWN = 5;
const COLLAPSED_LINES = 4;

/** Compact "★★★★½ 4.6 (188)" line for under the product title; nothing when there are no reviews. */
export function RatingLine({ handle }: { handle: string }) {
  const { t } = useTranslation();
  const reviews = useReviews(handle);
  if (!reviews.data?.count) return null;
  const { average, count } = reviews.data;
  return (
    <View style={styles.line} accessible accessibilityLabel={t('reviews.summaryLabel', { average, count })}>
      <RatingStars rating={average} />
      <AppText variant="label">{average.toFixed(1)}</AppText>
      <AppText variant="label" muted>
        ({count})
      </AppText>
    </View>
  );
}

function Histogram({ summary }: { summary: ReviewSummaryDto }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.histogram}>
      {summary.histogram.map((amount, i) => {
        const stars = 5 - i;
        const share = summary.count ? amount / summary.count : 0;
        return (
          <View key={stars} style={styles.barRow} accessible accessibilityLabel={t('reviews.barLabel', { stars, count: amount })}>
            <AppText variant="caption" style={styles.barLabel}>
              {stars}★
            </AppText>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { width: `${share * 100}%`, backgroundColor: colors.primaryText }]} />
            </View>
            <AppText variant="caption" muted style={styles.barCount}>
              {amount}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewDto }) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardHeader}>
        <RatingStars rating={review.rating} size={14} />
        <AppText variant="caption" muted>
          {new Date(review.createdAt).toLocaleDateString(i18n.language)}
        </AppText>
      </View>
      {review.title ? <AppText variant="bodyStrong">{review.title}</AppText> : null}
      <AppText
        muted
        numberOfLines={expanded ? undefined : COLLAPSED_LINES}
        onTextLayout={(e) => !expanded && setTruncated(e.nativeEvent.lines.length >= COLLAPSED_LINES)}>
        {review.body}
      </AppText>
      {truncated ? (
        <Pressable accessibilityRole="button" onPress={() => setExpanded((v) => !v)} style={styles.more}>
          <AppText variant="label" color={colors.primaryText}>
            {expanded ? t('reviews.less') : t('reviews.more')}
          </AppText>
        </Pressable>
      ) : null}
      {review.pictures.length ? (
        <View style={styles.pictures}>
          {review.pictures.slice(0, 4).map((url) => (
            <Image key={url} source={{ uri: url }} style={styles.picture} contentFit="cover" />
          ))}
        </View>
      ) : null}
      <AppText variant="caption">— {review.author}</AppText>
    </View>
  );
}

/** Ratings & reviews block for the product page; hidden entirely when the review service is unavailable. */
export function ReviewsSection({ productId, handle }: { productId: string; handle: string }) {
  const { t } = useTranslation();
  const reviews = useReviews(handle);
  const [writing, setWriting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  if (!reviews.data) return null;

  const summary = reviews.data;
  const visible = showAll ? summary.reviews : summary.reviews.slice(0, SHOWN);

  return (
    <View style={styles.section}>
      <AppText variant="title" accessibilityRole="header">
        {t('reviews.title')}
      </AppText>
      {summary.count > 0 ? (
        <View style={styles.summary}>
          <View style={styles.average}>
            <AppText variant="display">{summary.average.toFixed(1)}</AppText>
            <RatingStars rating={summary.average} />
            <AppText variant="caption" muted>
              {t('reviews.count', { count: summary.count })}
            </AppText>
          </View>
          <Histogram summary={summary} />
        </View>
      ) : (
        <AppText muted>{t('reviews.none')}</AppText>
      )}
      <Button label={t('reviews.write')} variant="secondary" onPress={() => setWriting(true)} />
      {visible.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      {summary.reviews.length > SHOWN && !showAll ? (
        <Button label={t('reviews.showAll', { count: summary.reviews.length })} variant="secondary" onPress={() => setShowAll(true)} />
      ) : null}
      <WriteReviewSheet visible={writing} onClose={() => setWriting(false)} productId={productId} handle={handle} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  section: { gap: spacing.md, paddingHorizontal: spacing.md },
  summary: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  average: { alignItems: 'center', gap: spacing.xs },
  histogram: { flex: 1, gap: spacing.xs },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barLabel: { width: 24 },
  track: { flex: 1, height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
  barCount: { width: 28, textAlign: 'right' },
  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.xs },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  more: { minHeight: 40, justifyContent: 'center' },
  pictures: { flexDirection: 'row', gap: spacing.sm },
  picture: { width: 64, height: 64, borderRadius: radius.sm },
});
