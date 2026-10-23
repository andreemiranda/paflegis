/**
 * lib/sync/index.ts — Motor de sincronização permanente (completa e incremental) do SAPL.
 * Percorre recursos, respeita limites de taxa ao upstream, utiliza hashing de conteúdo,
 * trava contra concorrência e suporta modo sob demanda (stale-while-revalidate).
 */

import crypto from 'crypto';
import { getConfig } from '@/lib/config';
import { getStorage } from '@/lib/storage';
import { safeFetchWithRetry, slog } from '@/lib/sapl/backend';
import { discoverCatalog, discoverCasaLegislativa } from '@/lib/sapl/discovery';

const LOCK_KEY = '__sync_job_lock__';
const LOCK_TTL_SECONDS = 60 * 15; // 15 minutos máximo de lock

export interface SyncOptions {
  type?: 'full' | 'incremental';
  modules?: string[];
  maxPagesPerResource?: number;
  delayMsBetweenRequests?: number;
}

export interface SyncResult {
  sucesso: boolean;
  tipo: 'full' | 'incremental';
  iniciadoEm: string;
  finalizadoEm: string;
  duracaoSegundos: number;
  recursosProcessados: number;
  totalRegistrosSalvos: number;
  erros: { resource: string; error: string }[];
  mensagem?: string;
}

/**
 * Adquire a trava de execução exclusiva do job de sincronização.
 */
async function acquireLock(): Promise<boolean> {
  const storage = getStorage();
  const existing = await storage.get<number>(LOCK_KEY);
  const now = Date.now();

  if (existing && existing > now) {
    return false; // Job já em andamento
  }

  await storage.set(LOCK_KEY, now + LOCK_TTL_SECONDS * 1000, LOCK_TTL_SECONDS);
  return true;
}

/**
 * Libera a trava de execução do job.
 */
async function releaseLock(): Promise<void> {
  const storage = getStorage();
  await storage.del(LOCK_KEY);
}

/**
 * Executa o job de sincronização (completa ou incremental).
 */
export async function executeSync(options: SyncOptions = {}): Promise<SyncResult> {
  const startTime = Date.now();
  const config = getConfig();
  const storage = getStorage();

  const acquired = await acquireLock();
  if (!acquired) {
    return {
      sucesso: false,
      tipo: options.type || 'incremental',
      iniciadoEm: new Date(startTime).toISOString(),
      finalizadoEm: new Date().toISOString(),
      duracaoSegundos: 0,
      recursosProcessados: 0,
      totalRegistrosSalvos: 0,
      erros: [],
      mensagem: 'Sincronização já está em execução no momento por outro processo.',
    };
  }

  const isFull = options.type === 'full';
  const delayMs = options.delayMsBetweenRequests ?? 100; // pausa amigável para não sobrecarregar o SAPL
  const maxPages = options.maxPagesPerResource ?? (isFull ? 50 : 5);

  const errors: { resource: string; error: string }[] = [];
  let totalSaved = 0;
  let resourcesProcessed = 0;

  try {
    await storage.updateSyncStatus({ inProgress: true });

    // 1. Descobre metadados da casa legislativa e catálogo
    await discoverCasaLegislativa();
    const catalog = await discoverCatalog();

    // 2. Filtra recursos conforme módulos especificados (ou todos)
    let targets = catalog.endpoints;
    if (options.modules && options.modules.length > 0) {
      targets = targets.filter((ep) => options.modules!.includes(ep.modulo));
    }

    // Ordena para priorizar matérias, normas e sessões
    targets.sort((a, b) => {
      const priority = ['materia', 'norma', 'sessao', 'parlamentares', 'comissoes'];
      const aIdx = priority.indexOf(a.modulo);
      const bIdx = priority.indexOf(b.modulo);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return 0;
    });

    const resourceCounts: Record<string, number> = {};
    const upstreamCounts: Record<string, number> = {};

    for (const ep of targets) {
      resourcesProcessed++;
      const resourceKey = `${ep.modulo}:${ep.recurso}`;
      let page = 1;
      let hasNext = true;
      let resourceSaved = 0;

      while (hasNext && page <= maxPages) {
        try {
          let url = ep.url;
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}page=${page}&page_size=20`;

          const res = await safeFetchWithRetry(url, 10000, 2);
          if (!res.ok) {
            if (res.status === 404 && page > 1) {
              // Fim da paginação
              hasNext = false;
              break;
            }
            throw new Error(`HTTP ${res.status}`);
          }

          const json = await res.json();
          const items: any[] = Array.isArray(json) ? json : json.results || [];
          const count = json.count ?? items.length;
          upstreamCounts[resourceKey] = count;

          if (items.length === 0) {
            hasNext = false;
            break;
          }

          // Grava cada registro no espelho local
          const batchToSave: { modulo: string; recurso: string; id: string | number; data: any; hash?: string }[] = [];
          for (const item of items) {
            const itemId = item.id ?? item.pk ?? item.numero ?? item.cod_materia;
            if (itemId !== undefined && itemId !== null) {
              const strContent = JSON.stringify(item);
              const hash = crypto.createHash('sha256').update(strContent).digest('hex').slice(0, 16);
              batchToSave.push({
                modulo: ep.modulo,
                recurso: ep.recurso,
                id: itemId,
                data: item,
                hash,
              });
            }
          }

          if (batchToSave.length > 0) {
            await storage.saveRecordsBatch(batchToSave);
            resourceSaved += batchToSave.length;
            totalSaved += batchToSave.length;
          }

          if (!json.next || items.length < 20) {
            hasNext = false;
          } else {
            page++;
            if (delayMs > 0) {
              await new Promise((r) => setTimeout(r, delayMs));
            }
          }
        } catch (err: any) {
          slog('WARN', 'sync', `Falha ao sincronizar recurso ${resourceKey} (página ${page}): ${err.message}`);
          errors.push({ resource: resourceKey, error: err.message });
          hasNext = false;
        }
      }

      resourceCounts[resourceKey] = await storage.countRecords(ep.modulo, ep.recurso);
    }

    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    await storage.updateSyncStatus({
      lastSyncAt: Date.now(),
      lastSyncType: isFull ? 'full' : 'incremental',
      saplBaseHash: config.saplApiBaseHash,
      totalRecords: await storage.countRecords(),
      resourceCounts,
      upstreamCounts,
      lastErrors: errors.slice(0, 20).map((e) => ({ ...e, timestamp: Date.now() })),
      inProgress: false,
    });

    slog('INFO', 'sync', `Sincronização ${isFull ? 'COMPLETA' : 'INCREMENTAL'} finalizada em ${durationSeconds}s. Registros: ${totalSaved}, Recursos: ${resourcesProcessed}`);

    return {
      sucesso: true,
      tipo: isFull ? 'full' : 'incremental',
      iniciadoEm: new Date(startTime).toISOString(),
      finalizadoEm: new Date().toISOString(),
      duracaoSegundos: durationSeconds,
      recursosProcessados: resourcesProcessed,
      totalRegistrosSalvos: totalSaved,
      erros: errors,
    };
  } finally {
    await releaseLock();
    await storage.updateSyncStatus({ inProgress: false });
  }
}
