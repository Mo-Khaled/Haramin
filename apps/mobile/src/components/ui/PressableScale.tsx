import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedMotion } from '@/lib/useReducedMotion';

interface Props extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Pressable that springs down slightly while pressed, giving cards a tactile feel without moving layout. */
export function PressableScale({ children, style, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();

  const animateTo = (toValue: number) => {
    if (reducedMotion) return;
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  };

  return (
    <Pressable
      {...rest}
      onPressIn={(event) => {
        animateTo(0.97);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animateTo(1);
        onPressOut?.(event);
      }}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}
