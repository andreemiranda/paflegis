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

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { getConfig } from '@/lib/config';
import { hasValidSession } from '@/lib/auth/session';

interface ParsedKey {
  rawOrHash: string;
  isHash: boolean;
  name?: string;
  scope?: string;
}

/**
 * Normaliza e analisa as chaves de API configuradas.
 * Suporta chaves simples ou hashes SHA-256 (com ou sem prefixo sha256:).
 */
export function getValidConfiguredKeys(): ParsedKey[] {
  const config = getConfig();
  const keys: ParsedKey[] = [];

  for (const item of config.apiKeysPermitidas) {
    const trimmed = item.trim();
    if (!trimmed) continue;

    // Se possui metadados no formato nome:chave:escopo
    const parts = trimmed.split(':');
    if (parts.length >= 3 && (parts[0] !== 'sha256')) {
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
 * Mascara a chave de API para exibição segura em logs estruturados.
 */
export function maskApiKey(key?: string): string {
  if (!key) return '(ausente)';
  const s = key.trim();
  if (s.length <= 8) return '****';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

/**
 * Compara duas strings em tempo constante para mitigar ataques de temporização.
 */
function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Cria buffer de tamanho igual para garantir execução constante
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Extrai a chave de API exclusivamente através de cabeçalhos HTTP.
 * Qualquer tentativa de envio por query param é ignorada intencionalmente para segurança.
 */
export function extractApiKeyFromHeaders(req: NextRequest): string | null {
  // 1. Cabeçalho x-api-key ou X-API-KEY
  const headerKey = req.headers.get('x-api-key') || req.headers.get('X-API-KEY');
  if (headerKey && headerKey.trim()) {
    return headerKey.trim();
  }

  // 2. Cabeçalho Authorization: Bearer <key>
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.trim().toLowerCase().startsWith('bearer ')) {
    const token = authHeader.trim().slice(7).trim();
    if (token) return token;
  }

  return null;
}

export interface AuthValidationResult {
  authorized: boolean;
  statusCode?: number;
  reason?: string;
  keyName?: string;
  scope?: string;
  isSessionUser?: boolean;
}

/**
 * Valida o acesso à requisição.
 */
export function validateApiRequest(req: NextRequest, requiredScope?: string): AuthValidationResult {
  const config = getConfig();

  // 1. Se o cliente possui uma sessão segura assinada com HMAC emitida pelo servidor do app
  if (hasValidSession(req)) {
    return { authorized: true, isSessionUser: true };
  }

  // 2. Verifica se o cliente tentou enviar chave pela query string (proibido pela Parte 1 Ponto 3)
  const queryKey = req.nextUrl.searchParams.get('x-api-key') || req.nextUrl.searchParams.get('api_key');
  if (queryKey) {
    return {
      authorized: false,
      statusCode: 400,
      reason: 'Por razões de segurança, chaves de API não são aceitas via URL (query string). Envie pelo cabeçalho x-api-key ou Authorization: Bearer.',
    };
  }

  // 3. Extrai chave do cabeçalho
  const keyReceived = extractApiKeyFromHeaders(req);
  const configuredKeys = getValidConfiguredKeys();

  // Se uma chave foi enviada, valida contra a lista de chaves permitidas
  if (keyReceived) {
    const keyHash = crypto.createHash('sha256').update(keyReceived).digest('hex').toLowerCase();

    for (const conf of configuredKeys) {
      let matches = false;
      if (conf.isHash) {
        matches = constantTimeCompare(keyHash, conf.rawOrHash.toLowerCase());
      } else {
        matches = constantTimeCompare(keyReceived, conf.rawOrHash);
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
        };
      }
    }

    return {
      authorized: false,
      statusCode: 401,
      reason: 'Chave de API inválida ou não autorizada pelo servidor.',
    };
  }

  // Se nenhuma chave foi fornecida e o modo é OPEN: acesso público de leitura permitido
  if (config.apiAccessMode === 'open') {
    return { authorized: true };
  }

  // Se o modo é KEYED: chave é estritamente obrigatória
  return {
    authorized: false,
    statusCode: 401,
    reason: 'Chave de API ausente para requisição externa. Forneça o cabeçalho x-api-key ou Authorization: Bearer.',
  };
}

/**
 * Diagnóstico seguro para o endpoint /api/v1/health (sem vazar segredos nem contagens sensíveis).
 */
export function getAuthDiagnostics(): {
  strategy: string;
  mode: string;
  authConfigured: boolean;
} {
  const config = getConfig();
  return {
    strategy: 'header-key + hmac-session',
    mode: config.apiAccessMode,
    authConfigured: config.apiKeysPermitidas.length > 0,
  };
}
