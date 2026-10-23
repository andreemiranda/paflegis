export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { checkSaplHealth } from '@/lib/sapl/backend';
import { getAuthDiagnostics } from '@/lib/auth/apiKeyAuth';
import { getConfig } from '@/lib/config';
import { getStorage } from '@/lib/storage';

export async function GET() {
  try {
    const config = getConfig();
    const { reachable, latencyMs } = await checkSaplHealth();
    const auth = getAuthDiagnostics();
    const storage = getStorage();
    const syncStatus = await storage.getSyncStatus();

    return NextResponse.json({
      status: reachable ? 'ok' : 'degraded',
      sapl: reachable ? 'reachable' : 'unreachable',
      sapl_latency_ms: latencyMs,
      sapl_endpoint: config.saplApiBase,
      sapl_public_domain: config.saplPublicDomain,
      ip_replacement_active: true,
      auth: {
        strategy: auth.strategy,
        mode: auth.mode,
        configured: auth.authConfigured,
      },
      sync: {
        ultima_sincronizacao: syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toISOString() : null,
        em_progresso: syncStatus.inProgress,
        total_espelho: syncStatus.totalRecords,
      },
      time: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[/api/v1/health] Error:', error);
    return NextResponse.json({
      status: 'error',
      message: error?.message || String(error),
      stack: error?.stack,
    }, { status: 500 });
  }
}
