FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl

FROM base AS builder
WORKDIR /app
RUN npm install -g turbo@^2.3.0
COPY . .
RUN turbo prune @mijersey/api --docker

FROM base AS installer
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
COPY tsconfig.base.json ./tsconfig.base.json
RUN pnpm --filter=@mijersey/api prisma:generate
RUN pnpm turbo run build --filter=@mijersey/api...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
COPY --from=installer /app .
RUN mkdir -p /app/uploads && chown -R nestjs:nodejs /app/uploads
USER nestjs
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
