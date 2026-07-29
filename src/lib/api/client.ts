/// <reference types="vite/client" />

/**
 * src/lib/api/client.ts — Cliente HTTP centralizado para requisições do Paflegis.
 * Inclui automaticamente o cabeçalho x-api-key se configurado em VITE_API_KEY.
 */

/**
 * Retorna a chave de API do Paflegis configurada no ambiente (VITE_API_KEY).
 */
export function getApiKey(): string {
  const envKey = (import.meta as any).env?.VITE_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

/**
 * Wrapper sobre fetch global que injeta automaticamente o cabeçalho x-api-key se disponível.
 */
export async function paflegisFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const apiKey = getApiKey();
  const headers = new Headers(init?.headers || {});

  if (apiKey && !headers.has('x-api-key')) {
    headers.set('x-api-key', apiKey);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
