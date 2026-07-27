/**
 * Converte um nome de tipo de documento em slug URL-safe determinístico.
 * Ex: "Projeto de Lei Complementar" → "projeto-de-lei-complementar"
 */
export function toSlug(nome: string | undefined | null): string {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]+/g, '-')    // substitui não-alfanuméricos por hífen
    .replace(/^-+|-+$/g, '');        // remove hífens nas bordas
}
