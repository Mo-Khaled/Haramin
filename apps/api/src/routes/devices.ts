import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { requireCustomer } from '../auth/customerAuth.js';
import type { AppDeps } from '../deps.js';

/** A customer rarely has more phones than this; older registrations are dropped beyond it. */
const MAX_DEVICES_PER_CUSTOMER = 10;

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
    const stale = await deps.prisma.deviceToken.findMany({
      where: { shopifyCustomerId: request.customerId },
      orderBy: { createdAt: 'desc' },
      skip: MAX_DEVICES_PER_CUSTOMER,
      select: { id: true },
    });
    if (stale.length) await deps.prisma.deviceToken.deleteMany({ where: { id: { in: stale.map((d) => d.id) } } });
    return { ok: true };
  });

  // Called on sign-out so a shared phone stops receiving the previous customer's order pushes.
  app.delete('/devices/:token', { preHandler: requireCustomer(deps.verifyCustomer) }, async (request) => {
    const { token } = request.params as { token: string };
    await deps.prisma.deviceToken.deleteMany({ where: { token, shopifyCustomerId: request.customerId } });
    return { ok: true };
  });
}
