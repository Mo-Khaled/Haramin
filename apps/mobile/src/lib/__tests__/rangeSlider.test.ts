import { describe, expect, it } from 'vitest';

import { dragToValue, snap, valueToOffset, type SliderScale } from '../rangeSlider';

const scale: SliderScale = { min: 0, max: 3000, step: 50, width: 300, rtl: false };

describe('range slider math', () => {
  it('snaps to the step and stays inside the range', () => {
    expect(snap(524, scale)).toBe(500);
    expect(snap(526, scale)).toBe(550);
    expect(snap(-40, scale)).toBe(0);
    expect(snap(9000, scale)).toBe(3000);
  });

  it('maps values to track offsets', () => {
    expect(valueToOffset(0, scale)).toBe(0);
    expect(valueToOffset(1500, scale)).toBe(150);
    expect(valueToOffset(3000, scale)).toBe(300);
  });

  it('turns a drag into a value, left to right', () => {
    expect(dragToValue(0, 50, scale)).toBe(500);
    expect(dragToValue(150, -150, scale)).toBe(0);
    expect(dragToValue(290, 100, scale)).toBe(3000);
  });

  it('reverses the drag direction in right-to-left layouts', () => {
    const rtl = { ...scale, rtl: true };
    expect(dragToValue(0, -50, rtl)).toBe(500);
    expect(dragToValue(0, 50, rtl)).toBe(0);
  });
});
