import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCollectionProducts } from '@/features/catalog/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { HERO_SLIDES, type HeroSlide } from './homeContent';

const SLIDE_HEIGHT = 200;

function Slide({ slide, width }: { slide: HeroSlide; width: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const products = useCollectionProducts(slide.collection, 'FEATURED', []);
  const image = products.data?.pages[0]?.products.find((p) => p.featuredImage)?.featuredImage;

  return (
    <PressableScale
      accessibilityRole="link"
      accessibilityLabel={`${t(slide.titleKey)}. ${t(slide.subtitleKey)}`}
      onPress={() => router.push({ pathname: '/collection/[handle]', params: { handle: slide.collection } })}
      style={[styles.slide, { width, backgroundColor: colors.primary }]}>
      <View style={styles.copy}>
        <AppText variant="title" color={colors.onPrimary}>
          {t(slide.titleKey)}
        </AppText>
        <AppText variant="label" color={colors.onPrimary} style={styles.subtitle}>
          {t(slide.subtitleKey)}
        </AppText>
        <View style={[styles.cta, { borderColor: colors.onPrimary }]}>
          <AppText variant="caption" color={colors.onPrimary}>
            {t('home.shopNow')}
          </AppText>
        </View>
      </View>
      <View style={[styles.imageWrap, { backgroundColor: colors.surface }]}>
        {image ? (
          <Image source={{ uri: image.url }} style={styles.image} contentFit="contain" transition={200} />
        ) : (
          <Skeleton height="100%" borderRadius={radius.md} />
        )}
      </View>
    </PressableScale>
  );
}

export function HeroCarousel() {
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
        keyExtractor={(slide) => slide.collection}
        renderItem={({ item }) => <Slide slide={item} width={slideWidth} />}
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(event) => setIndex(Math.round(Math.abs(event.nativeEvent.contentOffset.x) / step))}
      />
      <View style={styles.dots} accessibilityLabel={`${index + 1} / ${HERO_SLIDES.length}`}>
        {HERO_SLIDES.map((slide, i) => (
          <View
            key={slide.collection}
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
  slide: {
    height: SLIDE_HEIGHT,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: spacing.md,
    gap: spacing.md,
  },
  copy: { flex: 1, justifyContent: 'center', gap: spacing.xs },
  subtitle: { opacity: 0.9 },
  cta: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  imageWrap: { width: '42%', borderRadius: radius.md, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs },
  dot: { height: 6, borderRadius: radius.pill },
});
