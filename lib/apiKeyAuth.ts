/**
 * lib/apiKeyAuth.ts — Middleware de Autenticação por API Key e Rate Limiting
 * para o Paflegis.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Chaves padrão para quando a variável de ambiente não estiver definida no ambiente local
const FALLBACK_API_KEYS = [
  'paflegis_app_official_key_2026_98374',
  'paflegis_partner_demo_key_77182',
];

/**
 * Obtém o conjunto de chaves de API válidas a partir de variáveis de ambiente
 * (API_KEYS_PERMITIDAS ou VITE_API_KEY) com fallback seguro.
 */
export function getValidApiKeys(): Set<string> {
  const keys = new Set<string>();

  const envKeys = process.env.API_KEYS_PERMITIDAS;
  if (envKeys) {
    envKeys.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed) keys.add(trimmed);
    });
  }

  const viteKey = process.env.VITE_API_KEY;
  if (viteKey && viteKey.trim()) {
    keys.add(viteKey.trim());
  }

  // Se nenhuma chave foi configurada via env, utiliza as chaves padrão do projeto
  if (keys.size === 0) {
    FALLBACK_API_KEYS.forEach(k => keys.add(k));
  }

  return keys;
}

/**
 * Mascara uma chave de API para registro de logs seguros de auditoria.
 * Ex: "paflegis_app_official_key_2026_98374" -> "pafl...8374"
 */
export function maskApiKey(key?: string): string {
  if (!key) return '(ausente)';
  const s = key.trim();
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

/**
 * Valida se uma chave fornecida é válida.
 */
export function isValidApiKey(keyReceived?: string | string[]): boolean {
  if (!keyReceived) return false;
  const key = Array.isArray(keyReceived) ? keyReceived[0] : keyReceived;
  if (!key || typeof key !== 'string') return false;

  const validKeys = getValidApiKeys();
  return validKeys.has(key.trim());
}

/**
 * Extrai a chave de API de uma requisição HTTP (suporta cabeçalho x-api-key ou query param api_key / x-api-key).
 */
export function extractApiKeyFromReq(req: Request): string | undefined {
  const headerKey = req.headers['x-api-key'] || req.headers['X-API-KEY'] || req.headers['x-apikey'];
  if (headerKey) {
    return Array.isArray(headerKey) ? headerKey[0] : headerKey;
  }
  const queryKey = req.query?.['x-api-key'] || req.query?.['api_key'] || req.query?.['x_api_key'];
  if (queryKey) {
    return Array.isArray(queryKey) ? (queryKey[0] as string) : (queryKey as string);
  }
  return undefined;
}

/**
 * Middleware Express para proteger rotas de dados /api/v1/* com verificação de API Key.
 */
export function apiKeyAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const keyReceived = extractApiKeyFromReq(req);

  if (!isValidApiKey(keyReceived)) {
    const ip = req.ip || req.socket.remoteAddress || 'IP desconhecido';
    const path = req.originalUrl || req.url;
    const method = req.method;
    const masked = maskApiKey(keyReceived);

    console.warn(`[AUDITORIA API KEY] Rejeitada tentativa de acesso não autorizada. Rota: ${method} ${path} | IP: ${ip} | Key: ${masked}`);

    res.status(401).json({
      error: 'Chave de API ausente ou inválida. Forneça um cabeçalho x-api-key válido.',
      code: 'UNAUTHORIZED_API_KEY',
    });
    return;
  }

  next();
}

/**
 * Rate Limiter para prevenção de sobrecarga por IP e por API Key.
 * Limite de 120 requisições por minuto por chave ou por IP.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 120, // máximo de 120 requisições por janela por chave/IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const key = extractApiKeyFromReq(req);
    if (key && typeof key === 'string' && key.trim()) {
      return `key:${key.trim()}`;
    }
    return `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Limite de requisições excedido. Tente novamente em alguns momentos.',
      code: 'TOO_MANY_REQUESTS',
    });
  },
});
