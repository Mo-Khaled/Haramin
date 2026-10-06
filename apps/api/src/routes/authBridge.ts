import type { FastifyInstance } from 'fastify';

const APP_CALLBACK = 'haramain://auth/callback';

/**
 * Shopify's Customer Account API may only accept HTTPS callback URLs. This endpoint is that URL:
 * it forwards the OAuth result (code/state or error) unchanged to the app's own scheme.
 */
export function authBridgeRoutes(app: FastifyInstance): void {
  app.get('/auth/callback', async (request, reply) => {
    const query = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
    return reply.redirect(`${APP_CALLBACK}${query}`, 302);
  });
}
