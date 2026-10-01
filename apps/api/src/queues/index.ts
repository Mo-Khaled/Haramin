import { Queue } from "bullmq";
import { redis } from "../lib/redis.js";

export const QUEUE_NAME = "haramain-jobs";

export type JobName = "order.paid" | "order.fulfilled" | "product.updated";

export const jobsQueue = redis ? new Queue(QUEUE_NAME, { connection: redis }) : null;
