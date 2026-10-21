/**
 * lib/sapl/backend.ts — Utilitários de comunicação, resiliência e sanitização com a API pública do SAPL.
 * Compatível com Next.js Node.js runtime e Vercel Serverless.
 */

// 1. Configuração de URLs Base e Domínios com suporte pleno a variáveis de ambiente
const rawApiBase =
  process.env.SAPL_API_BASE ||
  process.env.NEXT_PUBLIC_SAPL_API_BASE ||
  'https://sapl.pedroafonso.to.leg.br/api';
export const SAPL_API_BASE = rawApiBase.trim().replace(/\/+$/, '');

const rawPublicDomain =
  process.env.SAPL_PUBLIC_DOMAIN ||
  process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN ||
  'https://sapl.pedroafonso.to.leg.br';
export const SAPL_PUBLIC_DOMAIN = rawPublicDomain.trim().replace(/\/+$/, '');

const rawOriginIp =
  process.env.SAPL_ORIGIN_IP ||
  process.env.NEXT_PUBLIC_SAPL_ORIGIN_IP ||
  'http://64.23.167.191';
export const SAPL_ORIGIN_IP = rawOriginIp.trim().replace(/\/+$/, '');

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/** Structured JSON logger para rastreabilidade no painel da Vercel. */
export function slog(level: LogLevel, ctx: string, msg: string, err?: unknown): void {
  const entry: Record<string, unknown> = { ts: new Date().toISOString(), level, ctx, msg };
  if (err !== undefined) entry.err = err instanceof Error ? err.message : String(err);
  const line = JSON.stringify(entry);
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

/**
 * Substitui qualquer ocorrência de IP bruto (ex: http://64.23.167.191 ou IPv4 local)
 * pelas variáveis de ambiente configuradas para domínio e base da API pública oficial.
 */
export function replaceIpWithDomain(rawStr: string): string {
  if (!rawStr || typeof rawStr !== 'string') return '';

  let sanitized = rawStr;

  // Substituir IP de origem específico com /api/
  sanitized = sanitized.replace(/https?:\/\/64\.23\.167\.191\/api(\/|\b|$)/gi, `${SAPL_API_BASE}$1`);
  // Substituir IP de origem específico em links de media, arquivos ou geral
  sanitized = sanitized.replace(/https?:\/\/64\.23\.167\.191(\/|\b|$)/gi, `${SAPL_PUBLIC_DOMAIN}$1`);

  // Substituir qualquer outro IPv4 em formato de URL retornado pelo servidor legado
  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\/api(\/|\b|$)/gi,
    `${SAPL_API_BASE}$1`
  );
  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(\/|\b|$)/gi,
    `${SAPL_PUBLIC_DOMAIN}$1`
  );

  return sanitized;
}

/**
 * Normaliza e sanitiza recursivamente qualquer estrutura de dados (string, array, objeto)
 * retornada pela API do SAPL, garantindo que nenhum IP bruto 64.23.167.191 persista.
 */
export function sanitizeSaplData<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === 'string') {
    return replaceIpWithDomain(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSaplData(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      output[key] = sanitizeSaplData(val);
    }
    return output as T;
  }

  return input;
}

/**
 * Fetch com timeout explícito, substituição automática de IP e retry de fail-fast.
 * - Converte automaticamente links contendo 64.23.167.191 para o endpoint público configurado.
 * - 4xx: retornado imediatamente (sem retry desnecessário).
 * - 5xx / rede / timeout: retentado no máximo maxRetries vezes com backoff progressivo.
 */
export async function safeFetchWithRetry(
  rawUrl: string,
  timeoutMs = 15000,
  maxRetries = 2
): Promise<Response> {
  // Garante que se o backend tentar seguir uma URL com IP bruto, ela vá para o domínio público oficial
  const url = replaceIpWithDomain(rawUrl);

  let lastErr: unknown;
  const startTime = Date.now();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise<void>((r) => setTimeout(r, 400 * attempt));
      slog(
        'INFO',
        'sapl-retry',
        `Tentativa ${attempt + 1}/${maxRetries + 1} (${Date.now() - startTime}ms): ${url}`
      );
    }

    try {
      const headers = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      };

      const res = await fetch(url, {
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.status >= 400 && res.status < 500) return res; // 4xx: sem retry
      if (res.ok) return res;

      lastErr = new Error(`HTTP ${res.status}`);
      slog(
        'WARN',
        'sapl-fetch',
        `Retornou HTTP ${res.status} na tentativa ${attempt + 1} (${Date.now() - startTime}ms): ${url}`
      );
    } catch (e) {
      lastErr = e;
      slog(
        'WARN',
        'sapl-fetch',
        `Falha na tentativa ${attempt + 1} (${Date.now() - startTime}ms): ${url}`,
        e
      );
    }
  }

  throw lastErr;
}

/** Mapeamento de IDs dos autores/parlamentares do SAPL de Pedro Afonso - TO. */
export const AUTOR_MAP: Record<number, string> = {
  1: 'Marquim Catabriga',
  2: 'Gislayson Lacerda',
  3: 'Jader Mariano',
  4: 'Joilson Boca Preta',
  5: 'João do Povo',
  6: 'Lili Benício',
  7: 'Mirleyson Soares',
  8: 'Sipriano Soares',
  9: 'Breno Alves',
  14: 'Agnaldo Lima',
  15: 'José de Ribamar Coelho',
  16: 'Fabrício Martins',
  17: 'Antonio Neto',
  18: 'Mirneuton Soares',
  19: 'Pedro Belarmino',
  20: 'Rômulo Soares',
};

export function extractAutor(it: Record<string, unknown>): string {
  const autores = it.autores as number[] | undefined;
  const autorId = Array.isArray(autores) ? autores[0] : null;
  if (autorId && AUTOR_MAP[autorId]) return AUTOR_MAP[autorId];
  if (typeof it.__str__ === 'string') {
    const m = it.__str__.match(/Ver\.\s+(.+?)\s+n[º°]/i);
    if (m?.[1]) return m[1].trim();
  }
  return typeof it.autor === 'string' ? it.autor : 'Não informado';
}

/**
 * Normaliza qualquer URL de documento, anexo ou link retornado pelo SAPL.
 * Garante protocolo HTTPS e uso estrito de SAPL_PUBLIC_DOMAIN em vez de IP bruto.
 */
export function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const s = raw.trim();
  if (!s) return '';

  if (s.includes('youtube.com') || s.includes('youtu.be') || s.includes('vimeo.com')) {
    return s;
  }

  // Substitui IP bruto pelo domínio público configurado
  const cleaned = replaceIpWithDomain(s);

  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    try {
      const u = new URL(cleaned);
      if (
        u.hostname.includes('sapl') ||
        u.hostname.includes('pedroafonso') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) ||
        u.hostname === 'localhost'
      ) {
        return `${SAPL_PUBLIC_DOMAIN}${u.pathname}${u.search}${u.hash}`;
      }
      return cleaned;
    } catch {
      return cleaned;
    }
  }

  if (cleaned.startsWith('/')) return `${SAPL_PUBLIC_DOMAIN}${cleaned}`;
  return `${SAPL_PUBLIC_DOMAIN}/${cleaned}`;
}

export function dateBR(d: string | null | undefined): string {
  if (!d) return '';
  const s = d.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const p = new Date(s);
  if (!isNaN(p.getTime()))
    return `${String(p.getUTCDate()).padStart(2, '0')}/${String(p.getUTCMonth() + 1).padStart(2, '0')}/${p.getUTCFullYear()}`;
  return s;
}

export function brToTs(d: string | null | undefined): number {
  if (!d) return 0;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
  return new Date(d).getTime() || 0;
}

/** Verificação de saúde da conexão com o SAPL. */
export async function checkSaplHealth(): Promise<{ reachable: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    };
    const res = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`, {
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return { reachable: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { reachable: false, latencyMs: Date.now() - start };
  }
}
