FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY pnpm-workspace.yaml package.json .npmrc pnpm-lock.yaml ./
COPY packages/shared packages/shared
COPY apps/api apps/api
COPY apps/mobile/package.json apps/mobile/package.json

RUN pnpm install --frozen-lockfile --filter @haramain/api...
RUN pnpm --filter @haramain/shared build
WORKDIR /app/apps/api
RUN pnpm prisma generate && pnpm build

# API service. For the worker service, override the start command with: node dist/worker.js
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
