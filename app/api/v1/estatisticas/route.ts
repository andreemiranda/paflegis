import { NextRequest, NextResponse } from 'next/server';
import { SAPL_API_BASE, safeFetchWithRetry, slog } from '@/lib/sapl/backend';
import { setPersistentCache, getPersistentCache, PRESEEDED_ESTATISTICAS } from '@/lib/sapl/cache';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';

export async function GET(req: NextRequest) {
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason, code: 'UNAUTHORIZED_API_KEY' }, { status: 401 });
  }

  const anoAtual = new Date().getFullYear();
  const cacheKey = 'estatisticas:live';
  const startMs = Date.now();

  async function count(url: string): Promise<number> {
    try {
      const r = await safeFetchWithRetry(url, 3500, 0);
      if (!r.ok) return 0;
      const d = await r.json();
      return d.count ?? d.pagination?.total_entries ?? (Array.isArray(d.results) ? d.results.length : 0);
    } catch (e) {
      slog('WARN', 'handleEstatisticas', `Contagem falhou para ${url}`, e);
      return 0;
    }
  }

  try {
    const [tM, tN, tS, mA, nA, sA] = await Promise.all([
      count(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?page_size=1`),
      count(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=1`),
      count(`${SAPL_API_BASE}/materia/materialegislativa/?ano=${anoAtual}&page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?ano=${anoAtual}&page_size=1`),
      count(
        `${SAPL_API_BASE}/sessao/sessaoplenaria/?data_inicio_0=${anoAtual}-01-01&data_inicio_1=${anoAtual}-12-31&page_size=1`
      ),
    ]);

    let materiaTipos: { id: number; nome: string }[] = [];
    let normasTipos: { id: number; descricao: string }[] = [];
    try {
      const [mTRes, nTRes] = await Promise.all([
        safeFetchWithRetry(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, 3500, 0),
        safeFetchWithRetry(`${SAPL_API_BASE}/norma/tiponormajuridica/`, 3500, 0),
      ]);
      if (mTRes.ok) {
        const d = await mTRes.json();
        materiaTipos = (d.results || d).map((t: any) => ({ id: t.id, nome: t.descricao || t.sigla || '' }));
      }
      if (nTRes.ok) {
        const d = await nTRes.json();
        normasTipos = (d.results || d).map((t: any) => ({ id: t.id, descricao: t.descricao || t.sigla || '' }));
      }
    } catch (e) {
      slog('WARN', 'handleEstatisticas', 'Erro ao buscar tipos para estatísticas', e);
    }

    const [mTipos, nTipos] = await Promise.all([
      Promise.all(
        materiaTipos.map((t) =>
          count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then((q) => ({
            tipo: t.nome,
            quantidade: q,
          }))
        )
      ),
      Promise.all(
        normasTipos.map((t) =>
          count(`${SAPL_API_BASE}/norma/tiponormajuridica/?tipo=${t.id}&page_size=1`).then((q) => ({
            tipo: t.descricao,
            quantidade: q,
          }))
        )
      ),
    ]);

    const payload = {
      total_materias: tM || PRESEEDED_ESTATISTICAS.total_materias,
      total_normas: tN || PRESEEDED_ESTATISTICAS.total_normas,
      total_sessoes: tS || PRESEEDED_ESTATISTICAS.total_sessoes,
      materias_ano_atual: mA || PRESEEDED_ESTATISTICAS.materias_ano_atual,
      normas_ano_atual: nA || PRESEEDED_ESTATISTICAS.normas_ano_atual,
      sessoes_ano_atual: sA || PRESEEDED_ESTATISTICAS.sessoes_ano_atual,
      materias_por_tipo:
        mTipos.filter((t) => t.quantidade > 0).length > 0
          ? mTipos.filter((t) => t.quantidade > 0)
          : PRESEEDED_ESTATISTICAS.materias_por_tipo,
      normas_por_tipo:
        nTipos.filter((t) => t.quantidade > 0).length > 0
          ? nTipos.filter((t) => t.quantidade > 0)
          : PRESEEDED_ESTATISTICAS.normas_por_tipo,
      fonte: 'sapl-live',
      atualizado_em: new Date().toISOString(),
      cache_age_s: 0,
    };

    setPersistentCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    slog('WARN', 'handleEstatisticas', `Falha ao calcular estatísticas (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return NextResponse.json({ ...cached.data, fonte: cached.source });
  }

  return NextResponse.json(PRESEEDED_ESTATISTICAS);
}
