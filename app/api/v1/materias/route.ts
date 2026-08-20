import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  extractAutor,
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

  const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
  
  // Repassar parâmetros de acordo com o OpenAPI
  if (search) url.searchParams.set('search', search);
  if (tipo) url.searchParams.set('tipo', tipo);
  if (ano) url.searchParams.set('ano', ano);
  url.searchParams.set('page', pageNum);
  url.searchParams.set('page_size', limitNum);
  url.searchParams.set('ordering', '-ano,-numero'); // Default ordering

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
    
    // Normalizar dados
    const items = (data.results || []).map((it: any) => ({
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

    return NextResponse.json({
      items,
      total: data.pagination?.total_entries || data.count || items.length,
      page: Number(pageNum),
      limit: Number(limitNum),
      totalPages: data.pagination?.total_pages || Math.ceil((data.count || items.length) / Number(limitNum)) || 1,
      fonte: 'sapl-live'
    });

  } catch (error: any) {
    console.error('[SAPL API ERROR - Materias]', error.message);
    return NextResponse.json(
      { error: 'Falha ao conectar com o SAPL', details: error.message },
      { status: 504 }
    );
  }
}
