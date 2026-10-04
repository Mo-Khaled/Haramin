import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireCustomer } from '../auth/customerAuth.js';
import type { AppDeps } from '../deps.js';

const bodySchema = z.object({
  token: z.string().min(10).max(200),
  platform: z.string().max(20),
  language: z.enum(['en', 'ar']).default('en'),
});

export function deviceRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.post('/devices', { preHandler: requireCustomer(deps.verifyCustomer) }, async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_device' });
    const { token, platform, language } = parsed.data;
    await deps.prisma.deviceToken.upsert({
      where: { token },
      create: { token, platform, language, shopifyCustomerId: request.customerId },
      update: { platform, language, shopifyCustomerId: request.customerId },
    });
    return { ok: true };
  });
}
