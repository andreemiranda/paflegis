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
  const cacheKey = `sessao_id:${id}`;
  const startMs = Date.now();

  try {
    const r = await safeFetchWithRetry(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`, 4000, 1);
    if (r.ok) {
      const it = await r.json();
      const payload = {
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
        presencas: (it.presenca_sessao_set || it.presencas || []).map((p: any) => ({
          nome: p.parlamentar?.nome || p.nome || 'Vereador',
          partido: p.parlamentar?.partido || p.partido || '',
          presenca: p.presente !== undefined ? p.presente : true,
          cargo: p.cargo || '',
        })),
        ordem_dia: (it.ordem_dia_set || it.ordem_dia || []).map((o: any, idx: number) => ({
          id: o.id || idx + 1,
          ordem: o.ordem || idx + 1,
          materia_id: o.materia?.id || o.materia_id,
          materia_titulo: o.materia?.__str__ || o.materia_titulo || 'Matéria em Pauta',
          materia_ementa: o.materia?.ementa || o.materia_ementa || '',
          resultado: o.resultado?.descricao || o.resultado || '',
          observacao: o.observacao || '',
        })),
        anexos: (it.anexo_sessao_set || it.anexos || []).map((a: any) => ({
          id: a.id,
          nome: a.nome || 'Anexo da Sessão',
          url: normalizeUrl(a.arquivo || a.url),
        })),
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return NextResponse.json(payload);
    }
  } catch (e) {
    slog('WARN', 'handleSessaoById', `Erro ao buscar sessão ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  return NextResponse.json({ error: 'Sessão plenária não encontrada' }, { status: 404 });
}
