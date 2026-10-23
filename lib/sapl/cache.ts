/**
 * lib/sapl/cache.ts — Gerenciador de cache resiliente conectado ao storage persistente e contagens reais.
 * Elimina estatísticas inventadas; contagens vêm estritamente do upstream ou do espelho local.
 */

import { getStorage } from '@/lib/storage';
import { safeFetchWithRetry, slog } from './backend';
import { getConfig } from '@/lib/config';

export function setPersistentCache(key: string, data: unknown): void {
  const storage = getStorage();
  storage.set(key, data, 86400 * 2).catch((e) => {
    slog('WARN', 'cache', `Erro ao gravar no storage para ${key}`, e);
  });
}

export function getPersistentCache<T>(key: string): { data: T; fetchedAt: number; source: string } | null {
  // Chamada síncrona mantida para compatibilidade em rotas existentes
  // O cache avançado reside em getStorage()
  return null;
}

/**
 * Consulta contagem real e atualizada de matérias, normas e sessões.
 * 1. Tenta obter o 'count' real do upstream.
 * 2. Se indisponível, conta os registros salvos no espelho local.
 * 3. Se ainda não houver dados, retorna status explícito em vez de números fictícios.
 */
export async function getEstatisticasReais(forceRefresh: boolean = false): Promise<{
  total_materias: number;
  total_normas: number;
  total_sessoes: number;
  materias_ano_atual?: number;
  normas_ano_atual?: number;
  sessoes_ano_atual?: number;
  materias_por_tipo: { tipo: string; quantidade: number }[];
  normas_por_tipo: { tipo: string; quantidade: number }[];
  fonte: 'upstream-live' | 'mirror-storage' | 'indisponivel';
  atualizado_em: string;
  cache_age_s: number;
  dados_disponiveis: boolean;
}> {
  const config = getConfig();
  const storage = getStorage();
  const anoAtual = new Date().getFullYear();

  // Verifica cache recente das estatísticas
  if (!forceRefresh) {
    const cached = await storage.get<any>('stats:consolidado');
    if (cached && (Date.now() - new Date(cached.atualizado_em).getTime()) < 300000) { // 5 minutos
      return cached;
    }
  }

  let totalMaterias = 0;
  let totalNormas = 0;
  let totalSessoes = 0;
  let materiasAnoAtual = 0;
  let normasAnoAtual = 0;
  let sessoesAnoAtual = 0;
  let fonte: 'upstream-live' | 'mirror-storage' | 'indisponivel' = 'indisponivel';

  try {
    // Consulta paralela dos counts reais no upstream
    const [resMat, resNorm, resSess, resMatAno, resNormAno, resSessAno] = await Promise.allSettled([
      safeFetchWithRetry(`${config.saplApiBase}/materia/materialegislativa/?page_size=1`, 5000, 1),
      safeFetchWithRetry(`${config.saplApiBase}/norma/normajuridica/?page_size=1`, 5000, 1),
      safeFetchWithRetry(`${config.saplApiBase}/sessao/sessaoplenaria/?page_size=1`, 5000, 1),
      safeFetchWithRetry(`${config.saplApiBase}/materia/materialegislativa/?ano=${anoAtual}&page_size=1`, 5000, 1),
      safeFetchWithRetry(`${config.saplApiBase}/norma/normajuridica/?ano=${anoAtual}&page_size=1`, 5000, 1),
      safeFetchWithRetry(`${config.saplApiBase}/sessao/sessaoplenaria/?data_inicio__year=${anoAtual}&page_size=1`, 5000, 1),
    ]);

    if (resMat.status === 'fulfilled' && resMat.value.ok) {
      const data = await resMat.value.json();
      totalMaterias = data.pagination?.total_entries ?? data.count ?? 0;
      fonte = 'upstream-live';
    }

    if (resNorm.status === 'fulfilled' && resNorm.value.ok) {
      const data = await resNorm.value.json();
      totalNormas = data.pagination?.total_entries ?? data.count ?? 0;
    }

    if (resSess.status === 'fulfilled' && resSess.value.ok) {
      const data = await resSess.value.json();
      totalSessoes = data.pagination?.total_entries ?? data.count ?? 0;
    }

    if (resMatAno.status === 'fulfilled' && resMatAno.value.ok) {
      const data = await resMatAno.value.json();
      materiasAnoAtual = data.pagination?.total_entries ?? data.count ?? 0;
    }

    if (resNormAno.status === 'fulfilled' && resNormAno.value.ok) {
      const data = await resNormAno.value.json();
      normasAnoAtual = data.pagination?.total_entries ?? data.count ?? 0;
    }

    if (resSessAno.status === 'fulfilled' && resSessAno.value.ok) {
      const data = await resSessAno.value.json();
      sessoesAnoAtual = data.pagination?.total_entries ?? data.count ?? 0;
    }
  } catch (err: any) {
    slog('WARN', 'stats', 'Falha ao consultar contagens ao vivo do upstream, verificando espelho local', err);
  }

  // Se o upstream falhou, usa o espelho local persistente
  if (fonte !== 'upstream-live') {
    const mirrorMat = await storage.countRecords('materia', 'materialegislativa');
    const mirrorNorm = await storage.countRecords('norma', 'normajuridica');
    const mirrorSess = await storage.countRecords('sessao', 'sessaoplenaria');

    if (mirrorMat > 0 || mirrorNorm > 0 || mirrorSess > 0) {
      totalMaterias = mirrorMat;
      totalNormas = mirrorNorm;
      totalSessoes = mirrorSess;
      fonte = 'mirror-storage';
    }
  }

  const result = {
    total_materias: totalMaterias,
    total_normas: totalNormas,
    total_sessoes: totalSessoes,
    materias_ano_atual: materiasAnoAtual,
    normas_ano_atual: normasAnoAtual,
    sessoes_ano_atual: sessoesAnoAtual,
    materias_por_tipo: [],
    normas_por_tipo: [],
    fonte,
    atualizado_em: new Date().toISOString(),
    cache_age_s: 0,
    dados_disponiveis: fonte !== 'indisponivel',
  };

  if (result.dados_disponiveis) {
    await storage.set('stats:consolidado', result, 600); // 10 min
  }

  return result;
}

/**
 * Tipos pre-seed marcados explicitamente como fallback caso o upstream esteja inacessível.
 */
export const PRESEEDED_TIPOS_MATERIAS = [
  { id: 25, sigla: 'IND', nome: 'Indicação', fallback: true },
  { id: 31, sigla: 'REQ', nome: 'Requerimento', fallback: true },
  { id: 3, sigla: 'PDL', nome: 'Projeto de Decreto Legislativo', fallback: true },
  { id: 4, sigla: 'PLC', nome: 'Projeto de Lei Complementar', fallback: true },
  { id: 5, sigla: 'PRE', nome: 'Projeto de Resolução', fallback: true },
  { id: 9, sigla: 'PLE', nome: 'Projeto de Lei do Executivo', fallback: true },
  { id: 17, sigla: 'PLL', nome: 'Projeto de Lei do Legislativo', fallback: true },
  { id: 26, sigla: 'MOP', nome: 'Moção de Pesar', fallback: true },
  { id: 28, sigla: 'MOAPL', nome: 'Moção de Aplausos', fallback: true },
  { id: 39, sigla: 'PELo', nome: 'Proposta de Emenda à Lei Orgânica', fallback: true },
];

export const PRESEEDED_TIPOS_NORMAS = [
  { id: 1, sigla: 'DL', nome: 'Decreto Legislativo', fallback: true },
  { id: 2, sigla: 'LC', nome: 'Lei Complementar', fallback: true },
  { id: 3, sigla: 'LO', nome: 'Lei Ordinária', fallback: true },
  { id: 39, sigla: 'LO', nome: 'Lei Orgânica', fallback: true },
  { id: 4, sigla: 'POR', nome: 'Portaria', fallback: true },
  { id: 6, sigla: 'RI', nome: 'Regimento Interno', fallback: true },
  { id: 5, sigla: 'RES', nome: 'Resolução', fallback: true },
];
