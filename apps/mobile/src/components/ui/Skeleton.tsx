import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';

import { useReducedMotion } from '@/lib/useReducedMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  aspectRatio?: number;
}

/** Placeholder block that pulses while content loads; static when the user prefers reduced motion. */
export function Skeleton({ width = '100%', height, borderRadius = radius.sm, aspectRatio }: SkeletonProps) {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reducedMotion]);

  return (
    <Animated.View
      style={{ width, height, aspectRatio, borderRadius, backgroundColor: colors.surfaceAlt, opacity }}
    />
  );
}

export function ProductCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Skeleton aspectRatio={4 / 5} borderRadius={0} />
      <View style={styles.info}>
        <Skeleton width="40%" height={12} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="50%" height={14} />
      </View>
    </View>
  );
}

/** Two-column grid of card skeletons, matching ProductGrid's layout. */
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  const rows = Array.from({ length: Math.ceil(count / 2) }, (_, i) => i);
  return (
    <View style={styles.grid} accessibilityRole="progressbar">
      {rows.map((row) => (
        <View key={row} style={styles.row}>
          <View style={styles.cell}>
            <ProductCardSkeleton />
          </View>
          <View style={styles.cell}>
            <ProductCardSkeleton />
          </View>
        </View>
      ))}
    </View>
  );
}

export function RailSkeleton() {
  return (
    <View style={styles.rail} accessibilityRole="progressbar">
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.railItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.md, overflow: 'hidden' },
  info: { padding: spacing.sm, gap: spacing.sm },
  grid: { paddingHorizontal: spacing.md, gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
  rail: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, overflow: 'hidden' },
  railItem: { width: 168 },
});
