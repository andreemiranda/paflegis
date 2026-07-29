/**
 * Shared utilities for all Paflegis backends.
 * Compatible with Node.js and Cloudflare V8 isolate. Uses only Web APIs.
 * DO NOT import Node.js-only APIs here (fs, path, process.exit, etc.).
 */

export const SAPL_API_BASE      = 'https://sapl.pedroafonso.to.leg.br/api';
export const SAPL_PUBLIC_DOMAIN = 'https://sapl.pedroafonso.to.leg.br';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

/** Structured JSON logger — works on every deploy platform. */
export function slog(level: LogLevel, ctx: string, msg: string, err?: unknown): void {
  const entry: Record<string, unknown> = { ts: new Date().toISOString(), level, ctx, msg };
  if (err !== undefined) entry.err = err instanceof Error ? err.message : String(err);
  const line = JSON.stringify(entry);
  if      (level === 'ERROR') console.error(line);
  else if (level === 'WARN')  console.warn(line);
  else                        console.log(line);
}

/** Warn on missing required env vars. Call at server startup. */
export function validateEnv(env: Record<string, string | undefined>, required: string[]): void {
  for (const key of required) {
    if (!env[key]) slog('WARN', 'startup', `Missing env var: ${key}. Dependent features unavailable.`);
  }
}

/**
 * Fetch com timeout explícito e retry leve de fail-fast.
 * - 4xx: retornado imediatamente (sem retry).
 * - 5xx / rede / timeout: retentado no máximo maxRetries vezes com backoff curto (500ms).
 */
export async function safeFetchWithRetry(
  url: string, timeoutMs = 4000, maxRetries = 1,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      await new Promise<void>(r => setTimeout(r, 500));
      slog('INFO', 'sapl-retry', `Tentativa ${attempt + 1}/${maxRetries + 1}: ${url}`);
    }
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 400 && res.status < 500) return res; // 4xx: sem retry
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
      slog('WARN', 'sapl-fetch', `Retornou HTTP ${res.status} na tentativa ${attempt + 1}: ${url}`);
    } catch (e) {
      lastErr = e;
      slog('WARN', 'sapl-fetch', `Falha na tentativa ${attempt + 1}: ${url}`, e);
    }
  }
  throw lastErr;
}

/** Real author IDs from SAPL — update when legislature changes. */
export const AUTOR_MAP: Record<number, string> = {
  1:  'Marquim Catabriga',   2:  'Gislayson Lacerda',      3:  'Jader Mariano',
  4:  'Joilson Boca Preta',  5:  'João do Povo',            6:  'Lili Benício',
  7:  'Mirleyson Soares',    8:  'Sipriano Soares',         9:  'Breno Alves',
  14: 'Agnaldo Lima',        15: 'José de Ribamar Coelho',  16: 'Fabrício Martins',
  17: 'Antonio Neto',        18: 'Mirneuton Soares',        19: 'Pedro Belarmino',
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

export function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const s = raw.trim();
  if (!s) return '';
  if (s.includes('youtube.com') || s.includes('youtu.be') || s.includes('vimeo.com')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.hostname.includes('sapl') || u.hostname.includes('pedroafonso') ||
          /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname === 'localhost')
        return `${SAPL_PUBLIC_DOMAIN}${u.pathname}${u.search}${u.hash}`;
      return s;
    } catch { return s; }
  }
  if (s.startsWith('/')) return `${SAPL_PUBLIC_DOMAIN}${s}`;
  return `${SAPL_PUBLIC_DOMAIN}/${s}`;
}

export function dateBR(d: string | null | undefined): string {
  if (!d) return '';
  const s = d.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const p = new Date(s);
  if (!isNaN(p.getTime()))
    return `${String(p.getUTCDate()).padStart(2,'0')}/${String(p.getUTCMonth()+1).padStart(2,'0')}/${p.getUTCFullYear()}`;
  return s;
}

export function brToTs(d: string | null | undefined): number {
  if (!d) return 0;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
  return new Date(d).getTime() || 0;
}

/** SAPL connectivity check — 5 s timeout, no retry. */
export async function checkSaplHealth(): Promise<{ reachable: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(
      `${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`,
      { signal: AbortSignal.timeout(5000) },
    );
    return { reachable: res.ok, latencyMs: Date.now() - start };
  } catch {
    return { reachable: false, latencyMs: Date.now() - start };
  }
}
