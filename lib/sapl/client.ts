/**
 * lib/sapl/client.ts — Cliente HTTP resiliente para o Frontend do Paflegis.
 * Integração híbrida e automática: consome as rotas estruturadas /api/v1/*
 * com fallback inteligente para os endpoints nativos espelhados /api/* do SAPL.
 */

import {
  MateriaLegislativa,
  NormaJuridica,
  SessaoPlenaria,
  TipoFiltro,
  EstatisticasLegislativas,
  QueryFilters,
} from '@/types';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  fonte?: string;
  sapl_indisponivel?: boolean;
}

export interface SaplEndpointsResponse {
  total_endpoints: number;
  retornados: number;
  fonte: string;
  configuracao: {
    sapl_api_base: string;
    sapl_public_domain: string;
    sapl_origin_ip_sanitized: string;
    substituicao_ip_ativa: boolean;
  };
  modulos: { id: string; titulo: string; total: number }[];
  endpoints_map: Record<string, string>;
  endpoints: {
    key: string;
    url: string;
    path: string;
    module: string;
    module_title: string;
  }[];
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export const DEFAULT_CLIENT_API_KEY = 'sk_1724ebeae5b8b48215cf762ca8bb2a0c';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('paflegis_api_key');
    if (custom && custom.trim()) return custom.trim();
  }
  return DEFAULT_CLIENT_API_KEY;
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key && key.trim()) {
      localStorage.setItem('paflegis_api_key', key.trim());
    } else {
      localStorage.removeItem('paflegis_api_key');
    }
  }
}

/**
 * Executa fetch com injeção automática de chave via Header E via Query String,
 * garantindo compatibilidade e resiliência máxima em qualquer ambiente.
 */
async function paflegisFetch<T>(path: string, options?: RequestInit, retries = 1): Promise<T> {
  const apiKey = getStoredApiKey();

  // Injeta ?API_KEYS= na query string se ainda não presente
  let finalUrl = path;
  if (apiKey && !finalUrl.includes('API_KEYS=') && !finalUrl.includes('api_keys=')) {
    const separator = finalUrl.includes('?') ? '&' : '?';
    finalUrl = `${finalUrl}${separator}API_KEYS=${encodeURIComponent(apiKey)}`;
  }

  const headers = new Headers(options?.headers || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type') && (!options?.method || options.method === 'GET' || options.method === 'POST')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('x-api-key') && apiKey) {
    headers.set('x-api-key', apiKey);
  }

  let res: Response;
  try {
    res = await fetch(finalUrl, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  } catch (err: any) {
    if (retries > 0) {
      // Pequeno backoff e tenta novamente
      await new Promise((r) => setTimeout(r, 400));
      return paflegisFetch<T>(path, options, retries - 1);
    }
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou o status da API.',
      0,
      'NETWORK_ERROR'
    );
  }

  if (res.status === 401) {
    let errorMsg = 'Chave de API inválida ou não autorizada pelo servidor.';
    try {
      const json = await res.json();
      if (json.erro || json.error) errorMsg = json.erro || json.error;
    } catch {}
    throw new ApiError(errorMsg, 401, 'UNAUTHORIZED_API_KEY');
  }

  if (res.status === 429) {
    throw new ApiError(
      'Limite de requisições atingido. Por favor, aguarde alguns instantes antes de tentar novamente.',
      429,
      'RATE_LIMITED'
    );
  }

  if (!res.ok) {
    let errorDetail = '';
    try {
      const json = await res.json();
      if (json.erro || json.error) errorDetail = json.erro || json.error;
    } catch {}

    if (res.status === 404) {
      throw new ApiError(
        errorDetail || 'Recurso ou documento legislativo não encontrado.',
        404,
        'NOT_FOUND'
      );
    }

    if (res.status >= 500 && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      return paflegisFetch<T>(path, options, retries - 1);
    }

    throw new ApiError(
      errorDetail || `Erro na requisição (HTTP ${res.status})`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  /**
   * Busca matérias legislativas com fallback automático:
   * 1. Tenta /api/v1/materias
   * 2. Em caso de falha/instabilidade, consome o endpoint nativo /api/materia/materialegislativa/
   */
  getMaterias: async (params?: QueryFilters): Promise<PaginatedResult<MateriaLegislativa>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      return await paflegisFetch<PaginatedResult<MateriaLegislativa>>(`/api/v1/materias${qs}`);
    } catch (v1Err) {
      console.warn('[paflegis-client] Rota /api/v1/materias instável. Acionando fallback nativo /api/materia/...', v1Err);
      // Fallback para endpoint nativo espelhado
      const nativeParams = new URLSearchParams();
      if (params?.busca) nativeParams.set('search', params.busca);
      if (params?.tipo) nativeParams.set('tipo', params.tipo);
      if (params?.ano) nativeParams.set('ano', params.ano);
      nativeParams.set('page', String(params?.pagina || 1));
      nativeParams.set('page_size', String(params?.limite || 10));

      const nativeRes = await paflegisFetch<any>(`/api/materia/materialegislativa/?${nativeParams.toString()}`);
      const rawResults = Array.isArray(nativeRes) ? nativeRes : nativeRes?.results || [];

      const items: MateriaLegislativa[] = rawResults.map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_materia?.descricao || it.tipo || it.__str__ || 'Matéria Legislativa',
        ementa: it.ementa || '',
        autor: it.autoria?.[0]?.parlamentar?.nome || it.autores || 'Câmara Municipal',
        data_apresentacao: it.data_apresentacao || '',
        situacao: it.situacao_materia?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url: it.texto_original || null,
        documentos_acessorios: (it.documentoacessorio_set || []).map((d: any) => ({
          id: d.id,
          nome: d.nome || 'Documento Acessório',
          url: d.arquivo || null,
        })),
      }));

      const total = nativeRes?.pagination?.total_entries || nativeRes?.count || items.length;
      const limit = Number(params?.limite || 10);
      const totalPages = nativeRes?.pagination?.total_pages || Math.ceil(total / limit) || 1;

      return {
        items,
        total,
        page: Number(params?.pagina || 1),
        limit,
        totalPages,
        fonte: 'api-nativa-resiliente',
      };
    }
  },

  getMateriaById: async (id: number | string): Promise<MateriaLegislativa> => {
    try {
      return await paflegisFetch<MateriaLegislativa>(`/api/v1/materias/${id}`);
    } catch (v1Err) {
      console.warn(`[paflegis-client] /api/v1/materias/${id} falhou. Tentando /api/materia/materialegislativa/${id}/`, v1Err);
      const it = await paflegisFetch<any>(`/api/materia/materialegislativa/${id}/`);
      return {
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_materia?.descricao || it.tipo || it.__str__ || 'Matéria Legislativa',
        ementa: it.ementa || '',
        autor: it.autoria?.[0]?.parlamentar?.nome || it.autores || 'Câmara Municipal',
        data_apresentacao: it.data_apresentacao || '',
        situacao: it.situacao_materia?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url: it.texto_original || null,
        documentos_acessorios: (it.documentoacessorio_set || []).map((d: any) => ({
          id: d.id,
          nome: d.nome || 'Documento Acessório',
          url: d.arquivo || null,
        })),
      };
    }
  },

  getNormas: async (params?: QueryFilters): Promise<PaginatedResult<NormaJuridica>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      return await paflegisFetch<PaginatedResult<NormaJuridica>>(`/api/v1/normas${qs}`);
    } catch (v1Err) {
      console.warn('[paflegis-client] /api/v1/normas instável. Fallback para /api/norma/normajuridica/', v1Err);
      const nativeParams = new URLSearchParams();
      if (params?.busca) nativeParams.set('search', params.busca);
      if (params?.tipo) nativeParams.set('tipo', params.tipo);
      if (params?.ano) nativeParams.set('ano', params.ano);
      nativeParams.set('page', String(params?.pagina || 1));
      nativeParams.set('page_size', String(params?.limite || 10));

      const nativeRes = await paflegisFetch<any>(`/api/norma/normajuridica/?${nativeParams.toString()}`);
      const rawResults = Array.isArray(nativeRes) ? nativeRes : nativeRes?.results || [];

      const items: NormaJuridica[] = rawResults.map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_norma?.descricao || it.tipo || it.__str__ || 'Norma Jurídica',
        ementa: it.ementa || '',
        data_publicacao: it.data_publicacao || it.data || '',
        situacao: it.situacao_norma?.descricao || it.situacao || 'Vigente',
        texto_integral_url: it.texto_integral || undefined,
        anexos: (it.documentoacessorionorma_set || []).map((d: any) => ({
          id: d.id,
          nome: d.nome || 'Anexo',
          url: d.arquivo || '',
        })),
      }));

      const total = nativeRes?.pagination?.total_entries || nativeRes?.count || items.length;
      const limit = Number(params?.limite || 10);
      const totalPages = nativeRes?.pagination?.total_pages || Math.ceil(total / limit) || 1;

      return {
        items,
        total,
        page: Number(params?.pagina || 1),
        limit,
        totalPages,
        fonte: 'api-nativa-resiliente',
      };
    }
  },

  getNormaById: async (id: number | string): Promise<NormaJuridica> => {
    try {
      return await paflegisFetch<NormaJuridica>(`/api/v1/normas/${id}`);
    } catch {
      const it = await paflegisFetch<any>(`/api/norma/normajuridica/${id}/`);
      return {
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_norma?.descricao || it.tipo || it.__str__ || 'Norma Jurídica',
        ementa: it.ementa || '',
        data_publicacao: it.data_publicacao || it.data || '',
        situacao: it.situacao_norma?.descricao || it.situacao || 'Vigente',
        texto_integral_url: it.texto_integral || undefined,
        anexos: (it.documentoacessorionorma_set || []).map((d: any) => ({
          id: d.id,
          nome: d.nome || 'Anexo',
          url: d.arquivo || '',
        })),
      };
    }
  },

  getSessoes: async (params?: QueryFilters): Promise<PaginatedResult<SessaoPlenaria>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';

    try {
      return await paflegisFetch<PaginatedResult<SessaoPlenaria>>(`/api/v1/sessoes${qs}`);
    } catch (v1Err) {
      console.warn('[paflegis-client] /api/v1/sessoes instável. Fallback para /api/sessao/sessaoplenaria/', v1Err);
      const nativeParams = new URLSearchParams();
      if (params?.busca) nativeParams.set('search', params.busca);
      if (params?.ano) nativeParams.set('ano', params.ano);
      nativeParams.set('page', String(params?.pagina || 1));
      nativeParams.set('page_size', String(params?.limite || 10));

      const nativeRes = await paflegisFetch<any>(`/api/sessao/sessaoplenaria/?${nativeParams.toString()}`);
      const rawResults = Array.isArray(nativeRes) ? nativeRes : nativeRes?.results || [];

      const items: SessaoPlenaria[] = rawResults.map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_sessao?.descricao || it.tipo || it.__str__ || 'Sessão Plenária',
        data: it.data_inicio || it.data || '',
        horario: it.hora_inicio || it.horario || '',
        youtube_url: it.url_video || it.url_audio || undefined,
        pauta_url: it.pauta || undefined,
        ata_url: it.ata || undefined,
        situacao: it.situacao || 'Realizada',
        anexos: [],
      }));

      const total = nativeRes?.pagination?.total_entries || nativeRes?.count || items.length;
      const limit = Number(params?.limite || 10);
      const totalPages = nativeRes?.pagination?.total_pages || Math.ceil(total / limit) || 1;

      return {
        items,
        total,
        page: Number(params?.pagina || 1),
        limit,
        totalPages,
        fonte: 'api-nativa-resiliente',
      };
    }
  },

  getSessaoById: async (id: number | string): Promise<SessaoPlenaria> => {
    try {
      return await paflegisFetch<SessaoPlenaria>(`/api/v1/sessoes/${id}`);
    } catch {
      const it = await paflegisFetch<any>(`/api/sessao/sessaoplenaria/${id}/`);
      return {
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_sessao?.descricao || it.tipo || it.__str__ || 'Sessão Plenária',
        data: it.data_inicio || it.data || '',
        horario: it.hora_inicio || it.horario || '',
        youtube_url: it.url_video || it.url_audio || undefined,
        pauta_url: it.pauta || undefined,
        ata_url: it.ata || undefined,
        situacao: it.situacao || 'Realizada',
        anexos: [],
      };
    }
  },

  getTiposMaterias: (): Promise<TipoFiltro[]> => {
    return paflegisFetch<TipoFiltro[]>('/api/v1/tipos/materias');
  },

  getTiposNormas: (): Promise<TipoFiltro[]> => {
    return paflegisFetch<TipoFiltro[]>('/api/v1/tipos/normas');
  },

  getEstatisticas: (): Promise<EstatisticasLegislativas> => {
    return paflegisFetch<EstatisticasLegislativas>('/api/v1/estatisticas');
  },

  getEndpoints: (format?: string): Promise<SaplEndpointsResponse> => {
    const qs = format ? `?format=${encodeURIComponent(format)}` : '';
    return paflegisFetch<SaplEndpointsResponse>(`/api/v1/endpoints${qs}`);
  },

  /**
   * Consulta a raiz da API nativa (/api) retornando o catálogo completo de todos os 129 endpoints
   */
  getNativeApiRoot: (format?: 'full' | 'raw'): Promise<Record<string, string> | any> => {
    const qs = format === 'full' ? '?format=full' : '';
    return paflegisFetch<Record<string, string> | any>(`/api${qs}`);
  },

  getHealth: (): Promise<{
    status: string;
    sapl: string;
    sapl_latency_ms: number;
    sapl_endpoint: string;
    sapl_public_domain: string;
    sapl_origin_ip_sanitized: string;
    ip_replacement_active: boolean;
    auth: { apiKeysConfigured: boolean; strategy: string };
  }> => {
    return paflegisFetch('/api/v1/health');
  },

  sendContato: (data: {
    nome: string;
    email: string;
    assunto: string;
    mensagem: string;
    origem?: string;
    _hp?: string;
  }): Promise<{ sucesso: boolean; protocolo?: string; erro?: string; mensagem?: string }> => {
    return paflegisFetch('/api/v1/contato', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Recursos nativos do SAPL
  getParlamentares: (params?: { page?: number; search?: string }): Promise<{ count: number; results: any[]; pagination?: any }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch(`/api/parlamentares/parlamentar/${qs}`);
  },

  getAllParlamentares: async (): Promise<any[]> => {
    try {
      const p1 = await paflegisFetch<any>('/api/parlamentares/parlamentar/?page=1');
      const all: any[] = Array.isArray(p1) ? p1 : (p1.results || []);
      const totalPages = p1.pagination?.total_pages || 1;
      for (let page = 2; page <= totalPages; page++) {
        try {
          const next = await paflegisFetch<any>(`/api/parlamentares/parlamentar/?page=${page}`);
          if (next.results) all.push(...next.results);
        } catch {}
      }
      return all;
    } catch {
      return [];
    }
  },

  getParlamentarById: (id: number | string): Promise<any> => {
    return paflegisFetch(`/api/parlamentares/parlamentar/${id}/`);
  },

  getLegislaturas: async (): Promise<any[]> => {
    try {
      const res = await paflegisFetch<any>('/api/parlamentares/legislatura/');
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  getSessoesLegislativas: async (legislaturaId?: number | string): Promise<any[]> => {
    try {
      const qs = legislaturaId ? `?legislatura=${encodeURIComponent(legislaturaId)}` : '';
      const res = await paflegisFetch<any>(`/api/parlamentares/sessaolegislativa/${qs}`);
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  getMesasDiretoras: async (): Promise<any[]> => {
    try {
      const res = await paflegisFetch<any>('/api/parlamentares/mesadiretora/');
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  getComposicaoMesa: async (mesaDiretoraId?: number | string): Promise<any[]> => {
    try {
      const qs = mesaDiretoraId ? `?mesa_diretora=${encodeURIComponent(mesaDiretoraId)}` : '';
      const res = await paflegisFetch<any>(`/api/parlamentares/composicaomesa/${qs}`);
      const list = Array.isArray(res) ? res : (res.results || []);
      // Se houver mais páginas
      if (res.pagination?.total_pages > 1) {
        for (let p = 2; p <= res.pagination.total_pages; p++) {
          try {
            const extra = await paflegisFetch<any>(`/api/parlamentares/composicaomesa/?page=${p}${mesaDiretoraId ? `&mesa_diretora=${mesaDiretoraId}` : ''}`);
            if (extra.results) list.push(...extra.results);
          } catch {}
        }
      }
      return list;
    } catch {
      return [];
    }
  },

  getCargosMesa: async (): Promise<any[]> => {
    try {
      const res = await paflegisFetch<any>('/api/parlamentares/cargomesa/');
      return Array.isArray(res) ? res : (res.results || []);
    } catch {
      return [];
    }
  },

  getMandatos: async (legislaturaId?: number | string): Promise<any[]> => {
    try {
      const qs = legislaturaId ? `?legislatura=${encodeURIComponent(legislaturaId)}` : '';
      const res = await paflegisFetch<any>(`/api/parlamentares/mandato/${qs}`);
      const list = Array.isArray(res) ? res : (res.results || []);
      if (res.pagination?.total_pages > 1) {
        for (let p = 2; p <= res.pagination.total_pages; p++) {
          try {
            const extra = await paflegisFetch<any>(`/api/parlamentares/mandato/?page=${p}${legislaturaId ? `&legislatura=${legislaturaId}` : ''}`);
            if (extra.results) list.push(...extra.results);
          } catch {}
        }
      }
      return list;
    } catch {
      return [];
    }
  },

  getComissoes: (params?: { page?: number; search?: string }): Promise<{ count: number; results: any[] }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch(`/api/comissoes/comissao/${qs}`);
  },

  getComissaoById: (id: number | string): Promise<any> => {
    return paflegisFetch(`/api/comissoes/comissao/${id}/`);
  },

  getAudiencias: (params?: { page?: number; search?: string }): Promise<{ count: number; results: any[] }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch(`/api/audiencia/audienciapublica/${qs}`);
  },

  getAudienciaById: (id: number | string): Promise<any> => {
    return paflegisFetch(`/api/audiencia/audienciapublica/${id}/`);
  },

  /**
   * Consulta qualquer recurso ou entidade genérica do SAPL pelo caminho
   */
  getGenericResource: (modulo: string, recurso: string, params?: Record<string, any>): Promise<any> => {
    const q = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          q.set(k, String(v));
        }
      }
    }
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch(`/api/${modulo}/${recurso}/${qs}`);
  },

  /**
   * Inspeciona qualquer endpoint público ou nativo da API em tempo real
   */
  inspectEndpoint: async (pathOrUrl: string, params?: Record<string, any>): Promise<any> => {
    let cleanPath = pathOrUrl;
    try {
      if (cleanPath.startsWith('http')) {
        const u = new URL(cleanPath);
        cleanPath = u.pathname + u.search;
      }
    } catch {}

    const q = new URLSearchParams();
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          q.set(k, String(v));
        }
      }
    }
    const hasQuery = cleanPath.includes('?');
    const extraQuery = q.toString();
    const finalPath = extraQuery
      ? `${cleanPath}${hasQuery ? '&' : '?'}${extraQuery}`
      : cleanPath;

    return paflegisFetch<any>(finalPath);
  },

  getSyncStatus: (): Promise<any> => {
    return paflegisFetch('/api/v1/sync/status');
  },
};
