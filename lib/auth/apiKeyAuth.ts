/**
 * lib/auth/apiKeyAuth.ts — Autenticação de API Key para Next.js Route Handlers.
 *
 * Arquitetura (Abordagem A - Same-Origin Bypass + Gate Externo):
 * 1. O frontend do próprio Paflegis consome as rotas por caminhos relativos (/api/v1/...)
 *    sem necessidade de embutir chaves de build-time (NEXT_PUBLIC_* ou VITE_*).
 * 2. Requisições externas / de terceiros passam pelo gate caso API_KEYS_PERMITIDAS esteja configurada.
 * 3. Se nenhuma chave estiver configurada no servidor, o acesso público de consulta é mantido.
 */

import { NextRequest } from 'next/server';

export function getValidApiKeys(): Set<string> {
  const keys = new Set<string>();
  const envKeys = process.env.API_KEYS_PERMITIDAS;
  if (envKeys) {
    envKeys.split(',').forEach(k => {
      const trimmed = k.trim();
      if (trimmed) keys.add(trimmed);
    });
  }
  return keys;
}

export function maskApiKey(key?: string): string {
  if (!key) return '(ausente)';
  const s = key.trim();
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

/**
 * Verifica se a requisição tem origem no próprio site Paflegis (Same-Origin).
 */
export function isSameOriginRequest(req: NextRequest): boolean {
  const host = req.headers.get('host');
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const secFetchSite = req.headers.get('sec-fetch-site');

  // Navegador moderno explicitando same-origin
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  // Origem ou referer batendo com o host atual
  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) return true;
    } catch {
      // ignore
    }
  }

  if (referer && host) {
    try {
      const refUrl = new URL(referer);
      if (refUrl.host === host) return true;
    } catch {
      // ignore
    }
  }

  // Se não tem origin/referer (chamada interna server-side ou same-origin default)
  const isInternal = req.headers.get('x-internal-request') === '1';
  if (isInternal) return true;

  return false;
}

/**
 * Valida a autorização de uma requisição para a API.
 */
export function validateApiRequest(req: NextRequest): { authorized: boolean; reason?: string } {
  const validKeys = getValidApiKeys();

  // 1. Se nenhuma chave foi configurada no servidor, o portal é aberto e público
  if (validKeys.size === 0) {
    return { authorized: true };
  }

  // 2. Requisições do próprio frontend (same-origin) nunca são barradas por descompasso de chave
  if (isSameOriginRequest(req)) {
    return { authorized: true };
  }

  // 3. Extrai x-api-key do cabeçalho ou query param
  const headerKey = req.headers.get('x-api-key') || req.headers.get('X-API-KEY');
  const queryKey = req.nextUrl.searchParams.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  const keyReceived = headerKey || queryKey;

  if (keyReceived && validKeys.has(keyReceived.trim())) {
    return { authorized: true };
  }

  return {
    authorized: false,
    reason: keyReceived
      ? 'Chave de API inválida ou não autorizada pelo servidor.'
      : 'Chave de API ausente para requisição externa. Forneça o cabeçalho x-api-key.',
  };
}

/**
 * Informações seguras de diagnóstico para a rota /api/v1/health.
 */
export function getAuthDiagnostics(): {
  apiKeysConfigured: boolean;
  strategy: string;
  keysCount: number;
} {
  const validKeys = getValidApiKeys();
  return {
    apiKeysConfigured: validKeys.size > 0,
    strategy: 'same-origin-bypass + external-api-key-gate',
    keysCount: validKeys.size,
  };
}
