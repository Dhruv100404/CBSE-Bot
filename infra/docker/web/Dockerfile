FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --no-frozen-lockfile

FROM deps AS dev
COPY . .
WORKDIR /app/apps/web
CMD ["sh", "-lc", "pnpm install --no-frozen-lockfile && pnpm --filter web exec next dev --hostname 0.0.0.0 --port 3000"]
