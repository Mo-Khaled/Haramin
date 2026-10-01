FROM node:20-slim
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm install --filter @haramain/api... 
WORKDIR /app/apps/api
RUN pnpm prisma generate && pnpm build
CMD ["sh", "-c", "pnpm prisma migrate deploy && node dist/server.js"]
