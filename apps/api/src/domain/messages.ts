export type Language = 'en' | 'ar';

export interface PushMessage {
  title: string;
  body: string;
}

type Localized = Record<Language, PushMessage>;

export const ORDER_MESSAGES: Record<string, (orderName: string) => Localized> = {
  confirmed: (name) => ({
    en: { title: 'Order confirmed', body: `Thank you! Order ${name} is confirmed.` },
    ar: { title: 'تم تأكيد الطلب', body: `شكراً لك! تم تأكيد الطلب ${name}.` },
  }),
  created: (name) => ({
    en: { title: 'Order created', body: `Order ${name} is being prepared.` },
    ar: { title: 'تم إنشاء الطلب', body: `جارٍ تجهيز الطلب ${name}.` },
  }),
  picked_up: (name) => ({
    en: { title: 'Order shipped', body: `Order ${name} has been picked up by the courier.` },
    ar: { title: 'تم شحن الطلب', body: `استلم المندوب الطلب ${name}.` },
  }),
  in_transit: (name) => ({
    en: { title: 'On its way', body: `Order ${name} is on its way to you.` },
    ar: { title: 'في الطريق إليك', body: `الطلب ${name} في الطريق إليك.` },
  }),
  out_for_delivery: (name) => ({
    en: { title: 'Out for delivery', body: `Order ${name} will arrive today.` },
    ar: { title: 'خرج للتوصيل', body: `سيصلك الطلب ${name} اليوم.` },
  }),
  delivered: (name) => ({
    en: { title: 'Delivered', body: `Order ${name} was delivered. Enjoy!` },
    ar: { title: 'تم التسليم', body: `تم تسليم الطلب ${name}. نتمنى لك تجربة رائعة!` },
  }),
};

export const PRICE_DROP_MESSAGE = (productTitle: string): Localized => ({
  en: { title: 'Price drop', body: `${productTitle} on your wishlist is now cheaper.` },
  ar: { title: 'انخفاض في السعر', body: `${productTitle} في مفضلتك أصبح أرخص.` },
});

export const ABANDONED_CART_MESSAGE: Localized = {
  en: { title: 'You left something behind', body: 'Your cart is waiting. Complete your order before it sells out.' },
  ar: { title: 'تركت شيئاً في السلة', body: 'سلتك بانتظارك. أكمل طلبك قبل نفاد الكمية.' },
};

export const POINTS_MESSAGE = (points: number): Localized => ({
  en: { title: 'You earned points', body: `+${points} loyalty points added to your account.` },
  ar: { title: 'ربحت نقاطاً', body: `تمت إضافة ${points} نقطة ولاء إلى حسابك.` },
});
