import type { ReviewDto, ReviewSummaryDto } from '@haramain/shared';

/** Shape of a review as Judge.me's GET /reviews returns it (fields we use). */
export interface JudgemeReview {
  id: number;
  title: string | null;
  body: string | null;
  rating: number;
  published: boolean;
  hidden: boolean;
  created_at: string;
  reviewer?: { name?: string | null } | null;
  pictures?: { hidden?: boolean; urls?: { original?: string; compact?: string } }[];
}

const MAX_LISTED = 20;

function toDto(review: JudgemeReview): ReviewDto {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title?.trim() || null,
    body: (review.body ?? '').trim(),
    author: review.reviewer?.name?.trim() || 'Customer',
    createdAt: review.created_at,
    pictures: (review.pictures ?? [])
      .filter((p) => !p.hidden)
      .map((p) => p.urls?.compact ?? p.urls?.original)
      .filter((url): url is string => !!url),
  };
}

/** Builds what the app shows from raw Judge.me reviews: only published, visible ones count. */
export function summarizeReviews(raw: JudgemeReview[]): ReviewSummaryDto {
  const visible = raw.filter((r) => r.published && !r.hidden && r.rating >= 1 && r.rating <= 5);
  const histogram: ReviewSummaryDto['histogram'] = [0, 0, 0, 0, 0];
  for (const review of visible) histogram[5 - Math.round(review.rating)] += 1;
  const total = visible.reduce((sum, r) => sum + r.rating, 0);
  const newestFirst = [...visible].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return {
    average: visible.length ? Math.round((total / visible.length) * 10) / 10 : 0,
    count: visible.length,
    histogram,
    reviews: newestFirst.slice(0, MAX_LISTED).map(toDto),
  };
}
