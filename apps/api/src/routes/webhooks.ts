import { Prisma } from '@prisma/client';
import { timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

import { bostaEventSchema, bostaStateCode } from '../domain/bosta.js';
import type { AppDeps } from '../deps.js';
import { env, shopifyWebhookSecret } from '../lib/env.js';
import { verifyShopifyHmac } from '../lib/hmac.js';
import type { JobName } from '../queues/index.js';

const TOPIC_TO_JOB: Record<string, JobName> = {
  'orders/create': 'order.created',
  'orders/paid': 'order.paid',
  'orders/cancelled': 'order.cancelled',
  'refunds/create': 'refund.created',
  'products/update': 'product.updated',
  'checkouts/create': 'checkout.updated',
  'checkouts/update': 'checkout.updated',
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function parseBostaBody(body: Buffer) {
  try {
    return bostaEventSchema.safeParse(JSON.parse(body.toString('utf8')));
  } catch {
    return { success: false as const };
  }
}

/** Webhook endpoints need the raw body for signature checks, so they live in their own plugin scope. */
export function webhookRoutes(app: FastifyInstance, deps: AppDeps): void {
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => done(null, body));

  // Shopify and Bosta deliver in bursts from shared IPs; signatures, not rate limits, protect these.
  app.post('/webhooks/shopify', { config: { rateLimit: false } }, async (request, reply) => {
    const raw = request.body as Buffer;
    const signature = request.headers['x-shopify-hmac-sha256'] as string | undefined;
    if (!verifyShopifyHmac(raw, signature, shopifyWebhookSecret)) {
      request.log.warn('rejected Shopify webhook: bad signature');
      return reply.code(401).send({ error: 'bad_signature' });
    }

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

  app.post('/webhooks/bosta', { config: { rateLimit: false } }, async (request, reply) => {
    const secret = (request.query as { secret?: string }).secret ?? '';
    if (!env.BOSTA_WEBHOOK_SECRET || !safeEqual(secret, env.BOSTA_WEBHOOK_SECRET)) {
      request.log.warn('rejected Bosta webhook: bad secret');
      return reply.code(401).send({ error: 'unauthorized' });
    }
    const parsed = parseBostaBody(request.body as Buffer);
    if (!parsed.success) return reply.code(400).send({ error: 'invalid_event' });
    const event = parsed.data;
    // Only validated scalars reach the queue: the job id and the handler's database lookup both use them.
    const jobId = `bosta-${event._id ?? event.trackingNumber}-${bostaStateCode(event)}`;
    await deps.enqueue('bosta.status', event, jobId);
    return reply.code(200).send({ ok: true });
  });
}
