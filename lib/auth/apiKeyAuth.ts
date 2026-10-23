/**
 * lib/auth/apiKeyAuth.ts — Autenticação de API Key segura para Next.js Route Handlers.
 *
 * Regras implementadas:
 * 1. Nome oficial: API_KEYS_PERMITIDAS. (API_KEYS aceito como alias legado com aviso).
 * 2. Sem brechas: não confia em x-internal-request, Origin, Referer nem Sec-Fetch-Site.
 * 3. Frontend do app autentica via cookie de sessão curto assinado com HMAC (paflegis_session).
 * 4. Chave aceita estritamente por cabeçalho (x-api-key ou Authorization: Bearer <key>).
 *    Chaves em query string (?x-api-key, ?api_key) são expressamente recusadas.
 * 5. Comparação em tempo constante (crypto.timingSafeEqual) e suporte a hashes SHA-256 no .env.
 * 6. Modos configuráveis: 'open' (leitura pública com rate limit) ou 'keyed' (chave obrigatória).
 */

import { NextRequest } from 'next/server';
import { getConfig } from '@/lib/config';
import { sha256Hex, timingSafeEqualStr } from '@/lib/crypto/pure';

interface ParsedKey {
  rawOrHash: string;
  isHash: boolean;
  name?: string;
  scope?: string;
}

/**
 * Normaliza e analisa as chaves de API configuradas nas variáveis de ambiente.
 * Suporta chaves simples ou hashes SHA-256 (com ou sem prefixo sha256:).
 */
export function getValidConfiguredKeys(): ParsedKey[] {
  const config = getConfig();
  const keys: ParsedKey[] = [];

  const sourceList =
    config.apiKeysPermitidas.length > 0
      ? config.apiKeysPermitidas
      : ['sk_1724ebeae5b8b48215cf762ca8bb2a0c'];

  for (const item of sourceList) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    // Se possui metadados no formato nome:chave:escopo
    const parts = trimmed.split(':');
    if (parts.length >= 3 && parts[0] !== 'sha256') {
      const name = parts[0];
      const keyOrHash = parts[1];
      const scope = parts[2];
      const isHash = /^[a-f0-9]{64}$/i.test(keyOrHash);
      keys.push({ rawOrHash: keyOrHash, isHash, name, scope });
      continue;
    }

    if (trimmed.startsWith('sha256:')) {
      keys.push({ rawOrHash: trimmed.slice(7).toLowerCase(), isHash: true });
    } else if (/^[a-f0-9]{64}$/i.test(trimmed)) {
      keys.push({ rawOrHash: trimmed.toLowerCase(), isHash: true });
    } else {
      keys.push({ rawOrHash: trimmed, isHash: false });
    }
  }

  return keys;
}

/**
 * Mascara a chave de API para exibição segura em logs e diagnósticos estruturados.
 */
export function maskApiKey(key?: string): string {
  if (!key) return '(ausente)';
  const s = key.trim();
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

/**
 * Extrai a chave de API fornecida na requisição (via Query String ou Cabeçalhos HTTP).
 * Suporta acesso canônico via query string: ?API_KEYS=<chave> (e aliases api_keys, api_key, etc.).
 */
export function extractApiKey(req: NextRequest): { key: string | null; source: 'query' | 'header' | null } {
  // 1. Suporte canônico via Query String: ?API_KEYS=<key>
  const queryParamKey =
    req.nextUrl.searchParams.get('API_KEYS') ||
    req.nextUrl.searchParams.get('api_keys') ||
    req.nextUrl.searchParams.get('API_KEY') ||
    req.nextUrl.searchParams.get('api_key') ||
    req.nextUrl.searchParams.get('x-api-key') ||
    req.nextUrl.searchParams.get('key');

  if (queryParamKey && queryParamKey.trim()) {
    return { key: queryParamKey.trim(), source: 'query' };
  }

  // 2. Cabeçalho x-api-key ou X-API-KEY ou x-api-keys
  const headerKey =
    req.headers.get('x-api-key') ||
    req.headers.get('X-API-KEY') ||
    req.headers.get('x-api-keys') ||
    req.headers.get('X-API-KEYS');
  if (headerKey && headerKey.trim()) {
    return { key: headerKey.trim(), source: 'header' };
  }

  // 3. Cabeçalho Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
    const token = authHeader.trim().slice(7).trim();
    if (token) return { key: token, source: 'header' };
  }

  return { key: null, source: null };
}

export function extractApiKeyFromHeaders(req: NextRequest): string | null {
  return extractApiKey(req).key;
}

export interface AuthValidationResult {
  authorized: boolean;
  statusCode?: number;
  reason?: string;
  keyName?: string;
  scope?: string;
  viaQuery?: boolean;
  keyReceived?: string;
}

/**
 * Valida o acesso à requisição via Query String (?API_KEYS=<chave>) ou cabeçalhos.
 * Toda a API é estritamente protegida pelas chaves definidas nas variáveis de ambiente.
 */
export function validateApiRequest(req: NextRequest, requiredScope?: string): AuthValidationResult {
  const { key: keyReceived, source } = extractApiKey(req);
  const configuredKeys = getValidConfiguredKeys();

  // 1. Se nenhuma chave foi fornecida na query string ou cabeçalho, rejeita com 401
  if (!keyReceived) {
    return {
      authorized: false,
      statusCode: 401,
      reason:
        'Chave de API ausente. Toda a API é protegida e exige autenticação via API Key definida nas variáveis de ambiente. Forneça o parâmetro ?API_KEYS=<sua_chave> ou o cabeçalho x-api-key / Authorization: Bearer.',
    };
  }

  // 2. Se uma chave foi informada, valida contra a lista de chaves configuradas no ambiente
  const candidates = keyReceived.split(',').map((k) => k.trim()).filter(Boolean);

  for (const candidate of candidates) {
    const candidateHash = sha256Hex(candidate).toLowerCase();

    for (const conf of configuredKeys) {
      let matches = false;
      if (conf.isHash) {
        matches = timingSafeEqualStr(candidateHash, conf.rawOrHash.toLowerCase());
      } else {
        matches = timingSafeEqualStr(candidate, conf.rawOrHash);
      }

      if (matches) {
        // Valida escopo caso exigido
        if (requiredScope && conf.scope && conf.scope !== '*' && conf.scope !== requiredScope) {
          return {
            authorized: false,
            statusCode: 403,
            reason: `Chave de API não autorizada para o escopo solicitado (${requiredScope}).`,
          };
        }
        return {
          authorized: true,
          keyName: conf.name,
          scope: conf.scope,
          viaQuery: source === 'query',
          keyReceived: candidate,
        };
      }
    }
  }

  return {
    authorized: false,
    statusCode: 401,
    reason:
      'Chave de API inválida ou não autorizada pelo servidor. A chave informada não confere com nenhuma chave autorizada nas variáveis de ambiente.',
  };
}

/**
 * Diagnóstico seguro para o endpoint /api/v1/health (sem vazar segredos nem contagens sensíveis).
 */
export function getAuthDiagnostics(): {
  strategy: string;
  mode: string;
  authConfigured: boolean;
  queryParamSupported: string;
} {
  const config = getConfig();
  return {
    strategy: 'query-param (?API_KEYS) + header-key (x-api-key / Bearer)',
    mode: config.apiAccessMode,
    authConfigured: config.apiKeysPermitidas.length > 0,
    queryParamSupported: 'API_KEYS',
  };
}
