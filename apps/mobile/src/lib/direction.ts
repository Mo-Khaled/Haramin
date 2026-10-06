import { useRef } from 'react';
import { I18nManager, type ViewStyle } from 'react-native';
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

interface ScrollsToEnd {
  scrollToEnd(params?: { animated?: boolean }): void;
}

/**
 * In a JS-mirrored layout a horizontal list's first item sits at the right end of its content, but the native
 * scroll view still opens at the left. Until the customer scrolls, keep the list at that right end.
 * `mirrored` also tells paging carousels that offsets now count from the last item.
 */
export function useReadingStart<T extends ScrollsToEnd>() {
  const ref = useRef<T>(null);
  const userScrolled = useRef(false);
  const mirrored = useIsRTL() && !I18nManager.isRTL;
  const scrollProps = mirrored
    ? {
        onContentSizeChange: () => {
          if (!userScrolled.current) ref.current?.scrollToEnd({ animated: false });
        },
        onScrollBeginDrag: () => {
          userScrolled.current = true;
        },
      }
    : {};
  return { ref, mirrored, scrollProps };
}
