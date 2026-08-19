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

async function paflegisFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = path.startsWith('http') ? path : path;
  
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
  } catch (err: any) {
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
      throw new ApiError(errorDetail || 'Recurso ou documento legislativo não encontrado.', 404, 'NOT_FOUND');
    }

    if (res.status >= 500) {
      throw new ApiError(
        errorDetail || 'O serviço de dados do SAPL está temporariamente instável. Tente novamente em instantes.',
        res.status,
        'SERVER_ERROR'
      );
    }

    throw new ApiError(errorDetail || `Erro na requisição (HTTP ${res.status})`, res.status);
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

  getHealth: (): Promise<{
    status: string;
    sapl: string;
    sapl_latency_ms: number;
    gemini: string;
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

  sendChatMessage: (
    message: string,
    history: { role: string; content: string }[]
  ): Promise<{ reply?: string; error?: string; isOutOfScope?: boolean }> => {
    return paflegisFetch('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    });
  },
};
