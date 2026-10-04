export type PaymentMethod = 'COD' | 'INSTAPAY' | 'CARD' | 'OTHER';

/** Classifies an order by the payment gateway names Shopify reports. */
export function classifyPayment(gatewayNames: string[]): PaymentMethod {
  const joined = gatewayNames.join(' ').toLowerCase();
  if (/cash on delivery|cod|bosta/.test(joined)) return 'COD';
  if (/insta\s?pay/.test(joined)) return 'INSTAPAY';
  if (/shopify payments|visa|credit|debit|card|paymob|fawry/.test(joined)) return 'CARD';
  return 'OTHER';
}

export const PAYMENT_TAGS: Record<PaymentMethod, string> = {
  COD: 'payment-cod',
  INSTAPAY: 'payment-instapay',
  CARD: 'payment-card',
  OTHER: 'payment-other',
};
