import Svg, { Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme/ThemeProvider';

/** Line drawing of a perfume bottle for empty states; decorative, so hidden from screen readers. */
export function BottleIllustration({ size = 96 }: { size?: number }) {
  const { colors } = useTheme();
  const stroke = colors.textSecondary;
  return (
    <Svg width={size} height={size} viewBox="0 0 96 96" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Rect x={40} y={8} width={16} height={10} rx={2} stroke={stroke} strokeWidth={2} fill="none" />
      <Path d="M44 18v8h8v-8" stroke={stroke} strokeWidth={2} fill="none" />
      <Path
        d="M30 26h36l10 14v38a8 8 0 0 1-8 8H28a8 8 0 0 1-8-8V40z"
        stroke={stroke}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M30 46h36M48 46v26M36 58l12 14 12-14" stroke={colors.primaryText} strokeWidth={2} fill="none" />
    </Svg>
  );
}
