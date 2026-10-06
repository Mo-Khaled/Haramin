import { Queue } from 'bullmq';

import { redis } from '../lib/redis.js';

export const QUEUE_NAME = 'haramain-jobs';

export type JobName =
  | 'order.created'
  | 'order.paid'
  | 'order.cancelled'
  | 'refund.created'
  | 'product.updated'
  | 'checkout.updated'
  | 'bosta.status'
  | 'cron.abandoned-checkouts';

export type Enqueue = (name: JobName, data: unknown, jobId: string) => Promise<void>;

const jobsQueue = redis ? new Queue(QUEUE_NAME, { connection: redis }) : null;

export const enqueue: Enqueue = async (name, data, jobId) => {
  if (!jobsQueue) throw new Error('REDIS_URL is not configured');
  await jobsQueue.add(name, data, {
    jobId,
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  });
};

export async function scheduleRecurringJobs(): Promise<void> {
  if (!jobsQueue) return;
  await jobsQueue.upsertJobScheduler('abandoned-checkouts', { every: 15 * 60_000 }, { name: 'cron.abandoned-checkouts' });
}
