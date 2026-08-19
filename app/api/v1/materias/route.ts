import { NextRequest, NextResponse } from 'next/server';
import {
  SAPL_API_BASE,
  extractAutor,
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
      { error: 'Limite de requisições excedido. Tente novamente em alguns instantes.', code: 'TOO_MANY_REQUESTS' },
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

  const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
  if (busca) url.searchParams.set('pesquisa', busca);
  if (tipo) url.searchParams.set('tipo', tipo);
  if (ano) url.searchParams.set('ano', ano);
  url.searchParams.set('page', String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  const cacheKey = `materias:${url.toString()}`;

  try {
    const r = await safeFetchWithRetry(url.toString(), 4000, 1);
    if (r.ok) {
      const data = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_materia?.descricao || it.tipo || 'Matéria Legislativa',
        ementa: it.ementa || '',
        autor: extractAutor(it),
        data_apresentacao: dateBR(it.data_apresentacao),
        situacao: it.situacao_materia?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url: normalizeUrl(it.texto_original),
        documentos_acessorios: (it.documentoacessorio_set || []).map((d: any) => ({
          id: d.id,
          nome: d.nome || 'Documento Acessório',
          url: normalizeUrl(d.arquivo),
        })),
      }));

      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const diff = brToTs(b.data_apresentacao) - brToTs(a.data_apresentacao);
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
    slog('WARN', 'handleMaterias', `Erro/Timeout ao buscar matérias (${Date.now() - startMs}ms): ${url.toString()}`, e);
  }

  // Fallback cache
  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  const generalCache = getPersistentCache<any>('materias:last_good');
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
