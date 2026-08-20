import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  extractAutor,
  normalizeUrl,
  dateBR,
} from '@/lib/sapl/backend';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const it = await res.json();
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
      return NextResponse.json(payload);
    }
    
    return NextResponse.json({ error: 'Matéria não encontrada' }, { status: 404 });
  } catch (e: any) {
    console.error(`[SAPL API ERROR - Materia ID ${id}]`, e.message);
    return NextResponse.json({ error: 'Falha ao conectar com o SAPL' }, { status: 504 });
  }
}
