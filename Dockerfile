# ── Paflegis - Dockerfile multi-stage ─────────────────────────────────────────
# Compatível com Heroku, Render, Railway, Fly.io e qualquer plataforma Docker.

# ── Stage 1: build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências primeiro (camada cacheável)
COPY package*.json ./
RUN npm ci

# Copia o restante do código e builda
COPY . .
RUN npm run build

# ── Stage 2: runtime ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia apenas o necessário para rodar
COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Usuário não-root por segurança
RUN addgroup -S paflegis && adduser -S paflegis -G paflegis
USER paflegis

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/stats || exit 1

CMD ["node", "dist/server.cjs"]
