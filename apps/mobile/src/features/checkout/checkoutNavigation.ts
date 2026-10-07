export type CheckoutNavigation = 'allow' | 'complete' | 'exit';

const URL_PATTERN = /^([a-z][a-z0-9+.-]*):(?:\/\/([^/?#]+))?([^?#]*)/i;
const COMPLETE_PATH = /\/thank[_-]you\b|\/orders\/[a-z0-9]+/i;
/** Paths on the store's own domain that belong to checkout rather than the storefront; Arabic carts carry an `/ar` locale prefix. */
const CHECKOUT_PATH = /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?(?:\d+\/)?(?:checkouts|cart\/c|wallets|payments)\//i;
const SHOPIFY_PLATFORM_HOST = /(^|\.)(shopify\.com|shopifycs\.com|shop\.app)$/i;

function isShopHost(host: string, shopDomain: string): boolean {
  const bare = host.replace(/^www\./i, '').toLowerCase();
  return bare === shopDomain.toLowerCase() || bare.endsWith('.myshopify.com');
}

/**
 * Decides what the checkout WebView may load. Checkout, payment and order-status pages are allowed;
 * any storefront page on the shop's domain (home, cart, products, policies) ends the checkout so the
 * customer returns to the app instead of browsing the website inside it.
 */
export function classifyCheckoutUrl(url: string, shopDomain: string): CheckoutNavigation {
  if (url === 'about:blank') return 'allow';
  const match = URL_PATTERN.exec(url);
  if (!match) return 'exit';
  const [, scheme, host = '', path = '/'] = match;
  // Checkout and payment pages are always HTTPS; anything else is never legitimate here.
  if (scheme.toLowerCase() !== 'https') return 'exit';
  const trusted = isShopHost(host, shopDomain) || SHOPIFY_PLATFORM_HOST.test(host);
  // Only the store and Shopify can finish a checkout; a third-party page must not be able to clear the cart.
  if (trusted && COMPLETE_PATH.test(path)) return 'complete';
  if (isShopHost(host, shopDomain)) return CHECKOUT_PATH.test(path) ? 'allow' : 'exit';
  // Shopify platform pages, card issuers' 3-D Secure pages and wallet providers live on their own domains.
  return 'allow';
}
