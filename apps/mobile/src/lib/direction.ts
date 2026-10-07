import { useRef, useState } from 'react';
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

export function useDirectionStyle(): ViewStyle {
  return { direction: useIsRTL() ? 'rtl' : 'ltr' };
}

/** A page counts as "current" once most of it is on screen; stable so FlatList never sees a new config. */
const PAGE_VIEWABILITY = { itemVisiblePercentThreshold: 60 };

/**
 * Index of the page a paging FlatList is showing, taken from FlatList's own viewability callback so it is a data
 * index in any layout direction. Raw scroll offsets are not: RN reports them differently when the layout is
 * mirrored, which is why nothing here does offset math or scrolls programmatically.
 */
export function useActiveIndex() {
  const [index, setIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;
  return { index, viewabilityProps: { viewabilityConfig: PAGE_VIEWABILITY, onViewableItemsChanged } };
}
