export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }
  const pathMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|shorts\/))([a-zA-Z0-9_-]{11})/i
  );
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  const malformedMatch = trimmed.match(
    /(?:youtube[^\/]*\/[^\/]*\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/i
  );
  if (malformedMatch && malformedMatch[1]) {
    return malformedMatch[1];
  }
  const lastSegment = trimmed.split('/').pop()?.split('?')[0]?.split('&')[0];
  if (lastSegment && /^[a-zA-Z0-9_-]{11}$/.test(lastSegment)) {
    return lastSegment;
  }
  return null;
}

export function getYouTubeWatchUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.hostname.includes('.')) {
        return trimmed;
      }
    } catch {
      return null;
    }
  }
  return null;
}

const rawBaseDomain =
  process.env.NEXT_PUBLIC_SAPL_BASE_DOMAIN ||
  process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN ||
  process.env.SAPL_PUBLIC_DOMAIN ||
  'https://sapl.pedroafonso.to.leg.br';
export const SAPL_BASE_DOMAIN = rawBaseDomain.trim().replace(/\/+$/, '');

const rawApiBase =
  process.env.NEXT_PUBLIC_SAPL_API_BASE ||
  process.env.SAPL_API_BASE ||
  'https://sapl.pedroafonso.to.leg.br/api';
export const SAPL_API_BASE = rawApiBase.trim().replace(/\/+$/, '');

/**
 * Converte IP bruto retornado pelo servidor legado SAPL para o domínio público oficial.
 */
export function replaceIpWithDomain(rawStr: string): string {
  if (!rawStr || typeof rawStr !== 'string') return '';
  let sanitized = rawStr
    .replace(/https?:\/\/64\.23\.167\.191\/api(\/|\b|$)/gi, `${SAPL_API_BASE}$1`)
    .replace(/https?:\/\/64\.23\.167\.191(\/|\b|$)/gi, `${SAPL_BASE_DOMAIN}$1`);

  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\/api(\/|\b|$)/gi,
    `${SAPL_API_BASE}$1`
  );
  sanitized = sanitized.replace(
    /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(\/|\b|$)/gi,
    `${SAPL_BASE_DOMAIN}$1`
  );
  return sanitized;
}

export function normalizeDocumentUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com')
  ) {
    return trimmed;
  }

  const cleaned = replaceIpWithDomain(trimmed);

  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const parsed = new URL(cleaned);
      if (
        parsed.hostname.includes('sapl') ||
        parsed.hostname.includes('pedroafonso') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) ||
        parsed.hostname === 'localhost'
      ) {
        return `${SAPL_BASE_DOMAIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return cleaned;
    }
  } catch {}

  if (cleaned.startsWith('/')) {
    return `${SAPL_BASE_DOMAIN}${cleaned}`;
  }
  return `${SAPL_BASE_DOMAIN}/${cleaned}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.setAttribute('readonly', '');
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (err) {
    console.error('Erro ao copiar link:', err);
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textArea);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function shareUrl(title: string, text: string, url: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
      }
      return false;
    }
  }
  return false;
}
