FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

FROM base AS builder
WORKDIR /app
RUN npm install -g turbo@^2.3.0
COPY . .
RUN turbo prune @mijersey/admin --docker

FROM base AS installer
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm turbo run build --filter=@mijersey/admin...

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=installer /app/apps/admin/public ./apps/admin/public
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/admin/.next/static ./apps/admin/.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/admin/server.js"]
