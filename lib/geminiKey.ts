/**
 * lib/geminiKey.ts — Gerenciador da Chave de API do Gemini para o Paflegis.
 * Obtém a chave de API estritamente a partir de variáveis de ambiente configuradas
 * na plataforma de hospedagem (Vercel, Cloud Run, etc.).
 */

/**
 * Retorna a chave de API do Gemini para o assistente do Paflegis.
 * Lê a variável de ambiente GEMINI_API_KEY.
 */
export function getGeminiApiKey(): string {
  const envKey = process.env.GEMINI_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim()) {
    return envKey.trim();
  }
  return '';
}

