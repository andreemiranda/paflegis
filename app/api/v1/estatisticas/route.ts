export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getEstatisticasReais } from '@/lib/sapl/cache';

export async function GET(req: NextRequest) {
  try {
    const force =
      req.nextUrl.searchParams.get('refresh') === '1' ||
      req.nextUrl.searchParams.get('force') === 'true';
    const stats = await getEstatisticasReais(force);
    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=600',
        'X-Data-Source': stats.fonte,
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      total_materias: 0,
      total_normas: 0,
      total_sessoes: 0,
      materias_por_tipo: [],
      normas_por_tipo: [],
      fonte: 'indisponivel',
      atualizado_em: new Date().toISOString(),
      cache_age_s: 0,
      dados_disponiveis: false,
      erro: 'Estatísticas temporariamente indisponíveis.',
    }, { status: 200 });
  }
}
