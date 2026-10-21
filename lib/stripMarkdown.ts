/**
 * lib/stripMarkdown.ts — Remove formatações markdown garantindo texto plano puro.
 */

export function stripMarkdown(md: string): string {
  if (!md) return '';
  return md
    // Headers (# H1, ## H2, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Bold / Italic (**text**, *text*, __text__, _text_)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Inline code (`code`)
    .replace(/`([^`]+)`/g, '$1')
    // Code blocks (```lang ... ```)
    .replace(/```[\s\S]*?```/g, '')
    // Links ([text](url))
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Images (![alt](url))
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Blockquotes (> quote)
    .replace(/^\s*>\s+/gm, '')
    // Unordered lists (- item, * item, + item)
    .replace(/^\s*[-*+]\s+/gm, '')
    // Ordered lists (1. item)
    .replace(/^\s*\d+\.\s+/gm, '')
    // Horizontal rules (---, ***, ___)
    .replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '')
    // Clean multiple line breaks
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
