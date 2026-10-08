import { useCallback, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Vertical pages stop at their first and last item. iOS otherwise rubber-bands past the end and shows empty
 * background below the content, and Android draws an overscroll glow.
 */
export const NO_OVERSCROLL = { bounces: false, overScrollMode: 'never' } as const;

/**
 * Pull-to-refresh needs the top bounce, but bouncing must not reveal empty space past the last item. Bouncing is
 * enabled only while the list rests at its top, so a pull still refreshes and the bottom edge stays firm.
 */
export function useTopOnlyBounce() {
  const [atTop, setAtTop] = useState(true);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setAtTop(event.nativeEvent.contentOffset.y <= 0);
  }, []);
  return { bounces: atTop, overScrollMode: 'never' as const, onScroll, scrollEventThrottle: 16 };
}
