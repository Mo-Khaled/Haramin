import { env } from '../lib/env.js';
import { adminGraphql } from './shopifyAdmin.js';

const TOPICS = ['ORDERS_CREATE', 'ORDERS_PAID', 'PRODUCTS_UPDATE', 'CHECKOUTS_CREATE', 'CHECKOUTS_UPDATE'] as const;

interface ExistingSubscription {
  topic: string;
  endpoint: { callbackUrl?: string };
}

/** Subscribes the store to every topic the worker handles. Safe to run on every boot. */
export async function ensureWebhooks(): Promise<string[]> {
  if (!env.PUBLIC_API_URL) throw new Error('PUBLIC_API_URL is required to register webhooks');
  const callbackUrl = `${env.PUBLIC_API_URL}/webhooks/shopify`;

  const existing = await adminGraphql<{ webhookSubscriptions: { nodes: ExistingSubscription[] } }>(
    `{ webhookSubscriptions(first: 50) { nodes { topic endpoint { ... on WebhookHttpEndpoint { callbackUrl } } } } }`,
  );
  const registered = new Set(
    existing.webhookSubscriptions.nodes.filter((s) => s.endpoint.callbackUrl === callbackUrl).map((s) => s.topic),
  );

  const created: string[] = [];
  for (const topic of TOPICS.filter((t) => !registered.has(t))) {
    const result = await adminGraphql<{ webhookSubscriptionCreate: { userErrors: { message: string }[] } }>(
      `mutation Subscribe($topic: WebhookSubscriptionTopic!, $url: URL!) {
        webhookSubscriptionCreate(topic: $topic, webhookSubscription: { callbackUrl: $url, format: JSON }) {
          userErrors { message }
        }
      }`,
      { topic, url: callbackUrl },
    );
    const errors = result.webhookSubscriptionCreate.userErrors;
    if (errors.length) throw new Error(`Webhook ${topic}: ${errors.map((e) => e.message).join('; ')}`);
    created.push(topic);
  }
  return created;
}
