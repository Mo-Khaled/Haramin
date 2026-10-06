import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/ThemeProvider';
import { fontFamily } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyStrong' | 'label' | 'caption';

const sizes: Record<Variant, { fontSize: number; lineHeight: number }> = {
  display: { fontSize: 32, lineHeight: 40 },
  title: { fontSize: 24, lineHeight: 32 },
  heading: { fontSize: 18, lineHeight: 26 },
  body: { fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontSize: 16, lineHeight: 24 },
  label: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 13, lineHeight: 18 },
};

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
  color?: string;
}

function resolveFamily(variant: Variant, isArabic: boolean): string {
  const serif = variant === 'display' || variant === 'title';
  const strong = variant === 'bodyStrong' || variant === 'label';
  if (isArabic) return strong || serif ? fontFamily.arBodySemi : fontFamily.arBody;
  if (serif) return fontFamily.headingSemi;
  return strong ? fontFamily.bodyMedium : fontFamily.body;
}

export function AppText({ variant = 'body', muted, color, style, ...rest }: Props) {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const base: TextStyle = {
    ...sizes[variant],
    fontFamily: resolveFamily(variant, i18n.language === 'ar'),
    color: color ?? (muted ? colors.textSecondary : colors.text),
    // Fabric treats left/right as start/end of the node's layout direction, so 'left' is right in Arabic.
    textAlign: 'left',
  };
  return <Text {...rest} style={[base, style]} />;
}
