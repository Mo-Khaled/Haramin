import { useRef, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useIsRTL } from '@/lib/direction';
import { dragToValue, valueToOffset, type SliderScale } from '@/lib/rangeSlider';
import { useTheme } from '@/theme/ThemeProvider';
import { minTouch } from '@/theme/tokens';

const THUMB = 28;
const TRACK = 4;

interface Range {
  low: number;
  high: number;
}

interface Props {
  min: number;
  max: number;
  step: number;
  value: Range;
  onChange: (value: Range) => void;
  /** Spoken name for the two thumbs, e.g. "Minimum price". */
  lowLabel: string;
  highLabel: string;
}

interface ThumbProps {
  offset: number;
  label: string;
  scale: SliderScale;
  onMove: (value: number) => void;
}

function Thumb({ offset, label, scale, onMove }: ThumbProps) {
  const { colors } = useTheme();
  const startOffset = useRef(0);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      startOffset.current = offset;
    })
    .onUpdate((event) => onMove(dragToValue(startOffset.current, event.translationX, scale)));

  return (
    <GestureDetector gesture={pan}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        hitSlop={(minTouch - THUMB) / 2}
        style={[styles.thumb, { start: offset, backgroundColor: colors.primary, borderColor: colors.background }]}
      />
    </GestureDetector>
  );
}

/** Two-thumb range slider; the lower thumb always sits at the reading start, so it mirrors in Arabic. */
export function RangeSlider({ min, max, step, value, onChange, lowLabel, highLabel }: Props) {
  const { colors } = useTheme();
  const rtl = useIsRTL();
  const [width, setWidth] = useState(0);
  const scale: SliderScale = { min, max, step, width, rtl };
  const lowOffset = valueToOffset(value.low, scale);
  const highOffset = valueToOffset(value.high, scale);

  const onLayout = (event: LayoutChangeEvent) => setWidth(Math.max(0, event.nativeEvent.layout.width - THUMB));

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.area} onLayout={onLayout}>
        <View style={[styles.track, { backgroundColor: colors.border }]} />
        <View style={[styles.fill, { backgroundColor: colors.primary, start: lowOffset + THUMB / 2, width: highOffset - lowOffset }]} />
        {width > 0 ? (
          <>
            <Thumb
              offset={lowOffset}
              label={lowLabel}
              scale={scale}
              onMove={(next) => onChange({ low: Math.min(next, value.high - step), high: value.high })}
            />
            <Thumb
              offset={highOffset}
              label={highLabel}
              scale={scale}
              onMove={(next) => onChange({ low: value.low, high: Math.max(next, value.low + step) })}
            />
          </>
        ) : null}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { height: minTouch },
  area: { height: minTouch, justifyContent: 'center' },
  track: { position: 'absolute', start: THUMB / 2, end: THUMB / 2, height: TRACK, borderRadius: TRACK / 2 },
  fill: { position: 'absolute', height: TRACK, borderRadius: TRACK / 2 },
  thumb: { position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2 },
});
