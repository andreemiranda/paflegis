import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getConfig, resolveRequestOrigin } from '@/lib/config';
import { validateApiRequest, extractApiKey } from '@/lib/auth/apiKeyAuth';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import { discoverCatalog, discoverCasaLegislativa } from '@/lib/sapl/discovery';

/**
 * GET /api e GET /api/
 * Ponto de entrada raiz nativo e idêntico à API de entrada do SAPL.
 * Retorna o mapa completo de todos os endpoints suportados (120+ recursos),
 * com reescrita automática para o domínio atual do aplicativo e devidamente protegido.
 */
export async function GET(req: NextRequest) {
  const config = getConfig();
  const appOrigin = resolveRequestOrigin(req.headers);

  // 1. Validação de Autenticação via API Key (definida em API_KEYS_PERMITIDAS ou no .env)
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        status: 'erro',
        codigo: auth.statusCode || 401,
        erro: auth.reason || 'Acesso não autorizado à API nativa do SAPL.',
        mensagem:
          'Esta API é protegida e exige autenticação. Forneça sua chave via query string (?API_KEYS=<chave>) ou cabeçalho x-api-key / Authorization: Bearer.',
        dica: 'Exemplo: /api?API_KEYS=sk_1724ebeae5b8b48215cf762ca8bb2a0c',
        documentacao: '/api-docs',
      },
      { status: auth.statusCode || 401 }
    );
  }

  // 2. Rate Limiting por IP ou Chave
  const rl = checkRateLimit(req, 120, 60 * 1000);
  const responseHeaders = new Headers();
  applyRateLimitHeaders(responseHeaders, rl);

  // Cabeçalhos CORS
  const originHeader = req.headers.get('origin');
  if (originHeader && (config.corsAllowedOrigins.includes(originHeader) || originHeader === appOrigin)) {
    responseHeaders.set('Access-Control-Allow-Origin', originHeader);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  if (!rl.allowed) {
    return NextResponse.json(
      { erro: 'Limite de requisições por minuto atingido. Aguarde antes de realizar novas consultas.' },
      { status: 429, headers: responseHeaders }
    );
  }

  // 3. Descoberta dinâmica do catálogo de endpoints a partir do SAPL upstream configurado
  const catalog = await discoverCatalog();
  const casa = await discoverCasaLegislativa();

  // Verifica se o usuário forneceu a chave via query string (?API_KEYS=...)
  const { key: queryKey, source } = extractApiKey(req);
  const keyQuerySuffix =
    source === 'query' && queryKey
      ? `?API_KEYS=${encodeURIComponent(queryKey)}`
      : '';

  // 4. Constrói o dicionário idêntico ao retornado na raiz do SAPL oficial
  // Mapeia cada chave para a URL pública deste app ({appOrigin}/api/{path}/)
  const rootEndpointsMap: Record<string, string> = {};
  for (const ep of catalog.endpoints) {
    const cleanPath = ep.path.replace(/^\/api\/?/, '').replace(/\/+$/, '');
    const url = `${appOrigin}/api/${cleanPath}/${keyQuerySuffix}`;
    rootEndpointsMap[ep.key] = url;
  }

  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'no-store, max-age=0');
  responseHeaders.set('X-Data-Source', catalog.fonte);
  responseHeaders.set('X-Total-Endpoints', String(catalog.total));

  // Formato estendido opcional caso solicitado com ?format=full ou ?meta=true
  const format = req.nextUrl.searchParams.get('format');
  const wantsMeta = req.nextUrl.searchParams.get('meta') === 'true';

  if (format === 'full' || wantsMeta) {
    return NextResponse.json(
      {
        api: `${config.siteName} — API Nativa SAPL`,
        descricao:
          'API nativa espelhada e protegida com total paridade de endpoints do Sistema de Apoio ao Processo Legislativo (SAPL).',
        dominio_atual: appOrigin,
        sapl_upstream: config.saplApiBase,
        casa_legislativa: {
          nome: casa?.nome || config.orgName,
          sigla: casa?.sigla || config.orgAcronym,
          municipio: casa?.municipio || config.orgCity,
          uf: casa?.uf || config.orgUf,
        },
        autenticacao: {
          modo: config.apiAccessMode,
          autorizado: true,
          metodo: auth.viaQuery ? 'query_string (?API_KEYS)' : 'cabecalho_http',
        },
        total_endpoints: catalog.total,
        modulos: catalog.modulos,
        endpoints: rootEndpointsMap,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: responseHeaders }
    );
  }

  // Por padrão: formato idêntico ao original do SAPL (dicionário chave -> URL do endpoint)
  return NextResponse.json(rootEndpointsMap, {
    status: 200,
    headers: responseHeaders,
  });
}

export async function HEAD(req: NextRequest) {
  const getRes = await GET(req);
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Allow', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key, X-API-KEY, x-api-keys, X-API-KEYS'
  );
  return new NextResponse(null, { status: 204, headers });
}

export async function POST() {
  return NextResponse.json(
    { erro: 'Método não permitido. A API espelhada do SAPL é estritamente somente leitura.' },
    { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { erro: 'Método não permitido. A API espelhada do SAPL é estritamente somente leitura.' },
    { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { erro: 'Método não permitido. A API espelhada do SAPL é estritamente somente leitura.' },
    { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } }
  );
}
