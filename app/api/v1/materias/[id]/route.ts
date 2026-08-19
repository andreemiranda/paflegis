import { NextRequest, NextResponse } from 'next/server';
import {
  SAPL_API_BASE,
  extractAutor,
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
  const cacheKey = `materia_id:${id}`;
  const startMs = Date.now();

  try {
    const r = await safeFetchWithRetry(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`, 4000, 1);
    if (r.ok) {
      const it = await r.json();
      const payload = {
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
          nome: d.nome || 'Documento',
          url: normalizeUrl(d.arquivo),
        })),
        tramitacoes: (it.tramitacao_set || []).map((t: any) => ({
          data: dateBR(t.data_tramitacao),
          unidade_origem: t.unidade_tramitacao_local?.nome || '',
          unidade_destino: t.unidade_tramitacao_destino?.nome || '',
          status: t.status?.descricao || '',
          texto: t.texto || '',
        })),
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return NextResponse.json(payload);
    }
  } catch (e) {
    slog('WARN', 'handleMateriaById', `Erro ao buscar matéria ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  return NextResponse.json({ error: 'Matéria não encontrada' }, { status: 404 });
}
