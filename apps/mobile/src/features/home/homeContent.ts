import type { IconName } from '@/components/ui/Icon';

/**
 * Home-screen content. Bundled for now; once a Storefront token with metaobject access exists, staff
 * will edit these in Shopify Admin and this module becomes the fallback.
 */

export interface CategoryTab {
  labelKey: string;
  /** Collection handle, or 'brands' for the brands directory. */
  target: string;
}

export const CATEGORY_TABS: CategoryTab[] = [
  { labelKey: 'home.forHer', target: 'for-her' },
  { labelKey: 'home.forHim', target: 'for-him' },
  { labelKey: 'home.homeIncense', target: 'insence' },
  { labelKey: 'shop.brands', target: 'brands' },
  { labelKey: 'home.newArrivals', target: 'new-arrivals' },
  { labelKey: 'home.bestSellersTab', target: 'best-sellers' },
];

export interface HeroSlide {
  /** The slide shows this collection's lead product photo and opens the collection. */
  collection: string;
  titleKey: string;
  subtitleKey: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  { collection: 'new-arrivals', titleKey: 'hero.newTitle', subtitleKey: 'hero.newSubtitle' },
  { collection: 'best-sellers', titleKey: 'hero.bestTitle', subtitleKey: 'hero.bestSubtitle' },
  { collection: 'for-her', titleKey: 'hero.herTitle', subtitleKey: 'hero.herSubtitle' },
  { collection: 'for-him', titleKey: 'hero.himTitle', subtitleKey: 'hero.himSubtitle' },
];

export interface TrustItem {
  icon: IconName;
  labelKey: string;
}

export const TRUST_ITEMS: TrustItem[] = [
  { icon: 'shield-checkmark-outline', labelKey: 'trust.original' },
  { icon: 'cash-outline', labelKey: 'trust.cod' },
  { icon: 'car-outline', labelKey: 'trust.freeShipping' },
  { icon: 'flash-outline', labelKey: 'trust.fastDelivery' },
];

export interface Promo {
  code: string;
  /** Short line shown beside the code, per language. */
  message: { en: string; ar: string };
}

/** No live promo code has been supplied yet; the banner stays hidden until one is set here. */
export const PROMO: Promo | null = null;

/** Brands featured as "worlds" rails on the home screen, in display order. */
export const BRAND_WORLDS = ['lattafa', 'rasasi-perfumes', 'afnan-perfumes'];
