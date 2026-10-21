/**
 * Formata qualquer valor de data (string no padrão YYYY-MM-DD, ISO string, etc.)
 * exclusivamente no padrão brasileiro: dd/mm/aaaa.
 */
export function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  const matchYMD = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchYMD) {
    const [, ano, mes, dia] = matchYMD;
    return `${dia}/${mes}/${ano}`;
  }

  const matchMDY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchMDY) {
    const [, m, d, a] = matchMDY;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${a}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}
