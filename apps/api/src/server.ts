import Fastify from "fastify";
import { env } from "./lib/env.js";
import { initSentry, Sentry } from "./lib/sentry.js";
import { prisma } from "./lib/prisma.js";
import { redis } from "./lib/redis.js";

export function buildServer() {
  const app = Fastify({ logger: true });

  app.setErrorHandler((err, _req, reply) => {
    Sentry.captureException(err);
    app.log.error(err);
    reply.status(500).send({ error: "internal_error" });
  });

  app.get("/health", async () => {
    const checks: Record<string, string> = {};
    if (env.DATABASE_URL) {
      try {
        await prisma.$queryRaw`SELECT 1`;
        checks.postgres = "ok";
      } catch {
        checks.postgres = "down";
      }
    }
    if (redis) {
      try {
        await redis.ping();
        checks.redis = "ok";
      } catch {
        checks.redis = "down";
      }
    }
    const down = Object.values(checks).includes("down");
    return { status: down ? "degraded" : "ok", ...checks };
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  initSentry();
  buildServer().listen({ port: env.PORT, host: "0.0.0.0" });
}
