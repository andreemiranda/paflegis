import { NextResponse } from 'next/server';
import { checkSaplHealth, SAPL_API_BASE } from '@/lib/sapl/backend';

export async function GET() {
  const { reachable, latencyMs } = await checkSaplHealth();

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    status: reachable ? 'healthy' : 'degraded',
    checks: {
      sapl_api: {
        status: reachable ? 'pass' : 'fail',
        latency_ms: latencyMs,
        endpoint: SAPL_API_BASE,
      },
      sitemap: {
        status: 'pass',
        url: '/sitemap.xml',
      },
      robots: {
        status: 'pass',
        url: '/robots.txt',
      },
      structured_data: {
        status: 'pass',
        type: 'CivicStructure / GovernmentOrganization / Legislation',
      },
    },
  });
}
