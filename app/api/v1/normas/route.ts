import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  safeFetchWithRetry,
  normalizeUrl,
  dateBR,
  sanitizeSaplData,
} from '@/lib/sapl/backend';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('busca') || searchParams.get('pesquisa') || searchParams.get('search') || '';
  const tipo = searchParams.get('tipo') || '';
  const ano = searchParams.get('ano') || '';
  const pageNum = searchParams.get('pagina') || searchParams.get('page') || '1';
  const limitNum = searchParams.get('limite') || searchParams.get('limit') || searchParams.get('page_size') || '10';

  const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);

  if (search) url.searchParams.set('search', search);
  if (tipo) url.searchParams.set('tipo', tipo);
  if (ano) url.searchParams.set('ano', ano);
  url.searchParams.set('page', pageNum);
  url.searchParams.set('page_size', limitNum);
  url.searchParams.set('ordering', '-ano,-numero');

  try {
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
    }));

    return NextResponse.json({
      items,
      total: data.pagination?.total_entries || data.count || items.length,
      page: Number(pageNum),
      limit: Number(limitNum),
      totalPages:
        data.pagination?.total_pages ||
        Math.ceil((data.count || items.length) / Number(limitNum)) ||
        1,
      fonte: 'sapl-live',
    });
  } catch (error: any) {
    console.error('[SAPL API ERROR - Normas]', error.message);
    return NextResponse.json(
      { error: 'Falha ao conectar com o SAPL', details: error.message },
      { status: 504 }
    );
  }
}
