import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PUBLIC_API_URL: z.string().optional(),
  SHOPIFY_SHOP_DOMAIN: z.string().default('haramaineg.com'),
  SHOPIFY_SHOP_ID: z.string().default('59682848873'),
  SHOPIFY_ADMIN_TOKEN: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  BOSTA_API_KEY: z.string().optional(),
  BOSTA_BASE_URL: z.string().default('https://app.bosta.co'),
  BOSTA_WEBHOOK_SECRET: z.string().optional(),
});

export const env = schema.parse(process.env);
export const SHOPIFY_API_VERSION = '2025-07';
