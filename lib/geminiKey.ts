/**
 * lib/geminiKey.ts — Gerenciador da Chave de API do Gemini para o Paflegis.
 * Garante o uso da chave oficial do projeto Paflegis APP (gen-lang-client-0231282926).
 */

export const PAFLEGIS_GEMINI_API_KEY = 'AQ.Ab8RN6LMq0wCUhCuQesWGKmWzsVXzpi1eRxJZoB5WNJR1RquEg';

// Chave antiga vinculada ao projeto Lexata
const OLD_LEXATA_KEY = 'AQ.Ab8RN6ISOcsFHsQGUpSWhKflW3nluMLc3FhZOfEs_-5k9PNI_Q';

/**
 * Retorna a chave de API do Gemini para o assistente do Paflegis.
 * Se process.env.GEMINI_API_KEY estiver vazia ou contiver a chave legada do projeto Lexata,
 * força o uso da chave oficial do projeto Paflegis APP.
 */
export function getGeminiApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey.trim() !== OLD_LEXATA_KEY) {
    return envKey.trim();
  }
  return PAFLEGIS_GEMINI_API_KEY;
}
