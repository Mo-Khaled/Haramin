export interface SliderScale {
  min: number;
  max: number;
  step: number;
  /** Width of the track in px that the thumb centre travels along. */
  width: number;
  /** In a right-to-left layout the minimum sits at the right edge. */
  rtl: boolean;
}

export function snap(value: number, { min, max, step }: Pick<SliderScale, 'min' | 'max' | 'step'>): number {
  const stepped = Math.round((value - min) / step) * step + min;
  return Math.min(max, Math.max(min, stepped));
}

/** Distance from the reading-start edge of the track to the thumb centre. */
export function valueToOffset(value: number, { min, max, width }: SliderScale): number {
  return ((value - min) / (max - min)) * width;
}

/** Value under a thumb dragged `dragX` screen pixels from `startOffset`; screen x runs against the offset in RTL. */
export function dragToValue(startOffset: number, dragX: number, scale: SliderScale): number {
  const offset = startOffset + (scale.rtl ? -dragX : dragX);
  const clamped = Math.min(scale.width, Math.max(0, offset));
  return snap(scale.min + (clamped / scale.width) * (scale.max - scale.min), scale);
}
