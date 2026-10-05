/**
 * Store contact details, taken from haramaineg.com (Locations page and site footer). The Shopify
 * pages for these are built from theme sections, so the Storefront API returns them empty.
 */
export const STORE_INFO = {
  whatsapp: '201026969922',
  phone: '+201026969922',
  email: 'haramaincs@gmail.com',
  instagram: 'https://www.instagram.com/haramaineg/',
  facebook: 'https://www.facebook.com/haramaineg',
  website: 'https://haramaineg.com',
};

export interface StoreLocation {
  name: { en: string; ar: string };
  address: { en: string[]; ar: string[] };
  mapsUrl: string;
  whatsapp: string;
}

export const STORE_LOCATIONS: StoreLocation[] = [
  {
    name: { en: 'Haramain Perfumes — El Ataba', ar: 'الحرمين للعطور — العتبة' },
    address: {
      en: ['In front of Garage 7, El Bosta St.', 'El Ataba, El Mosky', 'Cairo 11541, Egypt'],
      ar: ['أمام جراج 7، شارع البوسطة', 'العتبة، الموسكي', 'القاهرة 11541، مصر'],
    },
    mapsUrl: 'https://maps.google.com/?q=Haramain+Perfumes+El+Ataba+Cairo',
    whatsapp: '201103305575',
  },
];

export const whatsappUrl = (number: string) => `https://wa.me/${number.replace(/\D/g, '')}`;
