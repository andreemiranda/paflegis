export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import {
  checkSaplHealth,
  SAPL_API_BASE,
  SAPL_PUBLIC_DOMAIN,
  SAPL_ORIGIN_IP,
} from '@/lib/sapl/backend';
import { getAuthDiagnostics } from '@/lib/auth/apiKeyAuth';

export async function GET() {
  const { reachable, latencyMs } = await checkSaplHealth();
  const auth = getAuthDiagnostics();

  return NextResponse.json({
    status: reachable ? 'ok' : 'degraded',
    sapl: reachable ? 'reachable' : 'unreachable',
    sapl_latency_ms: latencyMs,
    sapl_endpoint: SAPL_API_BASE,
    sapl_public_domain: SAPL_PUBLIC_DOMAIN,
    sapl_origin_ip_sanitized: SAPL_ORIGIN_IP,
    ip_replacement_active: true,
    auth: {
      apiKeysConfigured: auth.apiKeysConfigured,
      strategy: auth.strategy,
      status: 'synchronized',
    },
    env: process.env.NODE_ENV || 'production',
    time: new Date().toISOString(),
  });
}
