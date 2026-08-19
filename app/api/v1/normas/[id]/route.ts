import { NextRequest, NextResponse } from 'next/server';
import {
  SAPL_API_BASE,
  normalizeUrl,
  dateBR,
  safeFetchWithRetry,
  slog,
} from '@/lib/sapl/backend';
import { setPersistentCache, getPersistentCache } from '@/lib/sapl/cache';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';
import { checkRateLimit } from '@/lib/rateLimiter';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const cacheKey = `norma_id:${id}`;
  const startMs = Date.now();

  try {
    const r = await safeFetchWithRetry(`${SAPL_API_BASE}/norma/normajuridica/${id}/`, 4000, 1);
    if (r.ok) {
      const it = await r.json();
      const payload = {
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        tipo: it.tipo_norma?.descricao || it.tipo || 'Norma Jurídica',
        ementa: it.ementa || '',
        data_publicacao: dateBR(it.data_publicacao || it.data),
        situacao: it.situacao?.descricao || it.situacao || 'Vigente',
        assunto: it.assunto_norma?.descricao || it.assunto || '',
        texto_integral_url: normalizeUrl(it.texto_integral),
        anexos: (it.anexonorma_set || []).map((a: any) => ({
          id: a.id,
          nome: a.nome || 'Anexo',
          url: normalizeUrl(a.arquivo),
        })),
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return NextResponse.json(payload);
    }
  } catch (e) {
    slog('WARN', 'handleNormaById', `Erro ao buscar norma ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  return NextResponse.json({ error: 'Norma jurídica não encontrada' }, { status: 404 });
}
