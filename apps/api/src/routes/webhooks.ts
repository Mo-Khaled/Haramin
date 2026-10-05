import { Prisma } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

import type { AppDeps } from '../deps.js';
import { env, shopifyWebhookSecret } from '../lib/env.js';
import { verifyShopifyHmac } from '../lib/hmac.js';
import type { JobName } from '../queues/index.js';

const TOPIC_TO_JOB: Record<string, JobName> = {
  'orders/create': 'order.created',
  'orders/paid': 'order.paid',
  'products/update': 'product.updated',
  'checkouts/create': 'checkout.updated',
  'checkouts/update': 'checkout.updated',
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Webhook endpoints need the raw body for signature checks, so they live in their own plugin scope. */
export function webhookRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));

  app.post('/webhooks/shopify', async (request, reply) => {
    const raw = request.body as Buffer;
    const signature = request.headers['x-shopify-hmac-sha256'] as string | undefined;
    if (!verifyShopifyHmac(raw, signature, shopifyWebhookSecret)) return reply.code(401).send({ error: 'bad_signature' });

    const topic = request.headers['x-shopify-topic'] as string | undefined;
    const eventId = request.headers['x-shopify-event-id'] as string | undefined;
    const job = topic ? TOPIC_TO_JOB[topic] : undefined;
    if (!job || !eventId) return reply.code(200).send({ ignored: true });

    try {
      await deps.prisma.processedWebhook.create({ data: { id: eventId, topic: topic! } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(200).send({ duplicate: true });
      }
      throw error;
    }

    try {
      await deps.enqueue(job, JSON.parse(raw.toString('utf8')), eventId);
    } catch (error) {
      // Release the claim so Shopify's retry can enqueue it again.
      await deps.prisma.processedWebhook.delete({ where: { id: eventId } }).catch(() => undefined);
      throw error;
    }
    return reply.code(200).send({ ok: true });
  });

  app.post('/webhooks/bosta', async (request, reply) => {
    const secret = (request.query as { secret?: string }).secret ?? '';
    if (!env.BOSTA_WEBHOOK_SECRET || !safeEqual(secret, env.BOSTA_WEBHOOK_SECRET)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const event = JSON.parse((request.body as Buffer).toString('utf8')) as { _id?: string; state?: unknown };
    const jobId = `bosta-${event._id ?? 'unknown'}-${JSON.stringify(event.state)}`;
    await deps.enqueue('bosta.status', event, jobId);
    return reply.code(200).send({ ok: true });
  });
}
