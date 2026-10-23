/**
 * lib/config/index.ts — Módulo centralizado de configuração do Paflegis.
 * Lê, valida e expõe um objeto único com valores tipados e fallbacks sensatos.
 * Permite que a aplicação aponte para qualquer instância de SAPL via variáveis de ambiente.
 */

import { sha256Hex } from '@/lib/crypto/pure';

export interface AppConfig {
  // SAPL Upstream
  saplApiBase: string;
  saplPublicDomain: string;
  saplOriginIp: string;
  saplApiBaseHash: string;

  // Informações da Casa Legislativa e Site
  siteName: string;
  siteDescription: string;
  orgName: string;
  orgAcronym: string;
  orgCity: string;
  orgUf: string;

  // Domínio e URLs públicas
  appPublicUrl: string;
  allowedHosts: string[];
  corsAllowedOrigins: string[];

  // Segurança e Autenticação
  apiKeysPermitidas: string[];
  apiAccessMode: 'open' | 'keyed';
  sessionSecret: string;
  cronSecret: string;
  trustProxy: boolean;

  // Armazenamento
  storageDriver: 'sqlite' | 'file' | 'memory';
  storagePath: string;

  // Mídia e Documentos
  mirrorMedia: boolean;
  maxMediaBytes: number;

  // E-mail (Contato)
  emailUser?: string;
  emailAppPassword?: string;
  emailDestino?: string;
}

// Log de inicialização emitido apenas uma vez
let hasLoggedInit = false;

function resolveSaplPublicDomain(apiBase: string, explicitDomain?: string): string {
  if (explicitDomain && explicitDomain.trim()) {
    return explicitDomain.trim().replace(/\/+$/, '');
  }
  try {
    const u = new URL(apiBase);
    // Se a apiBase termina em /api, remove para obter o domínio público base
    const domain = `${u.protocol}//${u.host}`;
    return domain;
  } catch {
    return 'https://sapl.pedroafonso.to.leg.br';
  }
}

function resolveAppPublicUrl(): string {
  if (process.env.APP_PUBLIC_URL && process.env.APP_PUBLIC_URL.trim()) {
    return process.env.APP_PUBLIC_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }
  return '';
}

function loadConfig(): AppConfig {
  // 1. SAPL API Base - Ordem de precedência
  const rawApiBase =
    process.env.SAPL_API_BASE ||
    process.env.NEXT_PUBLIC_SAPL_API_BASE ||
    'https://sapl.pedroafonso.to.leg.br/api';
  const saplApiBase = rawApiBase.trim().replace(/\/+$/, '');

  // 2. Domínio público do SAPL
  const rawPublicDomain =
    process.env.SAPL_PUBLIC_DOMAIN ||
    process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN ||
    process.env.NEXT_PUBLIC_SAPL_BASE_DOMAIN;
  const saplPublicDomain = resolveSaplPublicDomain(saplApiBase, rawPublicDomain);

  // 3. IP de origem do SAPL (opcional)
  const saplOriginIp = (
    process.env.SAPL_ORIGIN_IP ||
    process.env.NEXT_PUBLIC_SAPL_ORIGIN_IP ||
    '64.23.167.191'
  ).trim();

  // Hash da API base para detecção de troca de SAPL
  const saplApiBaseHash = sha256Hex(saplApiBase).slice(0, 16);

  // 4. Chaves de API
  // Oficial: API_KEYS_PERMITIDAS. Alias legado: API_KEYS.
  let rawKeys = process.env.API_KEYS_PERMITIDAS;
  if (!rawKeys && process.env.API_KEYS) {
    rawKeys = process.env.API_KEYS;
    if (!hasLoggedInit) {
      console.warn(
        '[paflegis:config] AVISO: A variável API_KEYS é um alias legado. Por favor, utilize API_KEYS_PERMITIDAS no seu .env.'
      );
    }
  }

  const apiKeysPermitidas: string[] = [];
  if (rawKeys) {
    rawKeys.split(',').forEach((k) => {
      const trimmed = k.trim();
      if (trimmed) apiKeysPermitidas.push(trimmed);
    });
  }

  // Modo de acesso: 'open' ou 'keyed'
  const rawAccessMode = process.env.API_ACCESS_MODE?.toLowerCase();
  const apiAccessMode: 'open' | 'keyed' =
    rawAccessMode === 'keyed'
      ? 'keyed'
      : rawAccessMode === 'open'
      ? 'open'
      : apiKeysPermitidas.length > 0
      ? 'keyed'
      : 'open';

  // 5. Segredos
  const sessionSecret =
    process.env.SESSION_SECRET ||
    sha256Hex(`paflegis_session_${saplApiBase}`);
  const cronSecret = process.env.CRON_SECRET || 'paflegis_cron_secret_default';

  // 6. Armazenamento
  const rawDriver = process.env.STORAGE_DRIVER?.toLowerCase();
  const storageDriver: 'sqlite' | 'file' | 'memory' =
    rawDriver === 'file' || rawDriver === 'memory' ? rawDriver : 'sqlite';
  const storagePath = process.env.STORAGE_PATH || '.data';

  // 7. CORS e Hosts
  const allowedHosts = (process.env.ALLOWED_HOSTS || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const corsAllowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  // 8. Informações da Casa (com fallbacks se não descobertas ainda)
  const siteName = process.env.SITE_NAME || 'Paflegis';
  const siteDescription =
    process.env.SITE_DESCRIPTION ||
    'Portal cívico independente de consulta e transparência legislativa municipal.';
  const orgName = process.env.ORG_NAME || 'Câmara Municipal de Pedro Afonso';
  const orgAcronym = process.env.ORG_ACRONYM || 'CMPA';
  const orgCity = process.env.ORG_CITY || 'Pedro Afonso';
  const orgUf = process.env.ORG_UF || 'TO';

  // 9. Mídia
  const mirrorMedia = process.env.MIRROR_MEDIA === 'true' || process.env.MIRROR_MEDIA === '1';
  const maxMediaBytes = parseInt(process.env.MAX_MEDIA_BYTES || '52428800', 10); // 50MB

  const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1';

  return {
    saplApiBase,
    saplPublicDomain,
    saplOriginIp,
    saplApiBaseHash,
    siteName,
    siteDescription,
    orgName,
    orgAcronym,
    orgCity,
    orgUf,
    appPublicUrl: resolveAppPublicUrl(),
    allowedHosts,
    corsAllowedOrigins,
    apiKeysPermitidas,
    apiAccessMode,
    sessionSecret,
    cronSecret,
    trustProxy,
    storageDriver,
    storagePath,
    mirrorMedia,
    maxMediaBytes,
    emailUser: process.env.EMAIL_USER,
    emailAppPassword: process.env.EMAIL_APP_PASSWORD,
    emailDestino: process.env.EMAIL_DESTINO,
  };
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
    hasLoggedInit = true;
  }
  return cachedConfig;
}

/**
 * Atualiza dinamicamente as informações descobertas da casa legislativa.
 */
export function updateDiscoveredConfig(partial: {
  orgName?: string;
  orgAcronym?: string;
  orgCity?: string;
  orgUf?: string;
  siteName?: string;
  siteDescription?: string;
}) {
  const current = getConfig();
  if (partial.orgName && !process.env.ORG_NAME) current.orgName = partial.orgName;
  if (partial.orgAcronym && !process.env.ORG_ACRONYM) current.orgAcronym = partial.orgAcronym;
  if (partial.orgCity && !process.env.ORG_CITY) current.orgCity = partial.orgCity;
  if (partial.orgUf && !process.env.ORG_UF) current.orgUf = partial.orgUf;
  if (partial.siteName && !process.env.SITE_NAME) current.siteName = partial.siteName;
  if (partial.siteDescription && !process.env.SITE_DESCRIPTION) current.siteDescription = partial.siteDescription;
}

/**
 * Resolve o domínio público em tempo de execução para requisições recebidas.
 */
export function resolveRequestOrigin(reqHeaders?: Headers | Record<string, string | string[] | undefined>): string {
  const config = getConfig();
  if (config.appPublicUrl) {
    return config.appPublicUrl;
  }

  if (!reqHeaders) {
    return 'http://localhost:3000';
  }

  const getHeader = (name: string): string | undefined => {
    if (typeof (reqHeaders as Headers).get === 'function') {
      return (reqHeaders as Headers).get(name) || undefined;
    }
    const val = (reqHeaders as Record<string, any>)[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  const proto = getHeader('x-forwarded-proto') || 'http';
  const host = getHeader('x-forwarded-host') || getHeader('host');

  if (host) {
    return `${proto}://${host}`;
  }

  return 'http://localhost:3000';
}
