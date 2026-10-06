import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';

import { verifyWithShopify } from './auth/customerAuth.js';
import type { AppDeps } from './deps.js';
import { env } from './lib/env.js';
import { prisma } from './lib/prisma.js';
import { redactUrl } from './lib/redact.js';
import { redis } from './lib/redis.js';
import { initSentry, Sentry } from './lib/sentry.js';
import { enqueue } from './queues/index.js';
import { accountRoutes } from './routes/account.js';
import { authBridgeRoutes } from './routes/authBridge.js';
import { deviceRoutes } from './routes/devices.js';
import { loyaltyRoutes } from './routes/loyalty.js';
import { reviewRoutes } from './routes/reviews.js';
import { webhookRoutes } from './routes/webhooks.js';
import { wishlistRoutes } from './routes/wishlist.js';
import { createJudgemeService } from './services/judgeme.js';
import { creditStoreCredit, requestCustomerErasure } from './services/shopifyAdmin.js';

const LANDING_PAGE =
  '<!doctype html><meta name="viewport" content="width=device-width"><title>Haramain</title>' +
  '<body style="font-family:system-ui;padding:2rem;color:#1E0B0C;background:#FBF9EE">' +
  '<h1 style="color:#6E2931">Haramain backend is installed</h1>' +
  '<p>You can close this tab and return to Shopify.</p></body>';

export function defaultDeps(): AppDeps {
  return { prisma, enqueue, verifyCustomer: verifyWithShopify, creditStoreCredit, requestCustomerErasure, reviews: createJudgemeService() };
}

function infoRoutes(app: FastifyInstance, deps: AppDeps): void {
  // Shopify opens the app URL (this root) after installing the backend app; confirm instead of 404ing.
  app.get('/', async (_request, reply) => reply.type('text/html').send(LANDING_PAGE));

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
}

export function buildServer(deps: AppDeps = defaultDeps()) {
  const app = Fastify({
    logger:
      process.env.NODE_ENV === 'test'
        ? false
        : {
            serializers: {
              // Webhook secrets and OAuth codes travel in query strings; keep them out of the logs.
              req: (request) => ({ method: request.method, url: redactUrl(request.url), ip: request.ip }),
            },
          },
    // Railway's edge is exactly one proxy hop; trusting only it stops clients spoofing X-Forwarded-For.
    trustProxy: (_address: string, hop: number) => hop === 0,
  });

  app.setErrorHandler((error, request, reply) => {
    const status = (error as { statusCode?: number }).statusCode ?? 500;
    if (status >= 400 && status < 500) {
      request.log.warn({ statusCode: status }, 'client error');
      return reply.status(status).send({ error: status === 429 ? 'rate_limited' : 'bad_request' });
    }
    Sentry.captureException(error);
    request.log.error(error);
    return reply.status(500).send({ error: 'internal_error' });
  });

  // Fastify's default 404 logs the raw URL, which could carry ?secret= from a misconfigured webhook.
  app.setNotFoundHandler((request, reply) => {
    request.log.warn({ url: redactUrl(request.url) }, 'route not found');
    return reply.code(404).send({ error: 'not_found' });
  });

  app.register(helmet);
  app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    // Shared across API replicas when Redis is configured; in-memory otherwise (tests, local).
    redis: redis ?? undefined,
    nameSpace: 'haramain-rl-',
  });

  // Routes live in a child scope registered after the plugins so every route gets their hooks.
  app.register(async (scope) => {
    infoRoutes(scope, deps);
    wishlistRoutes(scope, deps);
    loyaltyRoutes(scope, deps);
    deviceRoutes(scope, deps);
    accountRoutes(scope, deps);
    reviewRoutes(scope, deps);
    authBridgeRoutes(scope);
    scope.register(async (webhooks) => webhookRoutes(webhooks, deps));
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  initSentry();
  buildServer().listen({ port: env.PORT, host: '0.0.0.0' });
}
