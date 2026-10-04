import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireCustomer } from '../auth/customerAuth.js';
import type { AppDeps } from '../deps.js';

const productIdSchema = z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/);
const addBody = z.object({ productId: productIdSchema });

export function wishlistRoutes(app: FastifyInstance, deps: AppDeps): void {
  const auth = requireCustomer(deps.verifyCustomer);

  app.get('/wishlist', { preHandler: auth }, async (request) => {
    const items = await deps.prisma.wishlistItem.findMany({
      where: { shopifyCustomerId: request.customerId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return { productIds: items.map((i) => i.productId) };
  });

  app.post('/wishlist', { preHandler: auth }, async (request, reply) => {
    const parsed = addBody.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_product_id' });
    const { productId } = parsed.data;
    await deps.prisma.wishlistItem.upsert({
      where: { shopifyCustomerId_productId: { shopifyCustomerId: request.customerId, productId } },
      create: { shopifyCustomerId: request.customerId, productId },
      update: {},
    });
    return { ok: true };
  });

  app.delete('/wishlist/:productId', { preHandler: auth }, async (request, reply) => {
    const parsed = productIdSchema.safeParse((request.params as { productId: string }).productId);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_product_id' });
    await deps.prisma.wishlistItem.deleteMany({
      where: { shopifyCustomerId: request.customerId, productId: parsed.data },
    });
    return { ok: true };
  });
}
