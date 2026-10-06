import type { IconName } from '@/components/ui/Icon';
import type { BannerTarget } from './homeMetaobjects';

/**
 * Built-in home-screen content. Banners and the promo are normally edited by staff in Shopify Admin
 * (metaobjects, see homeMetaobjects.ts); these defaults show whenever no entries exist.
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
  id: string;
  /** Banner artwork from the website's homepage slideshow (desktop 3.6:1; centre-cropped on phones). */
  image: string;
  target: BannerTarget;
  labelKey: string;
}

const BANNER = (file: string) => `https://haramaineg.com/cdn/shop/files/${file}?width=1200`;

export const HERO_SLIDES: HeroSlide[] = [
  { id: 'faan', image: BANNER('FAAN-X-HARAMAIN.png'), target: { collection: 'faan' }, labelKey: 'hero.faan' },
  {
    id: 'afnan-supremacy',
    image: BANNER('Product-01_7fe9df00-71bb-4edd-84c3-20ade057be51_1.png'),
    target: { collection: 'supremacy-collection' },
    labelKey: 'hero.supremacy',
  },
  { id: 'khadlaj', image: BANNER('khadlsj.png'), target: { collection: 'khadlaj-perfumes' }, labelKey: 'hero.khadlaj' },
  { id: 'branch', image: BANNER('supreL-2.png'), target: { route: '/stores' }, labelKey: 'hero.branch' },
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

/** Brands featured as "worlds" rails on the home screen, in display order. */
export const BRAND_WORLDS = ['lattafa', 'rasasi-perfumes', 'afnan-perfumes'];
