import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { HERO_SLIDES, type HeroSlide } from './homeContent';

/** Taller than the 3.6:1 desktop artwork so it reads on a phone; the brand art is centred, so cropping the sides is safe. */
const PHONE_ASPECT = 2.2;

function open(slide: HeroSlide) {
  if ('route' in slide.target) router.push(slide.target.route);
  else router.push({ pathname: '/collection/[handle]', params: { handle: slide.target.collection } });
}

export function HeroCarousel() {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const slideWidth = screenWidth - spacing.md * 2;
  const step = slideWidth + spacing.sm;

  return (
    <View style={styles.wrap}>
      <FlatList
        horizontal
        data={HERO_SLIDES}
        keyExtractor={(slide) => slide.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(event) => setIndex(Math.round(Math.abs(event.nativeEvent.contentOffset.x) / step))}
        renderItem={({ item }) => (
          <PressableScale
            accessibilityRole="link"
            accessibilityLabel={t(item.labelKey)}
            onPress={() => open(item)}
            style={[styles.slide, { width: slideWidth, backgroundColor: colors.surfaceAlt }]}>
            <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={200} cachePolicy="memory-disk" />
          </PressableScale>
        )}
      />
      <View style={styles.dots} accessibilityLabel={`${index + 1} / ${HERO_SLIDES.length}`}>
        {HERO_SLIDES.map((slide, i) => (
          <View
            key={slide.id}
            style={[styles.dot, { backgroundColor: i === index ? colors.primaryText : colors.border, width: i === index ? 18 : 6 }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  slide: { aspectRatio: PHONE_ASPECT, borderRadius: radius.lg, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { height: 6, borderRadius: radius.pill },
});
