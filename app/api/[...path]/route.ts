import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getConfig, resolveRequestOrigin } from '@/lib/config';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';
import { checkRateLimit, applyRateLimitHeaders } from '@/lib/rateLimiter';
import { safeFetchWithRetry, slog } from '@/lib/sapl/backend';
import { sanitizeAndRewriteResponse } from '@/lib/sanitization';
import { getStorage } from '@/lib/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const config = getConfig();
  const appOrigin = resolveRequestOrigin(req.headers);

  // 1. Validação de Autenticação (Chave de API ou Sessão Segura)
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { erro: auth.reason || 'Acesso não autorizado.' },
      { status: auth.statusCode || 401 }
    );
  }

  // 2. Rate Limiting por IP ou Chave
  const rl = checkRateLimit(req, 120, 60 * 1000);
  const responseHeaders = new Headers();
  applyRateLimitHeaders(responseHeaders, rl);

  // Cabeçalhos CORS seguros
  const originHeader = req.headers.get('origin');
  if (originHeader && (config.corsAllowedOrigins.includes(originHeader) || originHeader === appOrigin)) {
    responseHeaders.set('Access-Control-Allow-Origin', originHeader);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  }

  if (!rl.allowed) {
    return NextResponse.json(
      { erro: 'Limite de requisições da API atingido. Por favor, aguarde.' },
      { status: 429, headers: responseHeaders }
    );
  }

  // 3. Monta o caminho e query string do recurso upstream (removendo chaves de autenticação internas)
  const relativePath = segments.join('/');
  const searchParams = req.nextUrl.searchParams;
  const upstreamParams = new URLSearchParams(searchParams);
  upstreamParams.delete('API_KEYS');
  upstreamParams.delete('api_keys');
  upstreamParams.delete('API_KEY');
  upstreamParams.delete('api_key');
  upstreamParams.delete('x-api-key');
  upstreamParams.delete('key');
  const queryString = upstreamParams.toString() ? `?${upstreamParams.toString()}` : '';

  // Determina modulo e recurso (ex: modulo='materia', recurso='materialegislativa', id='123')
  const modulo = segments[0] || '';
  const recurso = segments[1] || '';
  const recordId = segments[2];

  const upstreamUrl = `${config.saplApiBase}/${relativePath}/${queryString}`.replace(/\/{2,}\?/g, '/?');

  const storage = getStorage();

  // 4. Tenta buscar no upstream oficial com timeout e resiliência
  try {
    const upstreamRes = await safeFetchWithRetry(upstreamUrl, 8000, 1);

    if (upstreamRes.ok) {
      const rawData = await upstreamRes.json();

      // Salva no espelho local de forma assíncrona para resiliência contínua
      try {
        if (recordId && !isNaN(Number(recordId))) {
          storage.saveRecord(modulo, recurso, recordId, rawData).catch(() => {});
        } else if (rawData.results && Array.isArray(rawData.results)) {
          const batch = rawData.results
            .filter((item: any) => item.id !== undefined)
            .map((item: any) => ({
              modulo,
              recurso,
              id: item.id,
              data: item,
            }));
          if (batch.length > 0) {
            storage.saveRecordsBatch(batch).catch(() => {});
          }
        }
      } catch {}

      // Reescreve todas as URLs para o domínio do próprio aplicativo e mascara dados LGPD
      const rewrittenData = sanitizeAndRewriteResponse(rawData, appOrigin);

      responseHeaders.set('Content-Type', 'application/json; charset=utf-8');
      responseHeaders.set('X-Data-Source', 'upstream-live');
      responseHeaders.set('X-Last-Sync', new Date().toISOString());

      return NextResponse.json(rewrittenData, {
        status: 200,
        headers: responseHeaders,
      });
    }

    if (upstreamRes.status === 404) {
      return NextResponse.json(
        { erro: 'Recurso ou documento não encontrado na API do SAPL.' },
        { status: 404, headers: responseHeaders }
      );
    }
  } catch (err: any) {
    slog('WARN', 'api-mirror', `Falha ao consultar upstream (${upstreamUrl}): ${err.message}. Buscando no espelho local.`);
  }

  // 5. Fallback Resiliente: Servir do Espelho Local se o upstream estiver fora do ar
  try {
    const syncStatus = await storage.getSyncStatus();
    const lastSyncDate = syncStatus.lastSyncAt ? new Date(syncStatus.lastSyncAt).toISOString() : new Date().toISOString();

    responseHeaders.set('X-Data-Source', 'mirror');
    responseHeaders.set('X-Last-Sync', lastSyncDate);

    // Caso 1: Detalhe de um registro por ID
    if (recordId) {
      const localRecord = await storage.getRecord<any>(modulo, recurso, recordId);
      if (localRecord) {
        const rewritten = sanitizeAndRewriteResponse(localRecord, appOrigin);
        return NextResponse.json(rewritten, { status: 200, headers: responseHeaders });
      }
    }

    // Caso 2: Listagem com filtros e paginação
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('page_size') || '20', 10);
    const search = searchParams.get('search') || undefined;

    const listResult = await storage.listRecords(modulo, recurso, {
      page,
      limit: pageSize,
      search,
    });

    if (listResult.total > 0 || listResult.items.length > 0) {
      const rewrittenItems = sanitizeAndRewriteResponse(listResult.items, appOrigin);
      const totalPages = Math.ceil(listResult.total / pageSize);

      const nextUrl = page < totalPages ? `${appOrigin}/api/${relativePath}/?page=${page + 1}&page_size=${pageSize}` : null;
      const prevUrl = page > 1 ? `${appOrigin}/api/${relativePath}/?page=${page - 1}&page_size=${pageSize}` : null;

      return NextResponse.json({
        count: listResult.total,
        next: nextUrl,
        previous: prevUrl,
        results: rewrittenItems,
        _fonte: 'espelho-local-resiliente',
      }, { status: 200, headers: responseHeaders });
    }
  } catch (mirrorErr: any) {
    slog('ERROR', 'api-mirror', 'Erro ao acessar espelho local', mirrorErr);
  }

  return NextResponse.json(
    { erro: 'O serviço de dados do SAPL está temporariamente instável e o registro ainda não foi espelhado localmente.' },
    { status: 503, headers: responseHeaders }
  );
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const getRes = await GET(req, ctx);
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set('Allow', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-API-KEY');
  return new NextResponse(null, { status: 204, headers });
}

// Métodos de escrita rejeitados estritamente com 405 Method Not Allowed (API somente leitura)
export async function POST() {
  return NextResponse.json(
    { erro: 'Método não permitido. A API espelhada do SAPL é estritamente somente leitura (somente GET).' },
    { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { erro: 'Método não permitido. A API espelhada do SAPL é estritamente somente leitura.' },
    { status: 405, headers: { Allow: 'GET, HEAD, OPTIONS' } }
  );
}

export async function PATCH() {
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
