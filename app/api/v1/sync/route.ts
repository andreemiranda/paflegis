import { NextRequest, NextResponse } from 'next/server';
import { executeSync } from '@/lib/sync';
import { getConfig } from '@/lib/config';
import { slog } from '@/lib/sapl/backend';

export async function POST(req: NextRequest) {
  const config = getConfig();

  // Validação do CRON_SECRET ou x-api-key administrativa
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
  const cronHeader = req.headers.get('x-cron-secret') || '';
  const apiKeyHeader = req.headers.get('x-api-key') || '';

  let authorized = false;

  if (cronHeader && cronHeader === config.cronSecret) {
    authorized = true;
  } else if (authHeader.startsWith('Bearer ') && authHeader.slice(7).trim() === config.cronSecret) {
    authorized = true;
  } else if (apiKeyHeader && config.apiKeysPermitidas.includes(apiKeyHeader)) {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json(
      { erro: 'Não autorizado. Forneça o cabeçalho Authorization: Bearer <CRON_SECRET> ou x-cron-secret.' },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const syncType = body.type === 'full' ? 'full' : 'incremental';
  const modules = Array.isArray(body.modules) ? body.modules : undefined;
  const maxPages = typeof body.max_pages === 'number' ? body.max_pages : undefined;

  slog('INFO', 'api-sync', `Iniciando sincronização solicitada via API (${syncType})`);

  try {
    const result = await executeSync({
      type: syncType,
      modules,
      maxPagesPerResource: maxPages,
    });

    return NextResponse.json(result, { status: result.sucesso ? 200 : 409 });
  } catch (err: any) {
    slog('ERROR', 'api-sync', 'Erro catastrófico no endpoint de sync', err);
    return NextResponse.json({ sucesso: false, erro: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { erro: 'Método não permitido. Utilize POST para disparar a sincronização.' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
