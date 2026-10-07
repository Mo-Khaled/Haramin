import { describe, expect, it } from 'vitest';

import { darkPalette, lightPalette, type Palette } from '../tokens';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const BODY_TEXT = 4.5;

/** Every foreground/background pairing the components actually render. */
function textPairs(p: Palette): [string, string, string][] {
  const surfaces: [string, string][] = [
    ['background', p.background],
    ['surface', p.surface],
    ['surfaceAlt', p.surfaceAlt],
  ];
  const foregrounds: [string, string][] = [
    ['text', p.text],
    ['textSecondary', p.textSecondary],
    ['primaryText', p.primaryText],
    ['danger', p.danger],
  ];
  const pairs: [string, string, string][] = [['onPrimary on primary', p.onPrimary, p.primary]];
  for (const [fgName, fg] of foregrounds) {
    for (const [bgName, bg] of surfaces) pairs.push([`${fgName} on ${bgName}`, fg, bg]);
  }
  return pairs;
}

describe.each([
  ['light', lightPalette],
  ['dark', darkPalette],
])('%s palette', (_name, palette) => {
  it.each(textPairs(palette))('%s meets WCAG AA for body text', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(BODY_TEXT);
  });

  it('keeps the success colour legible on surfaces', () => {
    expect(contrast(palette.success, palette.surface)).toBeGreaterThanOrEqual(BODY_TEXT);
  });
});

describe('dark palette character', () => {
  it('keeps button text strongly legible on the wine fill', () => {
    expect(contrast(darkPalette.onPrimary, darkPalette.primary)).toBeGreaterThanOrEqual(6);
  });

  it('lets cards stand out from the page and borders from cards', () => {
    expect(contrast(darkPalette.surface, darkPalette.background)).toBeGreaterThanOrEqual(1.35);
    expect(contrast(darkPalette.border, darkPalette.surface)).toBeGreaterThanOrEqual(2);
  });
});
