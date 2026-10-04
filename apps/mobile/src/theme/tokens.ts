export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  accent: string;
  border: string;
  danger: string;
  success: string;
  overlay: string;
}

export const lightPalette: Palette = {
  background: '#FBF9EE',
  surface: '#FFFFFF',
  surfaceAlt: '#F4EFE8',
  text: '#1E0B0C',
  textSecondary: '#6B5A5C',
  primary: '#6E2931',
  onPrimary: '#FBF9EE',
  accent: '#F5C7CF',
  border: '#E6DDD3',
  danger: '#8B0000',
  success: '#2F6B3F',
  overlay: 'rgba(30, 11, 12, 0.5)',
};

export const darkPalette: Palette = {
  background: '#1E0B0C',
  surface: '#2A1415',
  surfaceAlt: '#35191B',
  text: '#FBF9EE',
  textSecondary: '#C9B8B4',
  primary: '#F5C7CF',
  onPrimary: '#1E0B0C',
  accent: '#6E2931',
  border: '#4A2A2D',
  danger: '#FF8A8A',
  success: '#7FD39A',
  overlay: 'rgba(0, 0, 0, 0.6)',
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
