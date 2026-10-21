export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { SAPL_API_BASE, safeFetchWithRetry, sanitizeSaplData } from '@/lib/sapl/backend';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    url.searchParams.set('page_size', '100');

    const res = await safeFetchWithRetry(url.toString(), 15000, 2);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro na API do SAPL: HTTP ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const rawData = await res.json();
    const data = sanitizeSaplData(rawData);

    const items = (data.results || []).map((it: any) => ({
      id: it.id,
      nome: it.descricao || it.nome,
      sigla: it.sigla || '',
    }));

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('[SAPL API ERROR - Tipos Materias]', error.message);
    return NextResponse.json([], { status: 200 });
  }
}
