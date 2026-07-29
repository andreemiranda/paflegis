/**
 * lib/cors.ts — Lógica centralizada de CORS para o Paflegis.
 * Garante paridade total de segurança entre o ambiente Express local (server.ts)
 * e as funções Serverless Vercel (api/index.ts).
 */

export function getAllowedOrigins(): string[] {
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) return [];
  return envOrigins
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
}

export function determineCorsOrigin(reqOrigin?: string | null): string {
  const allowed = getAllowedOrigins();

  if (allowed.length === 0) {
    return reqOrigin || '*';
  }

  if (reqOrigin && allowed.includes(reqOrigin)) {
    return reqOrigin;
  }

  return allowed[0];
}

export function applyCorsHeaders(req: any, res: any): void {
  const reqOrigin = req.headers?.origin || req.headers?.Origin;
  const originToSet = determineCorsOrigin(reqOrigin);

  res.setHeader('Access-Control-Allow-Origin', originToSet);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-API-KEY');

  if (originToSet !== '*') {
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}
