import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  normalizeUrl,
  dateBR,
} from '@/lib/sapl/backend';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('busca') || searchParams.get('pesquisa') || searchParams.get('search') || '';
  const tipo = searchParams.get('tipo') || '';
  const ano = searchParams.get('ano') || '';
  const pageNum = searchParams.get('pagina') || searchParams.get('page') || '1';
  const limitNum = searchParams.get('limite') || searchParams.get('limit') || searchParams.get('page_size') || '10';

  const url = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
  
  if (search) url.searchParams.set('search', search);
  if (tipo) url.searchParams.set('tipo', tipo);
  if (ano) {
    url.searchParams.set('data_inicio_0', `${ano}-01-01`);
    url.searchParams.set('data_inicio_1', `${ano}-12-31`);
  }
  url.searchParams.set('page', pageNum);
  url.searchParams.set('page_size', limitNum);
  url.searchParams.set('ordering', '-data_inicio');

  try {
    const res = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro na API do SAPL: HTTP ${res.status}` },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const data = await res.json();
    
    const items = (data.results || []).map((it: any) => ({
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

    return NextResponse.json({
      items,
      total: data.pagination?.total_entries || data.count || items.length,
      page: Number(pageNum),
      limit: Number(limitNum),
      totalPages: data.pagination?.total_pages || Math.ceil((data.count || items.length) / Number(limitNum)) || 1,
      fonte: 'sapl-live'
    });

  } catch (error: any) {
    console.error('[SAPL API ERROR - Sessoes]', error.message);
    return NextResponse.json(
      { error: 'Falha ao conectar com o SAPL', details: error.message },
      { status: 504 }
    );
  }
}
