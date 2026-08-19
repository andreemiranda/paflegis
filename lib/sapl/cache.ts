/**
 * lib/sapl/cache.ts — Gerenciador de cache resiliente em memória e /tmp.
 */

import fs from 'fs';
import path from 'path';
import { slog } from './backend';

const GLOBAL_CACHE_KEY = '__PAFLEGIS_FALLBACK_CACHE__';

if (!(globalThis as any)[GLOBAL_CACHE_KEY]) {
  (globalThis as any)[GLOBAL_CACHE_KEY] = new Map<string, { data: unknown; fetchedAt: number }>();
}

const memoryCacheStore: Map<string, { data: unknown; fetchedAt: number }> = (globalThis as any)[GLOBAL_CACHE_KEY];
const TMP_CACHE_DIR = '/tmp/paflegis_cache';

export function setPersistentCache(key: string, data: unknown): void {
  const now = Date.now();
  memoryCacheStore.set(key, { data, fetchedAt: now });

  if (key.startsWith('materias:')) memoryCacheStore.set('materias:last_good', { data, fetchedAt: now });
  if (key.startsWith('normas:'))   memoryCacheStore.set('normas:last_good',   { data, fetchedAt: now });
  if (key.startsWith('sessoes:'))  memoryCacheStore.set('sessoes:last_good',  { data, fetchedAt: now });

  try {
    if (!fs.existsSync(TMP_CACHE_DIR)) {
      fs.mkdirSync(TMP_CACHE_DIR, { recursive: true });
    }
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
    const filePath = path.join(TMP_CACHE_DIR, `${safeKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ key, data, fetchedAt: now }), 'utf8');
  } catch (e) {
    slog('WARN', 'fallback-cache', `Não foi possível gravar cache em /tmp para ${key}`, e);
  }
}

export function getPersistentCache<T>(key: string): { data: T; fetchedAt: number; source: string } | null {
  // 1. Tenta memória da instância
  const mem = memoryCacheStore.get(key);
  if (mem) {
    return { data: mem.data as T, fetchedAt: mem.fetchedAt, source: 'memory-fallback' };
  }

  // 2. Última resposta geral válida
  if (key.startsWith('materias:')) {
    const lg = memoryCacheStore.get('materias:last_good');
    if (lg) return { data: lg.data as T, fetchedAt: lg.fetchedAt, source: 'memory-last-good-fallback' };
  }
  if (key.startsWith('normas:')) {
    const lg = memoryCacheStore.get('normas:last_good');
    if (lg) return { data: lg.data as T, fetchedAt: lg.fetchedAt, source: 'memory-last-good-fallback' };
  }
  if (key.startsWith('sessoes:')) {
    const lg = memoryCacheStore.get('sessoes:last_good');
    if (lg) return { data: lg.data as T, fetchedAt: lg.fetchedAt, source: 'memory-last-good-fallback' };
  }

  // 3. Disco /tmp
  try {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
    const filePath = path.join(TMP_CACHE_DIR, `${safeKey}.json`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data) {
        memoryCacheStore.set(key, { data: parsed.data, fetchedAt: parsed.fetchedAt || Date.now() });
        return { data: parsed.data as T, fetchedAt: parsed.fetchedAt || Date.now(), source: 'tmp-disk-fallback' };
      }
    }
  } catch (e) {
    slog('WARN', 'fallback-cache', `Falha ao ler cache em /tmp para ${key}`, e);
  }

  return null;
}

export const PRESEEDED_TIPOS_MATERIAS = [
  { id: 1, sigla: 'PLO', nome: 'Projeto de Lei Ordinária' },
  { id: 2, sigla: 'PLC', nome: 'Projeto de Lei Complementar' },
  { id: 3, sigla: 'REQ', nome: 'Requerimento' },
  { id: 4, sigla: 'IND', nome: 'Indicação' },
  { id: 5, sigla: 'MOC', nome: 'Moção' },
  { id: 6, sigla: 'PDC', nome: 'Projeto de Decreto Legislativo' },
  { id: 7, sigla: 'PRE', nome: 'Projeto de Resolução' },
  { id: 8, sigla: 'PELO', nome: 'Proposta de Emenda à Lei Orgânica' },
];

export const PRESEEDED_TIPOS_NORMAS = [
  { id: 1, sigla: 'LO', nome: 'Lei Ordinária' },
  { id: 2, sigla: 'LC', nome: 'Lei Complementar' },
  { id: 3, sigla: 'DL', nome: 'Decreto Legislativo' },
  { id: 4, sigla: 'RES', nome: 'Resolução' },
  { id: 5, sigla: 'LOM', nome: 'Lei Orgânica Municipal' },
];

export const PRESEEDED_ESTATISTICAS = {
  total_materias: 1420,
  total_normas: 980,
  total_sessoes: 420,
  materias_ano_atual: 45,
  normas_ano_atual: 22,
  sessoes_ano_atual: 12,
  materias_por_tipo: [
    { tipo: 'Projeto de Lei Ordinária', quantidade: 28 },
    { tipo: 'Requerimento', quantidade: 12 },
    { tipo: 'Indicação', quantidade: 5 },
  ],
  normas_por_tipo: [
    { tipo: 'Lei Ordinária', quantidade: 18 },
    { tipo: 'Decreto Legislativo', quantidade: 4 },
  ],
  fonte: 'pre-seeded-fallback',
  atualizado_em: new Date().toISOString(),
  cache_age_s: 0,
};

export function getNextProtocolNumber(): number {
  const PROTOCOL_KEY = 'contato:protocolo_counter';
  let mem = memoryCacheStore.get(PROTOCOL_KEY);
  let count = 0;
  
  if (mem) {
    count = mem.data as number;
  } else {
    try {
      const safeKey = PROTOCOL_KEY.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
      const filePath = path.join(TMP_CACHE_DIR, `${safeKey}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.data === 'number') {
          count = parsed.data;
        }
      }
    } catch {
      // ignore
    }
  }

  count += 1;
  memoryCacheStore.set(PROTOCOL_KEY, { data: count, fetchedAt: Date.now() });

  try {
    if (!fs.existsSync(TMP_CACHE_DIR)) {
      fs.mkdirSync(TMP_CACHE_DIR, { recursive: true });
    }
    const safeKey = PROTOCOL_KEY.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
    const filePath = path.join(TMP_CACHE_DIR, `${safeKey}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ key: PROTOCOL_KEY, data: count, fetchedAt: Date.now() }), 'utf8');
  } catch {
    // ignore
  }

  return count;
}
