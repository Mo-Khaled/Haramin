import { useTranslation } from 'react-i18next';

import { slugify } from './brandMatch';

/** Arabic spellings of brand names, keyed by `brandKey`. Brands are names, so they are Arabized, not translated. */
const ARABIC_BRAND_NAMES: Record<string, string> = {
  lattafa: 'لطافة',
  khadlaj: 'خدلج',
  nabeel: 'نبيل',
  afnan: 'أفنان',
  assaf: 'عساف',
  armaf: 'أرماف',
  zimaya: 'زيمايا',
  rasasi: 'رصاصي',
  'lattafa-pride': 'لطافة برايد',
  ibraq: 'إبراق',
  'le-falcone': 'لو فالكون',
  almas: 'الماس',
  faan: 'فن',
  'le-bonheur': 'لو بونهير',
  'arabiyat-sugar': 'عربيات شوجر',
  asdaf: 'أصداف',
  'jean-antoine': 'جان أنطوان',
  'dkhoon-emirates': 'دخون الإمارات',
  ajmal: 'أجمل',
  'maison-alhambra': 'ميزون الحمراء',
  haramain: 'الحرمين',
  'al-ezz-for-oud': 'العز للعود',
  'banafa-for-oud': 'بنافع للعود',
  laverne: 'لافيرن',
  'maison-asrar': 'ميزون أسرار',
  'french-avenue': 'فرنش أفينيو',
  'gulf-orchid': 'جلف أوركيد',
  'arabiyat-prestige': 'عربيات بريستيج',
  'sainte-valere': 'سانت فاليري',
  amarah: 'أمارة',
};

/** Vendors and brand collections spell the same brand several ways ("AFNAN", "Afnan Perfumes"); this unifies them. */
export function brandKey(name: string): string {
  return slugify(name).replace(/-perfumes?$/, '');
}

export function localizedBrandName(name: string, language: string): string {
  if (language !== 'ar') return name;
  return ARABIC_BRAND_NAMES[brandKey(name)] ?? name;
}

export function useBrandName(name: string): string {
  return localizedBrandName(name, useTranslation().i18n.language);
}
