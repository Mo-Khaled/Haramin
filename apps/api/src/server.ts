import Fastify from 'fastify';

import { verifyWithShopify } from './auth/customerAuth.js';
import type { AppDeps } from './deps.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { initSentry, Sentry } from './lib/sentry.js';
import { enqueue } from './queues/index.js';
import { authBridgeRoutes } from './routes/authBridge.js';
import { deviceRoutes } from './routes/devices.js';
import { loyaltyRoutes } from './routes/loyalty.js';
import { reviewRoutes } from './routes/reviews.js';
import { webhookRoutes } from './routes/webhooks.js';
import { wishlistRoutes } from './routes/wishlist.js';
import { createJudgemeService } from './services/judgeme.js';
import { creditStoreCredit } from './services/shopifyAdmin.js';

export function defaultDeps(): AppDeps {
  return { prisma, enqueue, verifyCustomer: verifyWithShopify, creditStoreCredit, reviews: createJudgemeService() };
}

export function buildServer(deps: AppDeps = defaultDeps()) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  app.setErrorHandler((error, request, reply) => {
    Sentry.captureException(error);
    request.log.error(error);
    reply.status(500).send({ error: 'internal_error' });
  });

  // Shopify opens the app URL (this root) after installing the backend app; confirm instead of 404ing.
  app.get('/', async (_request, reply) =>
    reply
      .type('text/html')
      .send('<!doctype html><meta name="viewport" content="width=device-width"><title>Haramain</title>' +
        '<body style="font-family:system-ui;padding:2rem;color:#1E0B0C;background:#FBF9EE">' +
        '<h1 style="color:#6E2931">Haramain backend is installed</h1>' +
        '<p>You can close this tab and return to Shopify.</p></body>'),
  );

  app.get('/health', async () => {
    const checks: Record<string, string> = {};
    if (env.DATABASE_URL) {
      checks.postgres = await deps.prisma.$queryRaw`SELECT 1`.then(
        () => 'ok',
        () => 'down',
      );
    }
    if (redis) {
      checks.redis = await redis.ping().then(
        () => 'ok',
        () => 'down',
      );
    }
    return { status: Object.values(checks).includes('down') ? 'degraded' : 'ok', ...checks };
  });

  wishlistRoutes(app, deps);
  loyaltyRoutes(app, deps);
  deviceRoutes(app, deps);
  reviewRoutes(app, deps);
  authBridgeRoutes(app);
  app.register(async (scope) => webhookRoutes(scope, deps));

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  initSentry();
  buildServer().listen({ port: env.PORT, host: '0.0.0.0' });
}
