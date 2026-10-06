import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';
import { useDirectionStyle } from '@/lib/direction';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
}

export function Screen({ children, style }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const direction = useDirectionStyle();
  return (
    <View style={[styles.root, direction, { backgroundColor: colors.background, paddingTop: insets.top }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
