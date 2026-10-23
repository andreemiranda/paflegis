# Dockerfile — Construção e execução otimizada do Paflegis para Cloud Run e Docker
FROM node:22-alpine AS base
WORKDIR /app

# Instalação de dependências
FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Compilação
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . ./
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# Execução (Runner)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Cria diretório de dados persistentes para SQLite e cache
RUN mkdir -p .data && chown nextjs:nodejs .data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
