/**
 * lib/sapl/client.ts — Cliente HTTP para chamadas do Frontend às APIs do Paflegis.
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

async function paflegisFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  const apiKey = getStoredApiKey();

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
    res = await fetch(url, {
      ...options,
      headers,
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
      0,
      'NETWORK_ERROR'
    );
  }

  if (res.status === 401) {
    let errorMsg = 'Chave de API inválida ou não autorizada pelo servidor.';
    try {
      const json = await res.json();
      if (json.error) errorMsg = json.error;
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
      if (json.error) errorDetail = json.error;
    } catch {}

    if (res.status === 404) {
      throw new ApiError(
        errorDetail || 'Recurso ou documento legislativo não encontrado.',
        404,
        'NOT_FOUND'
      );
    }

    if (res.status >= 500) {
      throw new ApiError(
        errorDetail ||
          'O serviço de dados do SAPL está temporariamente instável. Tente novamente em instantes.',
        res.status,
        'SERVER_ERROR'
      );
    }

    throw new ApiError(
      errorDetail || `Erro na requisição (HTTP ${res.status})`,
      res.status
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  getMaterias: (params?: QueryFilters): Promise<PaginatedResult<MateriaLegislativa>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch<PaginatedResult<MateriaLegislativa>>(`/api/v1/materias${qs}`);
  },

  getMateriaById: (id: number | string): Promise<MateriaLegislativa> => {
    return paflegisFetch<MateriaLegislativa>(`/api/v1/materias/${id}`);
  },

  getNormas: (params?: QueryFilters): Promise<PaginatedResult<NormaJuridica>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch<PaginatedResult<NormaJuridica>>(`/api/v1/normas${qs}`);
  },

  getNormaById: (id: number | string): Promise<NormaJuridica> => {
    return paflegisFetch<NormaJuridica>(`/api/v1/normas/${id}`);
  },

  getSessoes: (params?: QueryFilters): Promise<PaginatedResult<SessaoPlenaria>> => {
    const q = new URLSearchParams();
    if (params?.busca) q.set('busca', params.busca);
    if (params?.tipo) q.set('tipo', params.tipo);
    if (params?.ano) q.set('ano', params.ano);
    if (params?.pagina) q.set('pagina', String(params.pagina));
    if (params?.limite) q.set('limite', String(params.limite));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch<PaginatedResult<SessaoPlenaria>>(`/api/v1/sessoes${qs}`);
  },

  getSessaoById: (id: number | string): Promise<SessaoPlenaria> => {
    return paflegisFetch<SessaoPlenaria>(`/api/v1/sessoes/${id}`);
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

  // Novos recursos nativos do SAPL
  getParlamentares: (params?: { page?: number; search?: string }): Promise<{ count: number; results: any[] }> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return paflegisFetch(`/api/parlamentares/parlamentar/${qs}`);
  },

  getParlamentarById: (id: number | string): Promise<any> => {
    return paflegisFetch(`/api/parlamentares/parlamentar/${id}/`);
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

  getSyncStatus: (): Promise<any> => {
    return paflegisFetch('/api/v1/sync/status');
  },

  triggerSync: async (type: 'incremental' | 'full' = 'incremental'): Promise<any> => {
    return paflegisFetch('/api/v1/sync', {
      method: 'POST',
      body: JSON.stringify({ type }),
    });
  },

  getDocumentosAdministrativos: async (params?: { page?: number; search?: string }): Promise<any> => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    try {
      return await paflegisFetch(`/api/protocoloadm/documentoadministrativo/${qs}`);
    } catch {
      return { count: 0, results: [] };
    }
  },

  getAllDocumentos: async (params?: QueryFilters & { categoria?: string }): Promise<{
    items: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    fonte: string;
  }> => {
    const limit = params?.limite || 10;
    const page = params?.pagina || 1;
    const categoria = params?.categoria || 'todos';

    // Se selecionou apenas normas
    if (categoria === 'normas') {
      const res = await api.getNormas(params);
      return {
        items: res.items.map((n) => ({
          ...n,
          origem_tipo: 'norma',
          categoria_label: 'Norma Jurídica',
        })),
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
        fonte: res.fonte || 'api-nativa',
      };
    }

    // Se selecionou apenas matérias
    if (categoria === 'materias') {
      const res = await api.getMaterias(params);
      return {
        items: res.items.map((m) => ({
          ...m,
          origem_tipo: 'materia',
          categoria_label: 'Matéria Legislativa',
        })),
        total: res.total,
        page: res.page,
        limit: res.limit,
        totalPages: res.totalPages,
        fonte: res.fonte || 'api-nativa',
      };
    }

    // Se selecionou todos: busca concorrente e unificada de matérias e normas
    try {
      const [matRes, normRes] = await Promise.allSettled([
        api.getMaterias({ ...params, limite: limit }),
        api.getNormas({ ...params, limite: limit }),
      ]);

      const matItems = matRes.status === 'fulfilled' ? matRes.value.items : [];
      const normItems = normRes.status === 'fulfilled' ? normRes.value.items : [];

      const combined = [
        ...matItems.map((m) => ({ ...m, origem_tipo: 'materia', categoria_label: 'Matéria Legislativa' })),
        ...normItems.map((n) => ({ ...n, origem_tipo: 'norma', categoria_label: 'Norma Jurídica' })),
      ];

      // Ordenar por ano decrescente e id decrescente
      combined.sort((a, b) => {
        const anoA = Number(a.ano) || 0;
        const anoB = Number(b.ano) || 0;
        if (anoB !== anoA) return anoB - anoA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      const totalMat = matRes.status === 'fulfilled' ? matRes.value.total : 0;
      const totalNorm = normRes.status === 'fulfilled' ? normRes.value.total : 0;
      const total = totalMat + totalNorm;

      return {
        items: combined.slice(0, limit),
        total: total || combined.length,
        page,
        limit,
        totalPages: Math.ceil((total || combined.length) / limit) || 1,
        fonte: 'api-nativa-unificada',
      };
    } catch {
      // Fallback seguro caso falhe
      const mat = await api.getMaterias(params).catch(() => ({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 }));
      return {
        items: mat.items.map((m) => ({ ...m, origem_tipo: 'materia', categoria_label: 'Matéria Legislativa' })),
        total: mat.total,
        page: mat.page,
        limit: mat.limit,
        totalPages: mat.totalPages,
        fonte: 'fallback',
      };
    }
  },
};


