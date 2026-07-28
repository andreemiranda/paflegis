import {
  MateriaLegislativa,
  NormaJuridica,
  SessaoPlenaria,
  TipoFiltro,
  EstatisticasLegislativas,
  QueryFilters,
} from '../../types';
import { normalizeDocumentUrl } from '../urlUtils';
import { formatDateBR } from '../dateUtils';

// ── Cache em memória (5 min TTL) ────────────────────────────────────────────
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) { cache.delete(key); return null; }
  return item.data as T;
}

function setToCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ── Resultado vazio tipado ───────────────────────────────────────────────────
function emptyPage<T>(page: number, limit: number) {
  return { items: [] as T[], total: 0, page, limit, totalPages: 0 };
}

// A API SAPL retorna 'descricao' (e '__str__') em vez de 'nome'.
// Normaliza aqui para que todo o frontend use sempre TipoFiltro.nome.
function normalizeTipo(raw: Record<string, unknown>): TipoFiltro {
  return {
    id:    raw.id    as number,
    sigla: (raw.sigla    as string) || '',
    nome:  (raw.descricao as string) || (raw.__str__ as string) || (raw.nome as string) || '',
  };
}

// ── Tipos de matéria ─────────────────────────────────────────────────────────
export async function getTiposMaterias(): Promise<TipoFiltro[]> {
  try {
    const cached = getFromCache<TipoFiltro[]>('tipos_materias');
    if (cached) return cached;
    const res = await fetch('/api/v1/tipos/materias');
    if (res.ok) {
      const raw = await res.json();
      const data: TipoFiltro[] = (Array.isArray(raw) ? raw : [])
        .map(normalizeTipo)
        .filter(t => t.nome);
      setToCache('tipos_materias', data);
      return data;
    }
  } catch (e) {
    console.warn('[sapl] tipos/materias indisponível:', e);
  }
  return [];
}

// ── Tipos de norma ───────────────────────────────────────────────────────────
export async function getTiposNormas(): Promise<TipoFiltro[]> {
  try {
    const cached = getFromCache<TipoFiltro[]>('tipos_normas');
    if (cached) return cached;
    const res = await fetch('/api/v1/tipos/normas');
    if (res.ok) {
      const raw = await res.json();
      const data: TipoFiltro[] = (Array.isArray(raw) ? raw : [])
        .map(normalizeTipo)
        .filter(t => t.nome);
      setToCache('tipos_normas', data);
      return data;
    }
  } catch (e) {
    console.warn('[sapl] tipos/normas indisponível:', e);
  }
  return [];
}

// ── Matérias legislativas ────────────────────────────────────────────────────
export async function getMaterias(
  filters?: QueryFilters
): Promise<{ items: MateriaLegislativa[]; total: number; page: number; limit: number; totalPages: number }> {
  const page  = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  const params = new URLSearchParams();
  if (filters?.busca)    params.set('busca',    filters.busca);
  if (filters?.tipo)     params.set('tipo',     filters.tipo);
  if (filters?.ano)      params.set('ano',      filters.ano);
  if (filters?.situacao) params.set('situacao', filters.situacao);
  params.set('pagina', page.toString());
  params.set('limite', limit.toString());

  const res = await fetch(`/api/v1/materias?${params.toString()}`);
  if (!res.ok) throw new Error(`SAPL indisponível para matérias (HTTP ${res.status})`);
  const data = await res.json();
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items.map((item: MateriaLegislativa) => ({
        ...item,
        texto_original_url:   normalizeDocumentUrl(item.texto_original_url),
        documentos_acessorios:(item.documentos_acessorios || []).map(doc => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      })),
      total:      data.total      ?? data.items.length,
      page:       data.page       ?? page,
      limit:      data.limit      ?? limit,
      totalPages: data.totalPages ?? Math.ceil((data.total ?? data.items.length) / limit),
    };
  }
  throw new Error('Formato de resposta inesperado para matérias');
}

export async function getMateriaById(id: number | string): Promise<MateriaLegislativa | null> {
  try {
    const res = await fetch(`/api/v1/materias/${id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        texto_original_url:    normalizeDocumentUrl(data.texto_original_url),
        documentos_acessorios: (data.documentos_acessorios || []).map((doc: { url: string }) => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      };
    }
  } catch (e) {
    console.warn('[sapl] matéria por ID indisponível:', e);
  }
  return null;
}

// ── Normas jurídicas ─────────────────────────────────────────────────────────
export async function getNormas(
  filters?: QueryFilters
): Promise<{ items: NormaJuridica[]; total: number; page: number; limit: number; totalPages: number }> {
  const page  = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  const params = new URLSearchParams();
  if (filters?.busca) params.set('busca', filters.busca);
  if (filters?.tipo)  params.set('tipo',  filters.tipo);
  if (filters?.ano)   params.set('ano',   filters.ano);
  params.set('pagina', page.toString());
  params.set('limite', limit.toString());

  const res = await fetch(`/api/v1/normas?${params.toString()}`);
  if (!res.ok) throw new Error(`SAPL indisponível para normas (HTTP ${res.status})`);
  const data = await res.json();
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items.map((item: NormaJuridica) => ({
        ...item,
        texto_integral_url: normalizeDocumentUrl(item.texto_integral_url),
        anexos: (item.anexos || []).map(doc => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      })),
      total:      data.total      ?? data.items.length,
      page:       data.page       ?? page,
      limit:      data.limit      ?? limit,
      totalPages: data.totalPages ?? Math.ceil((data.total ?? data.items.length) / limit),
    };
  }
  throw new Error('Formato de resposta inesperado para normas');
}

export async function getNormaById(id: number | string): Promise<NormaJuridica | null> {
  try {
    const res = await fetch(`/api/v1/normas/${id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        texto_integral_url: normalizeDocumentUrl(data.texto_integral_url),
        anexos: (data.anexos || []).map((doc: { url: string }) => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      };
    }
  } catch (e) {
    console.warn('[sapl] norma por ID indisponível:', e);
  }
  return null;
}

// ── Sessões plenárias ────────────────────────────────────────────────────────
export async function getSessoes(
  filters?: QueryFilters
): Promise<{ items: SessaoPlenaria[]; total: number; page: number; limit: number; totalPages: number }> {
  const page  = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  const params = new URLSearchParams();
  if (filters?.busca) params.set('busca', filters.busca);
  if (filters?.ano)   params.set('ano',   filters.ano);
  params.set('pagina', page.toString());
  params.set('limite', limit.toString());

  const res = await fetch(`/api/v1/sessoes?${params.toString()}`);
  if (!res.ok) throw new Error(`SAPL indisponível para sessões (HTTP ${res.status})`);
  const data = await res.json();
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items.map((item: SessaoPlenaria) => ({
        ...item,
        pauta_url: normalizeDocumentUrl(item.pauta_url),
        ata_url:   normalizeDocumentUrl(item.ata_url),
        anexos:    (item.anexos || []).map(doc => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      })),
      total:      data.total      ?? data.items.length,
      page:       data.page       ?? page,
      limit:      data.limit      ?? limit,
      totalPages: data.totalPages ?? Math.ceil((data.total ?? data.items.length) / limit),
    };
  }
  throw new Error('Formato de resposta inesperado para sessões');
}

export async function getSessaoById(id: number | string): Promise<SessaoPlenaria | null> {
  try {
    const res = await fetch(`/api/v1/sessoes/${id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        pauta_url: normalizeDocumentUrl(data.pauta_url),
        ata_url:   normalizeDocumentUrl(data.ata_url),
        anexos:    (data.anexos || []).map((doc: { url: string }) => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      };
    }
  } catch (e) {
    console.warn('[sapl] sessão por ID indisponível:', e);
  }
  return null;
}

// ── Estatísticas ─────────────────────────────────────────────────────────────
export async function getEstatisticas(): Promise<EstatisticasLegislativas> {
  const res = await fetch('/api/v1/estatisticas');
  if (!res.ok) throw new Error(`SAPL indisponível para estatísticas (HTTP ${res.status})`);
  return await res.json();
}

// Exporta formatDateBR para reuso em views que precisem formatar datas vindas da API
export { formatDateBR };
