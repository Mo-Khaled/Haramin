import { useMemo, useRef, useState } from 'react';
import type { ViewStyle, ViewToken } from 'react-native';
import { useTranslation } from 'react-i18next';

/**
 * Layout direction follows the app language, not only the native RTL flag: Expo Go never flips natively,
 * and store builds only do after a restart. Setting `direction` on root views mirrors rows, paddings and
 * horizontal lists immediately everywhere.
 */
export function useIsRTL(): boolean {
  const { i18n } = useTranslation();
  return i18n.language === 'ar';
}

/** Letter-spacing is for Latin capitals; in Arabic it breaks the joined letters apart, so it is dropped. */
export function useTracking(spacing: number): number {
  return useIsRTL() ? 0 : spacing;
}

export function useDirectionStyle(): ViewStyle {
  return { direction: useIsRTL() ? 'rtl' : 'ltr' };
}

/** A page counts as "current" once most of it is on screen; stable so FlatList never sees a new config. */
const PAGE_VIEWABILITY = { itemVisiblePercentThreshold: 60 };

/** Position in reading order of the page at `viewIndex`; a reversed (right-to-left) list counts from its far end. */
export function logicalIndex(viewIndex: number, length: number, reversed: boolean): number {
  return reversed ? length - 1 - viewIndex : viewIndex;
}

/**
 * State for a paging FlatList whose first item must sit at the reading start. RN's viewability and offsets are
 * direction-unaware in a mirrored layout, so the list is pinned to LTR, its data is reversed in RTL, and it opens
 * on the last (rightmost) page. Every page is `step` wide, so no offset math or imperative scrolling is needed.
 * `index` is the page in reading order, for dots and progress bars.
 */
export function usePagedList<T>(items: T[], step: number) {
  const reversed = useIsRTL();
  const [viewIndex, setViewIndex] = useState<number | null>(null);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setViewIndex(first.index);
  }).current;
  const data = useMemo(() => (reversed ? [...items].reverse() : items), [items, reversed]);

  return {
    data,
    index: viewIndex === null ? 0 : logicalIndex(viewIndex, items.length, reversed),
    listProps: {
      style: { direction: 'ltr' } as ViewStyle,
      initialScrollIndex: reversed && items.length > 0 ? items.length - 1 : 0,
      getItemLayout: (_: unknown, i: number) => ({ length: step, offset: step * i, index: i }),
      viewabilityConfig: PAGE_VIEWABILITY,
      onViewableItemsChanged,
    },
  };
}
