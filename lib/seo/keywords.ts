/**
 * lib/seo/keywords.ts — Extração automática de palavras-chave em Português
 * para Matérias, Normas e Sessões Plenárias.
 */

// Lista de stopwords em Português + termos genéricos do contexto legislativo
const STOPWORDS = new Set([
  // Artigos, preposições, pronomes, conjunções
  'a', 'ante', 'após', 'ate', 'até', 'com', 'contra', 'de', 'desde', 'em', 'entre',
  'para', 'perante', 'por', 'sem', 'sob', 'sobre', 'trás', 'tras',
  'o', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'do', 'da', 'dos', 'das',
  'no', 'na', 'nos', 'nas', 'ao', 'aos', 'à', 'às', 'pelo', 'pela', 'pelos', 'pelas',
  'que', 'qual', 'quais', 'cujo', 'cuja', 'cujos', 'cujas', 'onde', 'como', 'quando',
  'este', 'esta', 'estes', 'estas', 'isto', 'esse', 'essa', 'esses', 'essas', 'isso',
  'aquele', 'aquela', 'aqueles', 'aquelas', 'aquilo', 'meu', 'minha', 'seu', 'sua',
  'nosso', 'nossa', 'nossos', 'nossas', 'dele', 'dela', 'deles', 'delas',
  'ele', 'ela', 'eles', 'elas', 'nós', 'vós', 'você', 'vocês',
  'e', 'ou', 'mas', 'porém', 'todavia', 'contudo', 'entanto', 'portanto', 'pois',
  'porque', 'porquanto', 'se', 'caso', 'embora', 'conforme', 'segundo', 'consoante',
  'mais', 'menos', 'muito', 'muita', 'muitos', 'muitas', 'pouco', 'pouca', 'poucos', 'poucas',
  'todo', 'toda', 'todos', 'todas', 'outro', 'outra', 'outros', 'outras', 'mesmo', 'mesma',
  'também', 'tambem', 'já', 'ja', 'ainda', 'assim', 'apenas', 'somente', 'tal', 'tais',
  'ser', 'estar', 'haver', 'ter', 'fazer', 'ir', 'dar', 'ver', 'vir',
  'é', 'era', 'foi', 'foram', 'será', 'serao', 'serão', 'seja', 'sejam',
  'está', 'estava', 'estavam', 'estiveram', 'seja', 'ficam', 'fica', 'ficando',
  'tem', 'têm', 'tinha', 'tinham', 'terá', 'terao', 'terão', 'tendo',
  'faz', 'fazer', 'feito', 'feita', 'feitos', 'feitas', 'fazendo',
  'dá', 'dão', 'dado', 'dada', 'dados', 'dadas', 'dando',

  // Termos genéricos do direito legislativo (burocracia/preâmbulos)
  'dispõe', 'dispoe', 'sobre', 'altera', 'revoga', 'aprova', 'institui', 'cria',
  'fixa', 'concede', 'estabelece', 'denomina', 'autoriza', 'encaminha', 'recomenda',
  'solicita', 'pede', 'requer', 'indica', 'determina', 'dá', 'providências', 'providencias',
  'outras', 'forma', 'âmbito', 'ambito', 'município', 'municipio', 'municipal',
  'câmara', 'camara', 'vereador', 'vereadores', 'prefeitura', 'prefeito', 'prefeita',
  'pedro', 'afonso', 'tocantins', 'to', 'poder', 'executivo', 'legislativo',
  'lei', 'leis', 'decreto', 'decretos', 'projeto', 'projetos', 'portaria', 'portarias',
  'resolução', 'resolucao', 'resoluções', 'resolucoes', 'requerimento', 'requerimentos',
  'moção', 'mocao', 'moções', 'mocoes', 'emenda', 'emendas', 'parecer', 'pareceres',
  'artigo', 'artigos', 'art', 'arts', 'parágrafo', 'paragrafo', 'inciso', 'alínea', 'alinea',
  'anexo', 'anexos', 'termo', 'termos', 'redação', 'redacao', 'vigor', 'data', 'publicação',
  'publicacao', 'disposições', 'disposicoes', 'gerais', 'finais', 'contrárias', 'contrarias'
]);

/**
 * Normaliza um texto para minúsculas sem acentos/diacríticos.
 */
export function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Extrai entre 5 e 8 palavras-chave relevantes a partir do título e ementa do documento.
 * Dá maior peso a palavras do título e a palavras com maior frequência na ementa.
 */
export function extrairPalavrasChave(
  titulo: string,
  ementa: string,
  minCount = 5,
  maxCount = 8
): string[] {
  const scoreMap = new Map<string, number>();
  const originalWordMap = new Map<string, string>(); // Guarda versão com maiúscula/acentos bonitos

  const processWord = (rawWord: string, weightMultiplier: number) => {
    // Remove pontuações e caracteres especiais das bordas
    const cleanRaw = rawWord.replace(/^[^\wáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+/g, '').replace(/[^\wáàâãéèêíïóôõöúçñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ]+$/g, '');
    if (cleanRaw.length < 3) return; // Ignora palavras muito curtas
    if (/^\d+$/.test(cleanRaw)) return; // Ignora números isolados

    const norm = normalizarTexto(cleanRaw);
    if (STOPWORDS.has(norm)) return;

    const currentScore = scoreMap.get(norm) || 0;
    scoreMap.set(norm, currentScore + weightMultiplier);

    // Se ainda não guardamos a palavra original, ou se a nova tem acentos/maiúscula melhor, guarda
    if (!originalWordMap.has(norm)) {
      originalWordMap.set(norm, cleanRaw.toLowerCase());
    }
  };

  // Processa palavras do título com peso alto (3.0)
  const tituloWords = titulo.split(/\s+/);
  for (const w of tituloWords) {
    processWord(w, 3.0);
  }

  // Processa palavras da ementa com peso normal (1.0)
  const ementaWords = ementa.split(/\s+/);
  for (const w of ementaWords) {
    processWord(w, 1.0);
  }

  // Ordena por pontuação decrescente
  const sortedNorms = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([norm]) => originalWordMap.get(norm) || norm);

  // Se tivermos menos palavras que minCount após filtro, tenta resgatar algumas palavras significativas
  let result = sortedNorms.slice(0, maxCount);

  if (result.length < minCount) {
    // Adiciona palavras chave contextuais padrão de Pedro Afonso se o texto for muito curto
    const fallbackKeywords = ['legislação', 'pedro afonso', 'matéria legislativa', 'transparência pública', 'sessão plenária'];
    for (const fb of fallbackKeywords) {
      if (result.length >= minCount) break;
      if (!result.includes(fb)) {
        result.push(fb);
      }
    }
  }

  return result;
}

/** Formata o array de palavras-chave para meta name="keywords" */
export function formatarMetaKeywords(keywords: string[]): string {
  return keywords.join(', ');
}
