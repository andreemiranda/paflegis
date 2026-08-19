import { NextRequest, NextResponse } from 'next/server';
import { SAPL_API_BASE, safeFetchWithRetry, slog } from '@/lib/sapl/backend';
import { setPersistentCache, getPersistentCache, PRESEEDED_TIPOS_MATERIAS } from '@/lib/sapl/cache';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';

async function fetchAllPages(baseUrl: string): Promise<unknown[]> {
  const all: unknown[] = [];
  let url: string | null = baseUrl;
  let pageCount = 0;
  while (url && pageCount < 20) {
    pageCount++;
    try {
      const r = await safeFetchWithRetry(url, 3500, 0);
      if (!r.ok) break;
      const data = await r.json();
      const results: unknown[] = data.results || (Array.isArray(data) ? data : []);
      all.push(...results);
      url = data.next ?? null;
    } catch (e) {
      slog('WARN', 'fetchAllPages', `Falha ao buscar tipos de matéria`, e);
      break;
    }
  }
  return all;
}

export async function GET(req: NextRequest) {
  const auth = validateApiRequest(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.reason, code: 'UNAUTHORIZED_API_KEY' }, { status: 401 });
  }

  const cacheKey = 'tipos:materias';
  const startMs = Date.now();
  try {
    const items = await fetchAllPages(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (items.length) {
      setPersistentCache(cacheKey, items);
      return NextResponse.json(items);
    }
  } catch (e) {
    slog('WARN', 'tipos:materias', `Erro no SAPL para tipos de matéria (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<unknown[]>(cacheKey);
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    return NextResponse.json(cached.data);
  }

  return NextResponse.json(PRESEEDED_TIPOS_MATERIAS);
}
