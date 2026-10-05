import { Worker } from 'bullmq';

import { createHandlers } from './jobs/handlers.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { initSentry, Sentry } from './lib/sentry.js';
import { QUEUE_NAME, scheduleRecurringJobs, type JobName } from './queues/index.js';
import { ensureWebhooks } from './services/webhookRegistration.js';

initSentry();

if (!redis) {
  console.error('REDIS_URL is required to run the worker');
  process.exit(1);
}

const handlers = createHandlers(prisma);

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const handler = handlers[job.name as JobName];
    if (!handler) throw new Error(`No handler for job ${job.name}`);
    await handler(job.data);
  },
  { connection: redis, concurrency: 5 },
);

worker.on('failed', (job, error) => {
  console.error(`job ${job?.name} failed`, error);
  Sentry.captureException(error, { extra: { job: job?.name, attemptsMade: job?.attemptsMade } });
});

await scheduleRecurringJobs();
console.log('worker started');

// Registration needs Shopify credentials; a failure must not stop the worker from processing jobs.
ensureWebhooks().then(
  (created) => console.log(created.length ? `registered webhooks: ${created.join(', ')}` : 'webhooks already registered'),
  (error) => {
    console.error('webhook registration failed', error);
    Sentry.captureException(error);
  },
);
