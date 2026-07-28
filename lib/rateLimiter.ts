/**
 * lib/rateLimiter.ts — Controlagem de taxa de requisições por IP.
 * Funciona tanto em servidores Node.js quanto em funções serverless Vercel.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Limpeza automática periódica de entradas expiradas
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
  if (timer && typeof timer === 'object' && 'unref' in timer && typeof timer.unref === 'function') {
    timer.unref();
  }
}

/**
 * Obtém o endereço IP do cliente a partir de uma requisição HTTP.
 */
export function getClientIp(req: any): string {
  if (!req) return '127.0.0.1';

  const forwarded = req.headers?.['x-forwarded-for'] || req.headers?.['X-Forwarded-For'];
  if (forwarded) {
    const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const ip = String(rawIp).split(',')[0].trim();
    if (ip) return ip;
  }

  const realIp = req.headers?.['x-real-ip'] || req.headers?.['X-Real-IP'];
  if (realIp && typeof realIp === 'string') {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Verifica se o IP excedeu a quantidade máxima de requisições na janela informada (em milissegundos).
 */
export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = ip || 'unknown_ip';
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime };
}
