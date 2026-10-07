export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  /** Fill colour for buttons, tiles, badges and selected chips. Always paired with `onPrimary`. */
  primary: string;
  onPrimary: string;
  /** Brand colour for text, icons, outlines and links drawn directly on `background`/`surface`. */
  primaryText: string;
  border: string;
  danger: string;
  success: string;
  overlay: string;
  onOverlay: string;
}

export const lightPalette: Palette = {
  background: '#FBF9EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE8',
  text: '#1E0B0C',
  textSecondary: '#6B5A5C',
  primary: '#6E2931',
  onPrimary: '#FBF9EE',
  primaryText: '#6E2931',
  border: '#E6DDD3',
  danger: '#A01818',
  success: '#2F6B3F',
  overlay: 'rgba(30, 11, 12, 0.5)',
  onOverlay: '#FFFFFF',
};

export const darkPalette: Palette = {
  background: '#0B0607',
  surface: '#32252C',
  surfaceAlt: '#402F38',
  text: '#FFF8F1',
  textSecondary: '#CDBBB4',
  primary: '#9A3F4C',
  onPrimary: '#FBF5EE',
  primaryText: '#F0B3BD',
  border: '#735861',
  danger: '#F2938F',
  success: '#7FD39A',
  overlay: 'rgba(0, 0, 0, 0.6)',
  onOverlay: '#FFFFFF',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const iconSize = { sm: 18, md: 24, lg: 32 } as const;
export const minTouch = 48;

export const fontFamily = {
  headingSemi: 'Platypi_600SemiBold',
  body: 'IBMPlexSans_400Regular',
  bodyMedium: 'IBMPlexSans_500Medium',
  arBody: 'IBMPlexSansArabic_400Regular',
  arBodySemi: 'IBMPlexSansArabic_600SemiBold',
} as const;
