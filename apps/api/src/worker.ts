import { Worker } from "bullmq";
import { redis } from "./lib/redis.js";
import { initSentry, Sentry } from "./lib/sentry.js";
import { QUEUE_NAME } from "./queues/index.js";

initSentry();

if (!redis) {
  console.error("REDIS_URL is required to run the worker");
  process.exit(1);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    // Handlers (points, push, Bosta) are added in later milestones.
    console.log(`job ${job.name} ${job.id}`);
  },
  { connection: redis },
);

worker.on("failed", (job, err) => Sentry.captureException(err, { extra: { job: job?.name } }));
console.log("worker started");
