import { NextResponse } from 'next/server';
import { checkSaplHealth } from '@/lib/sapl/backend';
import { getGeminiApiKey } from '@/lib/gemini/client';
import { getAuthDiagnostics } from '@/lib/auth/apiKeyAuth';

export async function GET() {
  const { reachable, latencyMs } = await checkSaplHealth();
  const auth = getAuthDiagnostics();

  return NextResponse.json({
    status: reachable ? 'ok' : 'degraded',
    sapl: reachable ? 'reachable' : 'unreachable',
    sapl_latency_ms: latencyMs,
    gemini: getGeminiApiKey() ? 'configured' : 'not_configured',
    auth: {
      apiKeysConfigured: auth.apiKeysConfigured,
      strategy: auth.strategy,
      status: 'synchronized',
    },
    env: process.env.NODE_ENV || 'production',
    time: new Date().toISOString(),
  });
}
