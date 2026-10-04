import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useTheme } from '@/theme/ThemeProvider';
import { iconSize } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: IconName;
  size?: keyof typeof iconSize;
  color?: string;
}

export function Icon({ name, size = 'md', color }: Props) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={iconSize[size]} color={color ?? colors.text} />;
}
