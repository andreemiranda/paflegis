/**
 * Extrai o ID do vídeo do YouTube a partir de qualquer formato de URL ou string
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Se for exatamente uma string de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Procura parâmetro v= na query string (ex: ?v=ID ou &v=ID)
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // Regex para paths padrão do YouTube (youtu.be/ID, embed/ID, v/ID, live/ID, shorts/ID)
  const pathMatch = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|shorts\/))([a-zA-Z0-9_-]{11})/i);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Trata URLs malformadas como "youtube/embed/ID" ou "https://youtube/embed/ID" sem TLD completo
  const malformedMatch = trimmed.match(/(?:youtube[^\/]*\/[^\/]*\/|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/i);
  if (malformedMatch && malformedMatch[1]) {
    return malformedMatch[1];
  }

  // Caso genérico: último segmento de 11 caracteres
  const lastSegment = trimmed.split('/').pop()?.split('?')[0]?.split('&')[0];
  if (lastSegment && /^[a-zA-Z0-9_-]{11}$/.test(lastSegment)) {
    return lastSegment;
  }

  return null;
}

/**
 * Reconstrói a URL para abertura em nova guia no formato oficial https://www.youtube.com/watch?v={id}
 * Ou retorna a URL absoluta válida original se não for do YouTube.
 * Se a URL for inválida ou não puder ser aberta com segurança em nova guia, retorna null.
 */
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

/**
 * Normaliza qualquer URL de documento vinda da API do SAPL para o domínio oficial seguro:
 * https://sapl.pedroafonso.to.leg.br/
 * Substitui endereços IP brutos ou protocolos HTTP por HTTPS no domínio oficial.
 */
export const SAPL_BASE_DOMAIN = 'https://sapl.pedroafonso.to.leg.br';

/**
 * Normaliza qualquer URL de documento vinda da API do SAPL para o domínio oficial seguro:
 * https://sapl.pedroafonso.to.leg.br/
 * Preserva links externos legítimos (YouTube, Google Drive, etc.).
 */
export function normalizeDocumentUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Preserva URLs do YouTube, Vimeo ou serviços externos conhecidos
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com')
  ) {
    return trimmed;
  }

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const parsed = new URL(trimmed);
      // Se for do domínio do SAPL, IP direto ou local, padroniza com o domínio oficial HTTPS
      if (
        parsed.hostname.includes('sapl') ||
        parsed.hostname.includes('pedroafonso') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) ||
        parsed.hostname === 'localhost'
      ) {
        return `${SAPL_BASE_DOMAIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      // Preserva outros links HTTPS externos legítimos
      return trimmed;
    }
  } catch {
    // Se falhar o parse de URL, segue para o tratamento de caminhos
  }

  // Se for um caminho relativo
  if (trimmed.startsWith('/')) {
    return `${SAPL_BASE_DOMAIN}${trimmed}`;
  }

  return `${SAPL_BASE_DOMAIN}/${trimmed}`;
}

/**
 * Copia texto ou link para a área de transferência com fallback robusto para iFrame/modal.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para contextos restritos / iFrames
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

/**
 * Tenta compartilhar a URL usando a Web Share API ou executa callback de fallback
 */
export async function shareUrl(title: string, text: string, url: string): Promise<boolean> {
  if (navigator.share) {
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
