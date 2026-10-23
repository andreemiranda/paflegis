import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getConfig } from '@/lib/config';
import { discoverCatalog } from '@/lib/sapl/discovery';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const format = searchParams.get('format') || searchParams.get('modo') || '';
  const moduleFilter = searchParams.get('modulo') || searchParams.get('module') || '';

  const config = getConfig();
  const catalog = await discoverCatalog();

  // Formato dicionário bruto chave => url
  if (format === 'raw' || format === 'map') {
    return NextResponse.json(catalog.endpointsMap);
  }

  // Formato template
  if (format === 'template' || format === 'snippet') {
    const templateMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(catalog.endpointsMap)) {
      templateMap[k] = v.replace(config.saplPublicDomain, '[DOMINIO_PUBLICO]');
    }
    return NextResponse.json(templateMap);
  }

  // Filtragem opcional por módulo
  const filteredEndpoints = moduleFilter
    ? catalog.endpoints.filter((it) => it.modulo.toLowerCase() === moduleFilter.toLowerCase())
    : catalog.endpoints;

  return NextResponse.json({
    total_endpoints: catalog.total,
    retornados: filteredEndpoints.length,
    fonte: catalog.fonte,
    configuracao: {
      site_name: config.siteName,
      org_name: config.orgName,
      sapl_api_base: config.saplApiBase,
      sapl_public_domain: config.saplPublicDomain,
      substituicao_ip_ativa: true,
    },
    modulos: catalog.modulos,
    endpoints_map: catalog.endpointsMap,
    endpoints: filteredEndpoints.map((ep) => ({
      key: ep.key,
      url: ep.url,
      path: ep.path,
      module: ep.modulo,
      module_title: ep.modulo_titulo,
    })),
  });
}
