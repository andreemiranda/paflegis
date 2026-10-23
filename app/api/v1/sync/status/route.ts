import { NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getConfig } from '@/lib/config';

export async function GET() {
  const storage = getStorage();
  const config = getConfig();

  const status = await storage.getSyncStatus();
  const totalInStorage = await storage.countRecords();

  const lastSyncIso = status.lastSyncAt ? new Date(status.lastSyncAt).toISOString() : null;
  const ageSeconds = status.lastSyncAt ? Math.round((Date.now() - status.lastSyncAt) / 1000) : null;

  return NextResponse.json({
    status: status.inProgress ? 'sincronizando' : status.lastSyncAt ? 'atualizado' : 'pendente',
    em_progresso: status.inProgress,
    ultima_sincronizacao: lastSyncIso,
    idade_segundos: ageSeconds,
    tipo_ultima_sincronizacao: status.lastSyncType,
    sapl_base_hash: status.saplBaseHash,
    total_registros_espelho: totalInStorage,
    contagem_por_recurso_espelho: status.resourceCounts,
    contagem_por_recurso_upstream: status.upstreamCounts,
    erros_recentes: status.lastErrors || [],
    fonte_configurada: {
      site_name: config.siteName,
      org_name: config.orgName,
      cidade: config.orgCity,
      uf: config.orgUf,
      sapl_api_base: config.saplApiBase,
      sapl_public_domain: config.saplPublicDomain,
    },
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
