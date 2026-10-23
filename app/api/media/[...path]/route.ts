import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getConfig } from '@/lib/config';
import { checkRateLimitAsync, applyRateLimitHeaders } from '@/lib/rateLimiter';
import { slog } from '@/lib/sapl/backend';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const config = getConfig();

  // 1. Rate Limiting estrito para mídia
  const rl = await checkRateLimitAsync(req, 80, 60 * 1000);
  const headers = new Headers();
  applyRateLimitHeaders(headers, rl);

  if (!rl.allowed) {
    return new NextResponse('Limite de requisições de mídia excedido. Tente novamente em instantes.', {
      status: 429,
      headers,
    });
  }

  // 2. Proteção contra Path Traversal e SSRF
  const relativePath = pathSegments.join('/');
  if (relativePath.includes('..') || relativePath.startsWith('/')) {
    return new NextResponse('Caminho inválido.', { status: 400 });
  }

  // 3. Monta a URL do upstream exclusivamente no domínio público configurado
  const upstreamUrl = `${config.saplPublicDomain}/media/${relativePath}`;

  // Verifica cache local se MIRROR_MEDIA estiver ativo
  const localCacheDir = path.resolve(process.cwd(), config.storagePath, 'media_cache');
  const localCacheFile = path.join(localCacheDir, relativePath);

  // Repasse de cabeçalhos de streaming e cache
  const reqHeaders: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  const rangeHeader = req.headers.get('range');
  if (rangeHeader) reqHeaders['Range'] = rangeHeader;
  const ifNoneMatch = req.headers.get('if-none-match');
  if (ifNoneMatch) reqHeaders['If-None-Match'] = ifNoneMatch;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers: reqHeaders,
      cache: 'no-store',
      signal: AbortSignal.timeout(20000), // 20s
    });

    if (upstreamRes.status === 304) {
      return new NextResponse(null, { status: 304, headers });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      // Se upstream falhou e temos cache local
      if (fs.existsSync(localCacheFile)) {
        slog('INFO', 'media', `Servindo mídia do espelho local: ${relativePath}`);
        const stat = fs.statSync(localCacheFile);
        const fileStream = fs.createReadStream(localCacheFile);
        // @ts-ignore
        return new NextResponse(fileStream as any, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Length': String(stat.size),
            'X-Data-Source': 'mirror',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }

      return new NextResponse('Arquivo de mídia não encontrado no upstream.', {
        status: upstreamRes.status,
      });
    }

    // Copia cabeçalhos essenciais de streaming
    const resHeaders = new Headers();
    const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const contentLength = upstreamRes.headers.get('content-length');
    const contentDisposition = upstreamRes.headers.get('content-disposition') || `inline; filename="${pathSegments[pathSegments.length - 1] || 'documento'}"`;
    const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';
    const contentRange = upstreamRes.headers.get('content-range');
    const etag = upstreamRes.headers.get('etag');

    resHeaders.set('Content-Type', contentType);
    if (contentLength) resHeaders.set('Content-Length', contentLength);
    resHeaders.set('Content-Disposition', contentDisposition);
    resHeaders.set('Accept-Ranges', acceptRanges);
    if (contentRange) resHeaders.set('Content-Range', contentRange);
    if (etag) resHeaders.set('ETag', etag);
    resHeaders.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    resHeaders.set('X-Content-Type-Options', 'nosniff');
    resHeaders.set('X-Data-Source', 'upstream-live');

    // Salva em disco em background se MIRROR_MEDIA=true
    if (config.mirrorMedia && upstreamRes.status === 200 && upstreamRes.body) {
      try {
        const cloned = upstreamRes.clone();
        cloned.arrayBuffer().then((buf) => {
          if (buf.byteLength <= config.maxMediaBytes) {
            fs.mkdirSync(path.dirname(localCacheFile), { recursive: true });
            fs.writeFileSync(localCacheFile, Buffer.from(buf));
          }
        }).catch(() => {});
      } catch {}
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      headers: resHeaders,
    });
  } catch (err: any) {
    slog('WARN', 'media', `Erro ao buscar mídia do upstream (${upstreamUrl}): ${err.message}`);

    // Fallback para cache em disco caso exista
    if (fs.existsSync(localCacheFile)) {
      const stat = fs.statSync(localCacheFile);
      const fileStream = fs.createReadStream(localCacheFile);
      // @ts-ignore
      return new NextResponse(fileStream as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(stat.size),
          'X-Data-Source': 'mirror',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return new NextResponse('Falha de conexão com o servidor de mídia do SAPL.', { status: 502 });
  }
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const getRes = await GET(req, ctx);
  return new NextResponse(null, {
    status: getRes.status,
    headers: getRes.headers,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    },
  });
}

// Qualquer outro método é rejeitado com 405 Method Not Allowed
export async function POST() {
  return new NextResponse('Método não permitido em endpoints de mídia (somente leitura).', { status: 405 });
}
export async function PUT() {
  return new NextResponse('Método não permitido em endpoints de mídia (somente leitura).', { status: 405 });
}
export async function DELETE() {
  return new NextResponse('Método não permitido em endpoints de mídia (somente leitura).', { status: 405 });
}
export async function PATCH() {
  return new NextResponse('Método não permitido em endpoints de mídia (somente leitura).', { status: 405 });
}
