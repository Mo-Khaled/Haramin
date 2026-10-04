import { createHmac, timingSafeEqual } from 'node:crypto';

/** Verifies Shopify's base64 HMAC-SHA256 signature over the raw request body. */
export function verifyShopifyHmac(rawBody: Buffer, header: string | undefined, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest();
  let received: Buffer;
  try {
    received = Buffer.from(header, 'base64');
  } catch {
    return false;
  }
  return received.length === expected.length && timingSafeEqual(received, expected);
}

/** "gid://shopify/Customer/123" -> "123"; plain numeric ids pass through. */
export function numericId(id: string | number): string {
  return String(id).split('/').pop() ?? String(id);
}

export const productGid = (id: string | number) => `gid://shopify/Product/${numericId(id)}`;
export const customerGid = (id: string | number) => `gid://shopify/Customer/${numericId(id)}`;
export const orderGid = (id: string | number) => `gid://shopify/Order/${numericId(id)}`;
