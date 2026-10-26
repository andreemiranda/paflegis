/**
 * lib/sapl/parlamentaresData.ts
 * Módulo dinâmico que integra dados 100% oficiais do SAPL:
 * - Vereadores e Parlamentares (com biografia e fotografia oficiais da API)
 * - Legislaturas (10ª 2025-2028, 9ª 2021-2024, 8ª 2017-2020, 7ª 2013-2016)
 * - Mesa Diretora com MANDATO ANUAL por Sessão Legislativa oficial da API
 * - Composição da Mesa e Cargos
 *
 * Não utiliza imagens de bancos de terceiros (Unsplash/Picsum) nem biografias fictícias.
 */

export interface ApiParlamentar {
  id: number;
  __str__: string;
  nome_parlamentar: string;
  nome_completo: string;
  sexo?: string;
  numero_gab_parlamentar?: string;
  telefone?: string;
  telefone_celular?: string;
  endereco_web?: string;
  profissao?: string;
  email?: string;
  locais_atuacao?: string;
  ativo: boolean;
  biografia?: string;
  fotografia?: string;
  partido?: string;
}

export interface ApiLegislatura {
  id: number;
  __str__: string;
  numero: number;
  data_inicio: string;
  data_fim: string;
  data_eleicao?: string;
  observacao?: string;
}

export interface ApiSessaoLegislativa {
  id: number;
  __str__: string;
  numero: number;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  legislatura: number;
}

export interface ApiMesaDiretora {
  id: number;
  __str__: string;
  data_inicio?: string;
  data_fim?: string;
  descricao?: string;
  sessao_legislativa: number;
}

export interface ApiComposicaoMesa {
  id: number;
  __str__: string;
  parlamentar: number;
  cargo: number;
  mesa_diretora: number;
  parlamentar_detalhe?: ApiParlamentar;
  cargo_nome?: string;
}

export interface ApiCargoMesa {
  id: number;
  __str__: string;
  descricao: string;
  unico: boolean;
  id_ordenacao: number;
}

export interface ApiMandato {
  id: number;
  __str__: string;
  parlamentar: number;
  legislatura: number;
  titular?: boolean;
  data_inicio_mandato?: string;
  data_fim_mandato?: string;
}
