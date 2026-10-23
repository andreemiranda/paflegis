/**
 * lib/sanitization/index.ts — Módulo unificado de sanitização de IP, reescrita de links e proteção LGPD.
 * Converte IPs de origem e URLs do SAPL para o domínio oficial público ou para os endpoints nativos do app.
 */

import { getConfig } from '@/lib/config';

// Campos sensíveis de dados pessoais que não devem ser expostos publicamente
const LGPD_SENSITIVE_KEYS = new Set([
  'cpf',
  'rg',
  'titulo_eleitor',
  'telefone_celular',
  'celular_pessoal',
  'telefone_residencial',
  'endereco_residencial',
  'cep_residencial',
  'bairro_residencial',
  'email_pessoal',
]);

/**
 * Substitui qualquer IPv4 (com porta opcional) ou o IP de origem configurado
 * pelo domínio público oficial configurado.
 */
export function sanitizeIpInString(rawStr: string): string {
  if (!rawStr || typeof rawStr !== 'string') return '';

  const config = getConfig();
  let sanitized = rawStr;

  // 1. IP de origem configurado explicitamente
  if (config.saplOriginIp) {
    const escapedIp = config.saplOriginIp.replace(/\./g, '\\.');
    const regexApi = new RegExp(`https?:\\/\\/${escapedIp}(?::\\d+)?\\/api(\\/|\\b|$)`, 'gi');
    const regexDomain = new RegExp(`https?:\\/\\/${escapedIp}(?::\\d+)?(\\/|\\b|$)`, 'gi');
    sanitized = sanitized.replace(regexApi, `${config.saplApiBase}$1`);
    sanitized = sanitized.replace(regexDomain, `${config.saplPublicDomain}$1`);
  }

  // 2. Qualquer outro IPv4 (incluindo 64.23.167.191 ou local)
  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\/api(\/|\b|$)/gi,
    `${config.saplApiBase}$1`
  );
  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(\/|\b|$)/gi,
    `${config.saplPublicDomain}$1`
  );

  return sanitized;
}

/**
 * Reescreve links do upstream para apontar para o domínio do aplicativo (API nativa e mídia nativa).
 * Exemplo:
 * - https://sapl.pedroafonso.to.leg.br/api/materia/materialegislativa/ -> {APP_BASE}/api/materia/materialegislativa/
 * - https://sapl.pedroafonso.to.leg.br/media/sapl/public/... -> {APP_BASE}/api/media/sapl/public/...
 */
export function rewriteUrlToAppDomain(rawUrl: string, appOrigin: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;

  const config = getConfig();
  const cleaned = sanitizeIpInString(rawUrl);

  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const u = new URL(cleaned);

      // Links do YouTube / Vimeo não são reescritos
      if (
        u.hostname.includes('youtube.com') ||
        u.hostname.includes('youtu.be') ||
        u.hostname.includes('vimeo.com')
      ) {
        return cleaned;
      }

      // Se é um link de mídia do SAPL
      if (u.pathname.startsWith('/media/')) {
        const mediaPath = u.pathname.replace(/^\/media\//, '');
        return `${appOrigin}/api/media/${mediaPath}${u.search}`;
      }

      // Se é um link de API do SAPL
      if (u.pathname.startsWith('/api/')) {
        const apiPath = u.pathname.replace(/^\/api\//, '');
        return `${appOrigin}/api/${apiPath}${u.search}`;
      }

      // Se aponta para o próprio domínio do SAPL configurado
      const saplHost = new URL(config.saplPublicDomain).host;
      if (u.host === saplHost) {
        if (u.pathname.startsWith('/api/')) {
          const p = u.pathname.replace(/^\/api\//, '');
          return `${appOrigin}/api/${p}${u.search}`;
        }
        if (u.pathname.startsWith('/media/')) {
          const p = u.pathname.replace(/^\/media\//, '');
          return `${appOrigin}/api/media/${p}${u.search}`;
        }
      }
    } else if (cleaned.startsWith('/media/')) {
      const p = cleaned.replace(/^\/media\//, '');
      return `${appOrigin}/api/media/${p}`;
    } else if (cleaned.startsWith('/api/')) {
      const p = cleaned.replace(/^\/api\//, '');
      return `${appOrigin}/api/${p}`;
    }
  } catch {
    // Se não for URL parseável, retorna limpa
  }

  return cleaned;
}

/**
 * Sanitiza recursivamente objetos de resposta da API do SAPL:
 * 1. Remove/mascara dados sensíveis LGPD
 * 2. Substitui IPs brutos pelo domínio público
 * 3. Reescreve URLs de API e Mídia para apontar para o domínio do aplicativo
 */
export function sanitizeAndRewriteResponse<T>(data: T, appOrigin: string): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    return rewriteUrlToAppDomain(data, appOrigin) as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAndRewriteResponse(item, appOrigin)) as unknown as T;
  }

  if (typeof data === 'object') {
    const res: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      // Proteção LGPD
      if (LGPD_SENSITIVE_KEYS.has(lowerKey)) {
        res[key] = null; // mascara na saída
        continue;
      }
      res[key] = sanitizeAndRewriteResponse(val, appOrigin);
    }
    return res as T;
  }

  return data;
}

/**
 * Mascara campos LGPD em um objeto antes de salvar ou exibir.
 */
export function maskLgpdFields<T>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((it) => maskLgpdFields(it)) as unknown as T;
  }
  const res: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (LGPD_SENSITIVE_KEYS.has(key.toLowerCase())) {
      res[key] = null;
    } else {
      res[key] = maskLgpdFields(val);
    }
  }
  return res as T;
}
