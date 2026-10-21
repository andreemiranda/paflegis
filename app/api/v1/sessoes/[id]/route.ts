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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const res = await safeFetchWithRetry(
      `${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`,
      15000,
      2
    );

    if (res.ok) {
      const raw = await res.json();
      const it = sanitizeSaplData(raw);

      const payload = {
        id: it.id,
        numero: it.numero,
        ano: it.data_inicio
          ? new Date(it.data_inicio).getFullYear()
          : it.ano || new Date().getFullYear(),
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
