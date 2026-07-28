/**
 * lib/stripMarkdown.ts — Sanitizador de Markdown para o Assistente Paflegis.
 * Garante que nenhum símbolo visual de markdown (*, **, #, ---, etc.) seja
 * exibido como texto literal nas bolhas de conversa do chat.
 */

export function stripMarkdown(text: string): string {
  if (!text) return '';
  let clean = text;

  // 1. Remove linhas divisórias isoladas (ex: ---, ***, ___)
  clean = clean.replace(/^[ \t]*[-*_]{3,}[ \t]*$/gm, '');

  // 2. Remove cabeçalhos markdown (# Título, ## Título, ### Título)
  clean = clean.replace(/^[ \t]*#{1,6}[ \t]+(.*)$/gm, '$1');

  // 3. Remove negrito e itálico (**texto**, __texto__, *texto*, _texto_)
  clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
  clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');

  // 4. Converte marcadores de lista com asterisco ou hífen para marcadores limpos ou número
  clean = clean.replace(/^[ \t]*[*+-][ \t]+/gm, '• ');

  // 5. Remove marcadores de código (`código`, ```código```)
  clean = clean.replace(/```[\s\S]*?```/g, m => m.replace(/```/g, ''));
  clean = clean.replace(/`([^`]+)`/g, '$1');

  // 6. Remove asteriscos soltos que possam ter sobrado
  clean = clean.replace(/\*\*/g, '').replace(/\*/g, '');

  // 7. Normaliza quebras de linha excessivas (máximo 2 seguidas)
  clean = clean.replace(/\n{3,}/g, '\n\n');

  return clean.trim();
}
