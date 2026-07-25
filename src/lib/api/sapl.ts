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

// Cache em memória
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getFromCache<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

function setToCache(key: string, data: unknown) {
  cache.set(key, { data, timestamp: Date.now() });
}

export const MOCK_TIPOS_MATERIAS: TipoFiltro[] = [
  { id: 1, sigla: 'PLO', nome: 'Projeto de Lei Ordinária' },
  { id: 2, sigla: 'PLC', nome: 'Projeto de Lei Complementar' },
  { id: 3, sigla: 'REQ', nome: 'Requerimento' },
  { id: 4, sigla: 'IND', nome: 'Indicação' },
  { id: 5, sigla: 'MOC', nome: 'Moção' },
  { id: 6, sigla: 'PAR', nome: 'Parecer de Comissão' },
];

export const MOCK_TIPOS_NORMAS: TipoFiltro[] = [
  { id: 101, sigla: 'LEI', nome: 'Lei Ordinária' },
  { id: 102, sigla: 'LCP', nome: 'Lei Complementar' },
  { id: 103, sigla: 'DEC', nome: 'Decreto Legislativo' },
  { id: 104, sigla: 'RES', nome: 'Resolução' },
  { id: 105, sigla: 'POR', nome: 'Portaria' },
];

// Gerador de acervo completo sincronizado de Matérias (Nº 1 a Nº 30)
function generateMockMaterias(): MateriaLegislativa[] {
  const vereadores = [
    'Vereador João da Silva (MDB)',
    'Vereadora Maria Oliveira (UNIÃO)',
    'Vereador Carlos Eduardo (PP)',
    'Vereadora Ana Paula (PSDB)',
    'Mesa Diretora',
    'Vereador Roberto Santos (PL)',
    'Vereador Fernando Lima (PT)',
  ];

  const situacoes = [
    'Aprovado em 2º Turno',
    'Deferido',
    'Em Tramitação nas Comissões',
    'Enviado ao Poder Executivo',
    'Aprovado por Unanimidade',
  ];

  const assuntos = [
    'Incentivo à Inovação e Sustentabilidade Agrícola',
    'Pavimentação Asfáltica e Iluminação Pública no Bairro Bela Vista',
    'Código Tributário Municipal e Incentivo às Microempresas',
    'Ampliação do Horário de Atendimento no PSF Central',
    'Moção de Congratulações aos Professores da Rede Municipal',
    'Regularização Fundiária Urbana e Rural',
    'Criação do Fundo Municipal de Conservação Ambiental',
    'Apoio à Agricultura Familiar e Feira do Produtor',
    'Instalação de Câmeras de Monitoramento em Escolas',
    'Programa Jovem Aprendiz no Serviço Público Municipal',
  ];

  const items: MateriaLegislativa[] = [];

  for (let i = 1; i <= 30; i++) {
    const ano = 2024 - Math.floor((i - 1) / 8);
    const tipoObj = MOCK_TIPOS_MATERIAS[(i - 1) % MOCK_TIPOS_MATERIAS.length];
    const autor = vereadores[i % vereadores.length];
    const situacao = situacoes[i % situacoes.length];
    const ementaDesc = assuntos[(i - 1) % assuntos.length];

    items.push({
      id: 200000 + i,
      numero: i,
      ano,
      tipo: tipoObj.nome,
      tipo_id: tipoObj.id,
      ementa: `${tipoObj.nome} Nº ${i}/${ano}: ${ementaDesc} no município de Pedro Afonso - TO e dá outras providências.`,
      autor,
      data_apresentacao: formatDateBR(`${ano}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 3) % 28) + 1).padStart(2, '0')}`),
      situacao,
      relator: vereadores[(i + 1) % vereadores.length],
      regime_tramitacao: i % 2 === 0 ? 'Urgência Especial' : 'Ordinário',
      texto_original_url: '',
      documentos_acessorios: [],
      tramitacoes: [
        {
          data: formatDateBR(`${ano}-04-01`),
          unidade_origem: 'Protocolo Geral',
          unidade_destino: 'Mesa Diretora',
          status: 'Matéria Lida no Expediente',
        },
        {
          data: formatDateBR(`${ano}-04-05`),
          unidade_origem: 'Mesa Diretora',
          unidade_destino: 'Comissão de Constituição, Justiça e Redação',
          status: 'Encaminhada para Análise',
        },
      ],
    });
  }

  return items;
}

// Gerador de acervo de Normas Jurídicas
function generateMockNormas(): NormaJuridica[] {
  const normasDesc = [
    'Política Municipal de Proteção aos Recursos Hídricos do Rio Tocantins e Rio Sono',
    'Estrutura Organizacional e Plano de Cargos e Remuneração dos Servidores',
    'Concessão de Título de Cidadão Pedro-Afonsino a Personalidades de Destaque',
    'Regulamentação da Transparência Digital e Acesso à Informação no Município',
    'Diretrizes Orçamentárias para o Exercício Financeiro Municipal',
    'Programa de Coleta Seletiva e Reciclagem de Resíduos Sólidos',
    'Isenção Tributária para Feirantes e Microempreendedores Locais',
    'Regulamento Interno do Poder Legislativo - Pedro Afonso - TO',
    'Abertura de Crédito Adicional Suplementar ao Orçamento Vigente',
    'Denominação Oficial de Vias Públicas e Praças Municipais',
  ];

  const items: NormaJuridica[] = [];

  for (let i = 1; i <= 25; i++) {
    const ano = 2024 - Math.floor((i - 1) / 6);
    const tipoObj = MOCK_TIPOS_NORMAS[(i - 1) % MOCK_TIPOS_NORMAS.length];
    const desc = normasDesc[(i - 1) % normasDesc.length];

    items.push({
      id: 1000 + i,
      numero: 1400 + i,
      ano,
      tipo: tipoObj.nome,
      tipo_id: tipoObj.id,
      ementa: `${tipoObj.nome} Nº ${1400 + i}/${ano}: ${desc} em Pedro Afonso - TO.`,
      data_publicacao: formatDateBR(`${ano}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 4) % 28) + 1).padStart(2, '0')}`),
      situacao: 'Vigente',
      assunto: 'Administração e Legislação Municipal',
      texto_integral_url: '',
      anexos: [],
    });
  }

  return items;
}

// Gerador de Sessões Plenárias
function generateMockSessoes(): SessaoPlenaria[] {
  const items: SessaoPlenaria[] = [];

  for (let i = 1; i <= 20; i++) {
    const ano = 2024 - Math.floor((i - 1) / 8);
    const tipo = i % 5 === 0 ? 'Sessão Plenária Extraordinária' : 'Sessão Plenária Ordinária';

    items.push({
      id: 500 + i,
      numero: i,
      ano,
      tipo,
      data: formatDateBR(`${ano}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 2) % 28) + 1).padStart(2, '0')}`),
      horario: '18:00',
      pauta_url: '',
      ata_url: '',
      youtube_url: '',
      situacao: i <= 18 ? 'Realizada' : 'Convocada',
      presencas: [
        { nome: 'João da Silva', partido: 'MDB', presenca: true, cargo: 'Presidente' },
        { nome: 'Maria Oliveira', partido: 'UNIÃO', presenca: true, cargo: 'Vice-Presidente' },
        { nome: 'Carlos Eduardo', partido: 'PP', presenca: true, cargo: '1º Secretário' },
        { nome: 'Ana Paula', partido: 'PSDB', presenca: true },
        { nome: 'Roberto Santos', partido: 'PL', presenca: true },
        { nome: 'Fernando Lima', partido: 'PT', presenca: i % 2 === 0 },
      ],
      ordem_dia: [
        {
          id: i * 10 + 1,
          ordem: 1,
          materia_titulo: `Matéria nº ${i}/${ano}`,
          materia_ementa: `Votação do projeto de lei municipal nº ${i}/${ano}.`,
          resultado: 'Aprovado por Unanimidade',
        },
      ],
      anexos: [],
    });
  }

  return items;
}

const MOCK_MATERIAS = generateMockMaterias();
const MOCK_NORMAS = generateMockNormas();
const MOCK_SESSOES = generateMockSessoes();

export async function getTiposMaterias(): Promise<TipoFiltro[]> {
  try {
    const cached = getFromCache<TipoFiltro[]>('tipos_materias');
    if (cached) return cached;

    const res = await fetch('/api/v1/tipos/materias');
    if (res.ok) {
      const data = await res.json();
      setToCache('tipos_materias', data);
      return data;
    }
  } catch (e) {
    console.warn('API local indisponível, usando fallback de tipos:', e);
  }
  return MOCK_TIPOS_MATERIAS;
}

export async function getTiposNormas(): Promise<TipoFiltro[]> {
  try {
    const cached = getFromCache<TipoFiltro[]>('tipos_normas');
    if (cached) return cached;

    const res = await fetch('/api/v1/tipos/normas');
    if (res.ok) {
      const data = await res.json();
      setToCache('tipos_normas', data);
      return data;
    }
  } catch (e) {
    console.warn('API local indisponível, usando fallback de tipos de normas:', e);
  }
  return MOCK_TIPOS_NORMAS;
}

export async function getMaterias(
  filters?: QueryFilters
): Promise<{ items: MateriaLegislativa[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  try {
    const params = new URLSearchParams();
    if (filters?.busca) params.set('busca', filters.busca);
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.ano) params.set('ano', filters.ano);
    if (filters?.situacao) params.set('situacao', filters.situacao);
    params.set('pagina', page.toString());
    params.set('limite', limit.toString());

    const res = await fetch(`/api/v1/materias?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: MateriaLegislativa) => ({
            ...item,
            texto_original_url: normalizeDocumentUrl(item.texto_original_url),
            documentos_acessorios: (item.documentos_acessorios || []).map(doc => ({
              ...doc,
              url: normalizeDocumentUrl(doc.url),
            })),
          })),
          total: data.total || data.items.length,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || data.items.length) / limit),
        };
      }
    }
  } catch (e) {
    console.warn('Fallback ativado para matérias legislativas:', e);
  }

  // Filtragem e Paginação no Acervo Sincronizado Local
  let filtered = [...MOCK_MATERIAS];
  if (filters?.busca) {
    const term = filters.busca.toLowerCase();
    filtered = filtered.filter(
      m =>
        m.ementa.toLowerCase().includes(term) ||
        m.autor.toLowerCase().includes(term) ||
        m.tipo.toLowerCase().includes(term) ||
        `${m.numero}/${m.ano}`.includes(term)
    );
  }
  if (filters?.tipo) {
    filtered = filtered.filter(m => m.tipo === filters.tipo || m.tipo_id?.toString() === filters.tipo);
  }
  if (filters?.ano) {
    filtered = filtered.filter(m => m.ano.toString() === filters.ano);
  }

  // Ordenação regressiva temporal (mais recentes primeiro)
  filtered.sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano;
    const dB = new Date(b.data_apresentacao || 0).getTime();
    const dA = new Date(a.data_apresentacao || 0).getTime();
    if (dB !== dA) return dB - dA;
    return b.numero - a.numero;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return { items: paginatedItems, total, page, limit, totalPages };
}

export async function getMateriaById(id: number | string): Promise<MateriaLegislativa | null> {
  try {
    const res = await fetch(`/api/v1/materias/${id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        texto_original_url: normalizeDocumentUrl(data.texto_original_url),
        documentos_acessorios: (data.documentos_acessorios || []).map((doc: { url: string }) => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      };
    }
  } catch (e) {
    console.warn('Fallback para detalhe da matéria:', e);
  }

  const found = MOCK_MATERIAS.find(m => m.id.toString() === id.toString() || m.numero.toString() === id.toString());
  return found || null;
}

export async function getNormas(
  filters?: QueryFilters
): Promise<{ items: NormaJuridica[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  try {
    const params = new URLSearchParams();
    if (filters?.busca) params.set('busca', filters.busca);
    if (filters?.tipo) params.set('tipo', filters.tipo);
    if (filters?.ano) params.set('ano', filters.ano);
    params.set('pagina', page.toString());
    params.set('limite', limit.toString());

    const res = await fetch(`/api/v1/normas?${params.toString()}`);
    if (res.ok) {
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
          total: data.total || data.items.length,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || data.items.length) / limit),
        };
      }
    }
  } catch (e) {
    console.warn('Fallback para normas jurídicas:', e);
  }

  let filtered = [...MOCK_NORMAS];
  if (filters?.busca) {
    const term = filters.busca.toLowerCase();
    filtered = filtered.filter(
      n =>
        n.ementa.toLowerCase().includes(term) ||
        (n.assunto && n.assunto.toLowerCase().includes(term)) ||
        `${n.numero}/${n.ano}`.includes(term)
    );
  }
  if (filters?.tipo) {
    filtered = filtered.filter(n => n.tipo === filters.tipo || n.tipo_id?.toString() === filters.tipo);
  }
  if (filters?.ano) {
    filtered = filtered.filter(n => n.ano.toString() === filters.ano);
  }

  // Ordenação regressiva temporal (mais recentes primeiro)
  filtered.sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano;
    const dB = new Date(b.data_publicacao || 0).getTime();
    const dA = new Date(a.data_publicacao || 0).getTime();
    if (dB !== dA) return dB - dA;
    return b.numero - a.numero;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return { items: paginatedItems, total, page, limit, totalPages };
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
    console.warn('Fallback para detalhe da norma:', e);
  }

  const found = MOCK_NORMAS.find(n => n.id.toString() === id.toString() || n.numero.toString() === id.toString());
  return found || null;
}

export async function getSessoes(
  filters?: QueryFilters
): Promise<{ items: SessaoPlenaria[]; total: number; page: number; limit: number; totalPages: number }> {
  const page = filters?.pagina || 1;
  const limit = filters?.limite || 10;

  try {
    const params = new URLSearchParams();
    if (filters?.busca) params.set('busca', filters.busca);
    if (filters?.ano) params.set('ano', filters.ano);
    params.set('pagina', page.toString());
    params.set('limite', limit.toString());

    const res = await fetch(`/api/v1/sessoes?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        return {
          items: data.items.map((item: SessaoPlenaria) => ({
            ...item,
            pauta_url: normalizeDocumentUrl(item.pauta_url),
            ata_url: normalizeDocumentUrl(item.ata_url),
            anexos: (item.anexos || []).map(doc => ({
              ...doc,
              url: normalizeDocumentUrl(doc.url),
            })),
          })),
          total: data.total || data.items.length,
          page: data.page || page,
          limit: data.limit || limit,
          totalPages: data.totalPages || Math.ceil((data.total || data.items.length) / limit),
        };
      }
    }
  } catch (e) {
    console.warn('Fallback para sessões plenárias:', e);
  }

  let filtered = [...MOCK_SESSOES];
  if (filters?.busca) {
    const term = filters.busca.toLowerCase();
    filtered = filtered.filter(
      s =>
        s.tipo.toLowerCase().includes(term) ||
        s.situacao.toLowerCase().includes(term) ||
        `${s.numero}/${s.ano}`.includes(term)
    );
  }
  if (filters?.ano) {
    filtered = filtered.filter(s => s.ano.toString() === filters.ano);
  }

  // Ordenação regressiva temporal (mais recentes primeiro)
  filtered.sort((a, b) => {
    if (b.ano !== a.ano) return b.ano - a.ano;
    const dB = new Date(b.data || 0).getTime();
    const dA = new Date(a.data || 0).getTime();
    if (dB !== dA) return dB - dA;
    return b.numero - a.numero;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return { items: paginatedItems, total, page, limit, totalPages };
}

export async function getSessaoById(id: number | string): Promise<SessaoPlenaria | null> {
  try {
    const res = await fetch(`/api/v1/sessoes/${id}`);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        pauta_url: normalizeDocumentUrl(data.pauta_url),
        ata_url: normalizeDocumentUrl(data.ata_url),
        anexos: (data.anexos || []).map((doc: { url: string }) => ({
          ...doc,
          url: normalizeDocumentUrl(doc.url),
        })),
      };
    }
  } catch (e) {
    console.warn('Fallback para detalhe da sessão:', e);
  }

  const found = MOCK_SESSOES.find(s => s.id.toString() === id.toString() || s.numero.toString() === id.toString());
  return found || null;
}

// Fallback counts derived from the mock data so numbers match what list pages show offline
function buildFallbackStats(): EstatisticasLegislativas {
  const anoAtual = new Date().getFullYear();

  const materiasAnoAtual = MOCK_MATERIAS.filter(m => m.ano === anoAtual).length;
  const normasAnoAtual = MOCK_NORMAS.filter(n => n.ano === anoAtual).length;
  const sessoesAnoAtual = MOCK_SESSOES.filter(s => s.ano === anoAtual).length;

  // Count per tipo from mock data
  const materiasPorTipo: Record<string, number> = {};
  for (const m of MOCK_MATERIAS) {
    materiasPorTipo[m.tipo] = (materiasPorTipo[m.tipo] || 0) + 1;
  }
  const normasPorTipo: Record<string, number> = {};
  for (const n of MOCK_NORMAS) {
    normasPorTipo[n.tipo] = (normasPorTipo[n.tipo] || 0) + 1;
  }

  return {
    total_materias: MOCK_MATERIAS.length,
    total_normas: MOCK_NORMAS.length,
    total_sessoes: MOCK_SESSOES.length,
    materias_ano_atual: materiasAnoAtual,
    normas_ano_atual: normasAnoAtual,
    sessoes_ano_atual: sessoesAnoAtual,
    materias_por_tipo: Object.entries(materiasPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade })),
    normas_por_tipo: Object.entries(normasPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade })),
    fonte: 'fallback',
  };
}

export async function getEstatisticas(): Promise<EstatisticasLegislativas> {
  try {
    const res = await fetch('/api/v1/estatisticas');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn('Fallback para estatísticas:', e);
  }

  return buildFallbackStats();
}
