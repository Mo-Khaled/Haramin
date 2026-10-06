import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchHomeContent } from '@/lib/shopify/api';
import { HERO_SLIDES } from './homeContent';
import type { Banner, PromoContent } from './homeMetaobjects';

/**
 * Banners and promo from Shopify Admin, falling back to the built-in banners (and no promo) while
 * loading, offline, or when staff have not created any entries yet.
 */
export function useHomeContent(): { banners: Banner[]; promo: PromoContent | null } {
  const { t, i18n } = useTranslation();
  const query = useQuery({
    queryKey: ['home-content', i18n.language],
    queryFn: fetchHomeContent,
    staleTime: 10 * 60_000,
  });

  const defaults: Banner[] = HERO_SLIDES.map((slide, position) => ({
    id: slide.id,
    image: slide.image,
    target: slide.target,
    label: t(slide.labelKey),
    position,
  }));

  return {
    banners: query.data?.banners.length ? query.data.banners : defaults,
    promo: query.data?.promo ?? null,
  };
}
