export interface DocumentoAnexo {
  id: number;
  nome: string;
  tipo?: string;
  data?: string;
  url: string; // URL tratada e normalizada
  url_original?: string;
  descricao?: string;
  tamanho?: string;
}

export interface MateriaLegislativa {
  id: number;
  numero: number;
  ano: number;
  tipo: string;
  tipo_id?: number;
  ementa: string;
  autor: string;
  data_apresentacao: string;
  situacao: string;
  relator?: string;
  regime_tramitacao?: string;
  texto_original_url?: string;
  documentos_acessorios: DocumentoAnexo[];
  tramitacoes?: {
    data: string;
    unidade_origem: string;
    unidade_destino: string;
    status: string;
    texto?: string;
  }[];
}

export interface NormaJuridica {
  id: number;
  numero: number;
  ano: number;
  tipo: string;
  tipo_id?: number;
  ementa: string;
  data_publicacao: string;
  situacao: string;
  assunto?: string;
  texto_integral_url?: string;
  anexos: DocumentoAnexo[];
}

export interface VereadorPresenca {
  nome: string;
  partido?: string;
  presenca: boolean;
  cargo?: string;
}

export interface ItemOrdemDia {
  id: number;
  ordem: number;
  materia_id?: number;
  materia_titulo: string;
  materia_ementa: string;
  resultado?: string;
  observacao?: string;
}

export interface SessaoPlenaria {
  id: number;
  numero: number;
  ano: number;
  tipo: string; // ex: Ordinária, Extraordinária, Solene
  data: string;
  horario: string;
  pauta_url?: string;
  ata_url?: string;
  youtube_url?: string;
  situacao: string;
  presencas?: VereadorPresenca[];
  ordem_dia?: ItemOrdemDia[];
  anexos: DocumentoAnexo[];
}

export interface TipoFiltro {
  id: number;
  sigla: string;
  nome: string;
}

export interface EstatisticasLegislativas {
  total_materias: number;
  total_normas: number;
  total_sessoes: number;
  materias_ano_atual: number;
  normas_ano_atual: number;
  sessoes_ano_atual: number;
  materias_por_tipo: { tipo: string; quantidade: number }[];
  normas_por_tipo: { tipo: string; quantidade: number }[];
  fonte?: string;
  atualizado_em?: string;
  cache_age_s?: number;
}

export interface CookiePreferences {
  essencial: boolean; // Sempre true
  analitico: boolean;
  marketing: boolean; // AdSense/AdMob
  consentimento_definido: boolean;
}

export interface QueryFilters {
  busca?: string;
  tipo?: string;
  ano?: string;
  situacao?: string;
  autor?: string;
  pagina?: number;
  limite?: number;
}
