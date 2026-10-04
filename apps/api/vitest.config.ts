import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      SHOPIFY_WEBHOOK_SECRET: 'test-shopify-secret',
      BOSTA_WEBHOOK_SECRET: 'test-bosta-secret',
    },
  },
});
