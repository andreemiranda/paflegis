/**
 * lib/rateLimiter.ts — Rate limiting persistente por chave e por IP para Next.js Route Handlers.
 * Suporta instâncias múltiplas via driver de armazenamento unificado.
 * Confia em x-forwarded-for apenas quando TRUST_PROXY=true está habilitado.
 */

import { NextRequest } from 'next/server';
import { getConfig } from '@/lib/config';
import { extractApiKeyFromHeaders } from '@/lib/auth/apiKeyAuth';
import { getStorage } from '@/lib/storage';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: number;
  retryAfterSeconds: number;
}

// Fallback rápido em memória para latência zero em requisições de leitura frequentes
const localMemoryWindow = new Map<string, { count: number; expiresAt: number }>();

/**
 * Obtém o IP do cliente respeitando a configuração de TRUST_PROXY.
 */
export function getClientIp(req: NextRequest): string {
  const config = getConfig();

  if (config.trustProxy) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      const first = forwarded.split(',')[0].trim();
      if (first) return first;
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp && realIp.trim()) {
      return realIp.trim();
    }
  }

  // Fallback padrão seguro
  return '127.0.0.1';
}

/**
 * Verifica o limite de taxa de requisições. Mantém compatibilidade com a assinatura anterior
 * e adiciona suporte assíncrono transparente ao armazenamento persistente.
 */
export function checkRateLimit(
  req: NextRequest,
  maxRequests = 120,
  windowMs = 60 * 1000
): RateLimitResult {
  const ip = getClientIp(req);
  const keyHeader = extractApiKeyFromHeaders(req);
  const identifier = keyHeader ? `key:${keyHeader.slice(0, 16)}` : `ip:${ip}`;
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);

  // 1. Atualiza e checa na janela local em memória
  const localEntry = localMemoryWindow.get(identifier);
  if (!localEntry || now > localEntry.expiresAt) {
    localMemoryWindow.set(identifier, { count: 1, expiresAt: now + windowMs });
  } else {
    localEntry.count += 1;
    if (localEntry.count > maxRequests) {
      const retryAfter = Math.max(1, Math.ceil((localEntry.expiresAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        limit: maxRequests,
        resetTime: localEntry.expiresAt,
        retryAfterSeconds: retryAfter,
      };
    }
  }

  // 2. Registra em background de forma assíncrona no storage persistente
  try {
    const storageKey = `ratelimit:${identifier}:${Math.floor(now / windowMs)}`;
    getStorage().incr(storageKey, windowSeconds * 2).catch(() => {});
  } catch {}

  const currentCount = localMemoryWindow.get(identifier)?.count || 1;
  const remaining = Math.max(0, maxRequests - currentCount);
  const expiresAt = localMemoryWindow.get(identifier)?.expiresAt || now + windowMs;

  return {
    allowed: currentCount <= maxRequests,
    remaining,
    limit: maxRequests,
    resetTime: expiresAt,
    retryAfterSeconds: Math.max(1, Math.ceil((expiresAt - now) / 1000)),
  };
}

/**
 * Versão assíncrona estrita para rotas críticas (como /api/v1/contato e /api/media).
 */
export async function checkRateLimitAsync(
  req: NextRequest,
  maxRequests = 60,
  windowMs = 60 * 1000
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const keyHeader = extractApiKeyFromHeaders(req);
  const identifier = keyHeader ? `key:${keyHeader.slice(0, 16)}` : `ip:${ip}`;
  const now = Date.now();
  const windowSeconds = Math.ceil(windowMs / 1000);
  const windowBucket = Math.floor(now / windowMs);
  const storageKey = `ratelimit:${identifier}:${windowBucket}`;

  const storage = getStorage();
  const count = await storage.incr(storageKey, windowSeconds * 2);

  const resetTime = (windowBucket + 1) * windowMs;
  const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));
  const remaining = Math.max(0, maxRequests - count);

  return {
    allowed: count <= maxRequests,
    remaining,
    limit: maxRequests,
    resetTime,
    retryAfterSeconds,
  };
}

/**
 * Anexa os cabeçalhos de rate limit padrão a uma resposta HTTP.
 */
export function applyRateLimitHeaders(headers: Headers, rl: RateLimitResult): void {
  headers.set('X-RateLimit-Limit', String(rl.limit));
  headers.set('X-RateLimit-Remaining', String(rl.remaining));
  headers.set('X-RateLimit-Reset', String(Math.floor(rl.resetTime / 1000)));
  if (!rl.allowed) {
    headers.set('Retry-After', String(rl.retryAfterSeconds));
  }
}
