import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import {
  SAPL_API_BASE,
  normalizeUrl,
  dateBR,
} from '@/lib/sapl/backend';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const res = await fetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`, {
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
        fonte: 'sapl-live',
      };
      return NextResponse.json(payload);
    }
    
    return NextResponse.json({ error: 'Norma jurídica não encontrada' }, { status: 404 });
  } catch (e: any) {
    console.error(`[SAPL API ERROR - Norma ID ${id}]`, e.message);
    return NextResponse.json({ error: 'Falha ao conectar com o SAPL' }, { status: 504 });
  }
}
