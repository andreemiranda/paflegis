/// <reference types="vite/client" />

/**
 * src/lib/api/client.ts — Cliente HTTP centralizado para requisições do Paflegis.
 * Inclui automaticamente o cabeçalho x-api-key em todas as chamadas.
 */

const DEFAULT_PAFLEGIS_API_KEY = 'paflegis_app_official_key_2026_98374';

/**
 * Retorna a chave de API do Paflegis configurada no ambiente (VITE_API_KEY)
 * ou a chave oficial padrão do front-end.
 */
export function getApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return DEFAULT_PAFLEGIS_API_KEY;
}

/**
 * Wrapper sobre fetch global que injeta automaticamente o cabeçalho x-api-key.
 */
export async function paflegisFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const apiKey = getApiKey();
  const headers = new Headers(init?.headers || {});

  if (!headers.has('x-api-key')) {
    headers.set('x-api-key', apiKey);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
