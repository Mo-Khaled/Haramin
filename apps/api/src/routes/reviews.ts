import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import type { AppDeps } from '../deps.js';
import { ReviewsUnavailableError } from '../services/judgeme.js';

const handleSchema = z.string().regex(/^[a-z0-9-]{1,255}$/);

const createSchema = z.object({
  productId: z.string().regex(/^(gid:\/\/shopify\/Product\/)?\d+$/),
  handle: handleSchema,
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10).max(5000),
});

/** Public endpoints: anyone browsing a product can read and write reviews, as on the website. */
export function reviewRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.get('/reviews/:handle', async (request, reply) => {
    const parsed = handleSchema.safeParse((request.params as { handle: string }).handle);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_handle' });
    try {
      return await deps.reviews.getSummary(parsed.data);
    } catch (error) {
      if (error instanceof ReviewsUnavailableError) return reply.code(503).send({ error: 'reviews_unavailable' });
      throw error;
    }
  });

  // Public and unauthenticated, so the tightest limit: a few reviews per hour per IP.
  app.post('/reviews', { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_review' });
    try {
      await deps.reviews.submit(parsed.data);
    } catch (error) {
      if (error instanceof ReviewsUnavailableError) return reply.code(503).send({ error: 'reviews_unavailable' });
      throw error;
    }
    return reply.code(201).send({ ok: true });
  });
}
