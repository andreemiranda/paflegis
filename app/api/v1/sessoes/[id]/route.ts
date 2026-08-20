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
    const res = await fetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`, {
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (res.ok) {
      const it = await res.json();
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
      return NextResponse.json(payload);
    }
    
    return NextResponse.json({ error: 'Sessão plenária não encontrada' }, { status: 404 });
  } catch (e: any) {
    console.error(`[SAPL API ERROR - Sessao ID ${id}]`, e.message);
    return NextResponse.json({ error: 'Falha ao conectar com o SAPL' }, { status: 504 });
  }
}
