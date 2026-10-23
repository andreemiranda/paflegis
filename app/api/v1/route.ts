import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { getConfig, resolveRequestOrigin } from '@/lib/config';
import { validateApiRequest, maskApiKey } from '@/lib/auth/apiKeyAuth';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';

export async function GET(req: NextRequest) {
  const config = getConfig();
  const appOrigin = resolveRequestOrigin(req.headers);

  // 1. Validação de Autenticação via Query String (?API_KEYS=<chave>), cabeçalho ou sessão
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      {
        status: 'erro',
        codigo: auth.statusCode || 401,
        erro: auth.reason || 'Acesso não autorizado à API v1.',
        mensagem: 'Para acessar a API v1, forneça sua chave via query string (?API_KEYS=<sua_chave>) ou pelo cabeçalho x-api-key / Authorization: Bearer.',
        dica: 'Exemplo: /api/v1/?API_KEYS=sk_1724ebeae5b8b48215cf762ca8bb2a0c',
      },
      { status: auth.statusCode || 401 }
    );
  }

  // 2. Rate Limiting
  const rl = checkRateLimit(req, 120, 60 * 1000);
  const responseHeaders = new Headers();
  applyRateLimitHeaders(responseHeaders, rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { erro: 'Limite de requisições por minuto atingido. Aguarde antes de realizar novas consultas.' },
      { status: 429, headers: responseHeaders }
    );
  }

  // 3. Informações da chave utilizada
  const queryKey =
    req.nextUrl.searchParams.get('API_KEYS') ||
    req.nextUrl.searchParams.get('api_keys') ||
    req.nextUrl.searchParams.get('API_KEY') ||
    req.nextUrl.searchParams.get('api_key') ||
    req.nextUrl.searchParams.get('x-api-key') ||
    req.nextUrl.searchParams.get('key') ||
    '';

  const keyParam = queryKey ? `?API_KEYS=${encodeURIComponent(queryKey)}` : '';

  responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
  responseHeaders.set('Cache-Control', 'no-store, max-age=0');

  return NextResponse.json(
    {
      status: 'ok',
      versao: 'v1',
      api: `${config.siteName} — API REST v1`,
      descricao:
        'Ponto de entrada raiz da API v1 do Paflegis. Consulta estruturada, dados abertos e transparência do processo legislativo municipal.',
      autenticacao: {
        autorizado: true,
        metodo: auth.viaQuery ? 'query_string' : 'cabecalho_http',
        parametro_utilizado: auth.viaQuery ? 'API_KEYS' : undefined,
        chave_identificada: auth.keyName || (auth.keyReceived ? maskApiKey(auth.keyReceived) : undefined),
        modo: config.apiAccessMode,
      },
      casa_legislativa: {
        nome: config.orgName,
        sigla: config.orgAcronym,
        municipio: config.orgCity,
        uf: config.orgUf,
        sapl_oficial: config.saplPublicDomain,
      },
      rotas_disponiveis: {
        endpoints: '/api/v1/endpoints',
        materias: '/api/v1/materias',
        normas: '/api/v1/normas',
        sessoes: '/api/v1/sessoes',
        parlamentares: '/api/parlamentares/parlamentar/',
        comissoes: '/api/comissoes/comissao/',
        audiencias: '/api/audiencia/audienciapublica/',
        estatisticas: '/api/v1/estatisticas',
        tipos_materias: '/api/v1/tipos/materias',
        tipos_documentos: '/api/v1/tipos/documentos',
        tipos_normas: '/api/v1/tipos/normas',
        health: '/api/v1/health',
        sync_status: '/api/v1/sync/status',
        openapi_spec: '/api/v1/openapi.json',
        documentacao: '/api-docs',
      },
      exemplos_consulta: {
        materias_busca: '/api/v1/materias?busca=educacao',
        normas_ano: '/api/v1/normas?ano=2024',
        sessoes_ano: '/api/v1/sessoes?ano=2024',
        parlamentares_busca: '/api/parlamentares/parlamentar/',
        comissoes_busca: '/api/comissoes/comissao/',
        especificacao_openapi: '/api/v1/openapi.json',
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: responseHeaders,
    }
  );
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
