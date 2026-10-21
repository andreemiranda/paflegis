import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  SAPL_PUBLIC_DOMAIN,
  SAPL_ORIGIN_IP,
  safeFetchWithRetry,
  replaceIpWithDomain,
  sanitizeSaplData,
} from '@/lib/sapl/backend';
import {
  ALL_129_SAPL_ENDPOINT_KEYS,
  MODULE_NAMES,
  buildResolvedEndpointsMap,
  buildTemplateEndpointsMap,
} from '@/lib/sapl/endpointsData';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const format = searchParams.get('format') || searchParams.get('modo') || '';
  const moduleFilter = searchParams.get('modulo') || searchParams.get('module') || '';

  let liveEndpointsMap: Record<string, string> = {};
  let isLive = false;

  try {
    const res = await safeFetchWithRetry(`${SAPL_API_BASE}/`, 8000, 1);
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        for (const [key, rawUrl] of Object.entries(data)) {
          if (typeof rawUrl === 'string') {
            liveEndpointsMap[key] = replaceIpWithDomain(rawUrl);
          }
        }
        isLive = true;
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[SAPL ENDPOINTS] Upstream não respondeu a tempo, usando catálogo resiliente:', msg);
  }

  // Fallback garantido para todos os 129 endpoints
  if (Object.keys(liveEndpointsMap).length === 0) {
    liveEndpointsMap = buildResolvedEndpointsMap(SAPL_API_BASE);
  } else {
    // Garante que qualquer endpoint ausente no upstream seja completado
    for (const key of ALL_129_SAPL_ENDPOINT_KEYS) {
      if (!liveEndpointsMap[key]) {
        liveEndpointsMap[key] = `${SAPL_API_BASE}/${key}/`;
      }
    }
  }

  // Se o usuário solicitou explicitamente o formato de template com a variável configurada
  if (format === 'template' || format === 'snippet') {
    const templateMap = buildTemplateEndpointsMap('[NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]');
    return NextResponse.json(templateMap);
  }

  // Se solicitou apenas o dicionário bruto chave => url
  if (format === 'raw' || format === 'map') {
    return NextResponse.json(liveEndpointsMap);
  }

  // Montagem do catálogo enriquecido por módulos
  const items = Object.entries(liveEndpointsMap).map(([key, url]) => {
    const slashIdx = key.indexOf('/');
    const moduleKey = slashIdx !== -1 ? key.substring(0, slashIdx) : key;
    return {
      key,
      url,
      path: url.replace(SAPL_PUBLIC_DOMAIN, ''),
      module: moduleKey,
      module_title: MODULE_NAMES[moduleKey] || moduleKey,
    };
  });

  const filteredItems = moduleFilter
    ? items.filter((it) => it.module.toLowerCase() === moduleFilter.toLowerCase())
    : items;

  return NextResponse.json({
    total_endpoints: items.length,
    retornados: filteredItems.length,
    fonte: isLive ? 'sapl-live-upstream' : 'sapl-resilient-catalog',
    configuracao: {
      sapl_api_base: SAPL_API_BASE,
      sapl_public_domain: SAPL_PUBLIC_DOMAIN,
      sapl_origin_ip_sanitized: SAPL_ORIGIN_IP,
      substituicao_ip_ativa: true,
    },
    modulos: Object.keys(MODULE_NAMES).map((mod) => ({
      id: mod,
      titulo: MODULE_NAMES[mod],
      total: items.filter((it) => it.module === mod).length,
    })),
    endpoints_map: liveEndpointsMap,
    endpoints: filteredItems,
  });
}
