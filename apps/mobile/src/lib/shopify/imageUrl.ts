/** Shopify's CDN resizes on request; asking for the display width avoids downloading multi-megapixel originals. */
export function sizedImage(url: string, width: number): string {
  return `${url}${url.includes('?') ? '&' : '?'}width=${width}`;
}
