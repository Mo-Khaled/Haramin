import type { FastifyReply, FastifyRequest } from 'fastify';

import { SHOPIFY_API_VERSION, env } from '../lib/env.js';
import { numericId } from '../lib/hmac.js';

export type CustomerVerifier = (accessToken: string) => Promise<string | null>;

const CACHE_TTL_MS = 5 * 60_000;
const MAX_CACHE_ENTRIES = 5000;
const cache = new Map<string, { customerId: string; expires: number }>();

/** Validates a Customer Account API access token by asking Shopify who it belongs to. */
export const verifyWithShopify: CustomerVerifier = async (accessToken) => {
  const hit = cache.get(accessToken);
  if (hit && hit.expires > Date.now()) return hit.customerId;

  const response = await fetch(
    `https://shopify.com/${env.SHOPIFY_SHOP_ID}/account/customer/api/${SHOPIFY_API_VERSION}/graphql`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: accessToken },
      body: JSON.stringify({ query: '{ customer { id } }' }),
    },
  );
  if (!response.ok) return null;
  const json = (await response.json()) as { data?: { customer?: { id?: string } } };
  const id = json.data?.customer?.id;
  if (!id) return null;

  const customerId = numericId(id);
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
  cache.set(accessToken, { customerId, expires: Date.now() + CACHE_TTL_MS });
  return customerId;
};

declare module 'fastify' {
  interface FastifyRequest {
    customerId: string;
  }
}

export function requireCustomer(verify: CustomerVerifier) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const customerId = token ? await verify(token).catch(() => null) : null;
    if (!customerId) {
      await reply.code(401).send({ error: 'unauthorized' });
      return;
    }
    request.customerId = customerId;
  };
}
