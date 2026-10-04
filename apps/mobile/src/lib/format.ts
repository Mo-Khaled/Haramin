export function formatMoney(amount: string | number, language: string, currency = 'EGP'): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(2);
  const [whole, fraction] = rounded.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const number = fraction ? `${grouped}.${fraction}` : grouped;
  const suffix = language === 'ar' && currency === 'EGP' ? 'ج.م' : currency;
  return `${number} ${suffix}`;
}

export function discountPercent(price: string, compareAt?: string | null): number | null {
  if (!compareAt) return null;
  const current = parseFloat(price);
  const original = parseFloat(compareAt);
  if (!(original > current)) return null;
  return Math.round(((original - current) / original) * 100);
}
