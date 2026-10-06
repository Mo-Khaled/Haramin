import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PUBLIC_API_URL: z.string().optional(),
  SHOPIFY_SHOP_ID: z.string().default('59682848873'),
  /** Admin API calls must use the permanent *.myshopify.com domain, not the storefront domain. */
  SHOPIFY_STORE_DOMAIN: z.string().default('b970ef-9d.myshopify.com'),
  /** Dev Dashboard app credentials; exchanged for short-lived Admin tokens. */
  SHOPIFY_CLIENT_ID: z.string().optional(),
  SHOPIFY_CLIENT_SECRET: z.string().optional(),
  /** Static Admin token for a legacy custom app; takes precedence over client credentials when set. */
  SHOPIFY_ADMIN_TOKEN: z.string().optional(),
  /** Webhook signing secret; defaults to the app client secret, which signs app webhooks. */
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  /** Judge.me private token: read/write, server-side only. */
  JUDGEME_PRIVATE_TOKEN: z.string().optional(),
  BOSTA_API_KEY: z.string().optional(),
  BOSTA_BASE_URL: z.string().default('https://app.bosta.co'),
  BOSTA_WEBHOOK_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);
export const SHOPIFY_API_VERSION = '2025-07';

export const shopifyWebhookSecret = env.SHOPIFY_WEBHOOK_SECRET ?? env.SHOPIFY_CLIENT_SECRET;
