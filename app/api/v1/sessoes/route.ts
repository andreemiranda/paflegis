import { NextRequest, NextResponse } from 'next/server';
import {
  SAPL_API_BASE,
  normalizeUrl,
  dateBR,
  brToTs,
  safeFetchWithRetry,
  slog,
} from '@/lib/sapl/backend';
import { setPersistentCache, getPersistentCache } from '@/lib/sapl/cache';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(req: NextRequest) {
  const rl = checkRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Limite de requisições excedido.', code: 'TOO_MANY_REQUESTS' },
      { status: 429 }
    );
  }

  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason, code: 'UNAUTHORIZED_API_KEY' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const busca = searchParams.get('busca') || searchParams.get('pesquisa') || '';
  const tipo = searchParams.get('tipo') || '';
  const ano = searchParams.get('ano') || '';
  const pageNum = Number(searchParams.get('pagina') || searchParams.get('page') || 1);
  const limitNum = Number(searchParams.get('limite') || searchParams.get('limit') || searchParams.get('page_size') || 10);
  const startMs = Date.now();

  const url = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
  if (busca) url.searchParams.set('pesquisa', busca);
  if (tipo) url.searchParams.set('tipo', tipo);
  if (ano) {
    url.searchParams.set('data_inicio_0', `${ano}-01-01`);
    url.searchParams.set('data_inicio_1', `${ano}-12-31`);
  }
  url.searchParams.set('page', String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  const cacheKey = `sessoes:${url.toString()}`;

  try {
    const r = await safeFetchWithRetry(url.toString(), 4000, 1);
    if (r.ok) {
      const data = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.data_inicio ? new Date(it.data_inicio).getFullYear() : (it.ano || new Date().getFullYear()),
        tipo: it.tipo_sessao?.descricao || it.tipo || 'Sessão Plenária',
        data: dateBR(it.data_inicio || it.data),
        horario: it.hora_inicio || '',
        pauta_url: normalizeUrl(it.pauta_url || it.pauta),
        ata_url: normalizeUrl(it.ata_url || it.ata),
        youtube_url: it.url_audio_video || it.youtube_url || '',
        situacao: it.situacao || 'Realizada',
        anexos: (it.anexo_sessao_set || it.anexos || []).map((a: any) => ({
          id: a.id,
          nome: a.nome || 'Anexo da Sessão',
          url: normalizeUrl(a.arquivo || a.url),
        })),
      }));

      items.sort((a: any, b: any) => {
        const diff = brToTs(b.data) - brToTs(a.data);
        return diff !== 0 ? diff : Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total = data.pagination?.total_entries || data.count || items.length;
      const payload = {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total / limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return NextResponse.json(payload);
    }
  } catch (e) {
    slog('WARN', 'handleSessoes', `Erro/Timeout ao buscar sessões (${Date.now() - startMs}ms): ${url.toString()}`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  const generalCache = getPersistentCache<any>('sessoes:last_good');
  if (generalCache && generalCache.data) {
    return NextResponse.json({ ...generalCache.data, fonte: generalCache.source });
  }

  return NextResponse.json({
    items: [],
    total: 0,
    page: pageNum,
    limit: limitNum,
    totalPages: 1,
    sapl_indisponivel: false,
    fonte: 'fallback',
  });
}
