/**
 * Cloudflare Worker entry point — Paflegis
 *
 * Usado com `wrangler deploy` (Cloudflare Workers + Assets).
 * Handles /api/* internamente; delega arquivos estáticos para env.ASSETS.
 *
 * Variáveis de ambiente (configure no painel Cloudflare Workers):
 *   GEMINI_API_KEY, SESSION_SECRET
 */

// Tipos mínimos para compilar sem @cloudflare/workers-types
interface Fetcher {
  fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
}
interface Env {
  ASSETS: Fetcher;
  GEMINI_API_KEY: string;
  SESSION_SECRET?: string;
}

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';

// ── utilidades ─────────────────────────────────────────────────────────────────

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function safeFetch(url: string, ms = 9000): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

function dateBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function brToTs(br: string): number {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime() : 0;
}

function normalizeUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return `https://sapl.camarapedroafonso.pi.leg.br${raw}`;
  return `https://sapl.camarapedroafonso.pi.leg.br/${raw}`;
}

const AUTOR_MAP: Record<number, string> = {
  1: 'Marquim Catabriga', 2: 'Gislayson Lacerda', 3: 'Jader Mariano',
  4: 'Joilson Boca Preta', 5: 'João do Povo', 6: 'Lili Benício',
  7: 'Mirleyson Soares', 8: 'Sipriano Soares', 9: 'Breno Alves',
  14: 'Agnaldo Lima', 15: 'José de Ribamar Coelho', 16: 'Fabrício Martins',
  17: 'Antonio Neto', 18: 'Mirneuton Soares', 19: 'Pedro Belarmino',
  20: 'Rômulo Soares',
};

function extractAutor(it: Record<string, unknown>): string {
  const autores = it.autores as number[] | undefined;
  if (Array.isArray(autores) && autores.length > 0) {
    const nome = AUTOR_MAP[autores[0]];
    if (nome) return nome;
    const str = it.__str__ as string | undefined;
    if (str) { const m = str.match(/Autor[:\s]+([^,]+)/i); if (m) return m[1].trim(); }
  }
  return 'Não informado';
}

const STATS_INDISPONIVEL = {
  total_materias: 0, total_normas: 0, total_sessoes: 0,
  materias_ano_atual: 0, normas_ano_atual: 0, sessoes_ano_atual: 0,
  materias_por_tipo: [] as { tipo: string; quantidade: number }[],
  normas_por_tipo:   [] as { tipo: string; quantidade: number }[],
  fonte: 'fallback',
};

// ── handlers ───────────────────────────────────────────────────────────────────

async function handleTiposMaterias(): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (r.ok) { const d = await r.json(); return json(200, (d as Record<string,unknown>).results || d); }
  } catch {}
  return json(200, []);
}

async function handleTiposNormas(): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (r.ok) { const d = await r.json(); return json(200, (d as Record<string,unknown>).results || d); }
  } catch {}
  return json(200, []);
}

async function handleMaterias(qs: URLSearchParams): Promise<Response> {
  const busca    = qs.get('busca') || '';
  const tipo     = qs.get('tipo') || '';
  const ano      = qs.get('ano') || '';
  const pageNum  = Number(qs.get('pagina') || qs.get('page') || 1);
  const limitNum = Number(qs.get('limite') || qs.get('limit') || qs.get('page_size') || 10);
  try {
    const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
    if (busca) url.searchParams.set('pesquisa', busca);
    if (tipo)  url.searchParams.set('tipo', tipo);
    if (ano)   url.searchParams.set('ano', ano);
    url.searchParams.set('page', String(pageNum));
    url.searchParams.set('page_size', String(limitNum));
    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data = await r.json() as Record<string, unknown>;
      const items = ((data.results || data) as Record<string,unknown>[]).map(it => ({
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:   (it.tipo_materia as Record<string,unknown>)?.descricao || it.tipo || 'Matéria Legislativa',
        ementa: it.ementa || '',
        autor:  extractAutor(it),
        data_apresentacao:    dateBR(it.data_apresentacao as string),
        situacao:             (it.situacao_materia as Record<string,unknown>)?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url:   normalizeUrl(it.texto_original as string),
        documentos_acessorios: ((it.documentoacessorio_set as Record<string,unknown>[]) || []).map(d => ({
          id: d.id, nome: d.nome || 'Documento Acessório', url: normalizeUrl(d.arquivo as string),
        })),
      }));
      items.sort((a, b) => {
        if ((b.ano as number) !== (a.ano as number)) return (b.ano as number || 0) - (a.ano as number || 0);
        const diff = brToTs(b.data_apresentacao as string) - brToTs(a.data_apresentacao as string);
        return diff !== 0 ? diff : Number(b.numero || 0) - Number(a.numero || 0);
      });
      const total = (data.pagination as Record<string,unknown>)?.total_entries as number || data.count as number || items.length;
      return json(200, { items, total, page: pageNum, limit: limitNum,
        totalPages: (data.pagination as Record<string,unknown>)?.total_pages as number || Math.ceil(total/limitNum) || 1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleMateriaById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`);
    if (r.ok) {
      const it = await r.json() as Record<string,unknown>;
      return json(200, {
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:   (it.tipo_materia as Record<string,unknown>)?.descricao || 'Matéria Legislativa',
        ementa: it.ementa || '', autor: extractAutor(it),
        data_apresentacao:    dateBR(it.data_apresentacao as string),
        situacao:             (it.situacao_materia as Record<string,unknown>)?.descricao || 'Em Tramitação',
        texto_original_url:   normalizeUrl(it.texto_original as string),
        documentos_acessorios: ((it.documentoacessorio_set as Record<string,unknown>[]) || []).map(d => ({
          id: d.id, nome: d.nome || 'Documento', url: normalizeUrl(d.arquivo as string),
        })),
        tramitacoes: ((it.tramitacao_set as Record<string,unknown>[]) || []).map(t => ({
          id: t.id, data: dateBR(t.data_tramitacao as string),
          status:  (t.status as Record<string,unknown>)?.descricao || '',
          texto:   t.texto || '',
          unidade: (t.unidade_tramitacao_destino as Record<string,unknown>)?.descricao || '',
        })),
      });
    }
  } catch {}
  return json(404, { error: 'Matéria não encontrada' });
}

async function handleNormas(qs: URLSearchParams): Promise<Response> {
  const busca    = qs.get('busca') || '';
  const tipo     = qs.get('tipo') || '';
  const ano      = qs.get('ano') || '';
  const pageNum  = Number(qs.get('pagina') || qs.get('page') || 1);
  const limitNum = Number(qs.get('limite') || qs.get('limit') || qs.get('page_size') || 10);
  try {
    const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
    if (busca) url.searchParams.set('pesquisa', busca);
    if (tipo)  url.searchParams.set('tipo', tipo);
    if (ano)   url.searchParams.set('ano', ano);
    url.searchParams.set('page', String(pageNum));
    url.searchParams.set('page_size', String(limitNum));
    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data = await r.json() as Record<string, unknown>;
      const items = ((data.results || data) as Record<string,unknown>[]).map(it => ({
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:               (it.tipo_norma as Record<string,unknown>)?.descricao || it.tipo || 'Norma Jurídica',
        ementa:             it.ementa || '',
        data_publicacao:    dateBR((it.data_publicacao || it.data) as string),
        situacao:           'Vigente',
        assunto:            it.indexacao || 'Legislação Municipal',
        texto_integral_url: normalizeUrl(it.texto_integral as string),
        anexos:             [],
      }));
      items.sort((a, b) => {
        if ((b.ano as number) !== (a.ano as number)) return (b.ano as number || 0) - (a.ano as number || 0);
        const diff = brToTs(b.data_publicacao as string) - brToTs(a.data_publicacao as string);
        return diff !== 0 ? diff : Number(b.numero || 0) - Number(a.numero || 0);
      });
      const total = (data.pagination as Record<string,unknown>)?.total_entries as number || data.count as number || items.length;
      return json(200, { items, total, page: pageNum, limit: limitNum,
        totalPages: (data.pagination as Record<string,unknown>)?.total_pages as number || Math.ceil(total/limitNum) || 1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleNormaById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`);
    if (r.ok) {
      const it = await r.json() as Record<string,unknown>;
      return json(200, {
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:               (it.tipo_norma as Record<string,unknown>)?.descricao || 'Norma Jurídica',
        ementa:             it.ementa || '',
        data_publicacao:    dateBR((it.data_publicacao || it.data) as string),
        situacao:           'Vigente',
        assunto:            it.indexacao || 'Legislação Municipal',
        texto_integral_url: normalizeUrl(it.texto_integral as string),
        anexos:             [],
      });
    }
  } catch {}
  return json(404, { error: 'Norma não encontrada' });
}

async function handleSessoes(qs: URLSearchParams): Promise<Response> {
  const busca    = qs.get('busca') || '';
  const ano      = qs.get('ano') || '';
  const pageNum  = Number(qs.get('pagina') || qs.get('page') || 1);
  const limitNum = Number(qs.get('limite') || qs.get('limit') || qs.get('page_size') || 10);
  const SAPL_PS  = 100;

  function buildUrl(p: number) {
    const u = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
    if (ano) { u.searchParams.set('data_inicio_0', `${ano}-01-01`); u.searchParams.set('data_inicio_1', `${ano}-12-31`); }
    u.searchParams.set('page', String(p));
    u.searchParams.set('page_size', String(SAPL_PS));
    return u.toString();
  }

  function mapItem(it: Record<string,unknown>) {
    const d    = dateBR(it.data_inicio as string);
    const sAno = it.ano || (it.data_inicio ? new Date(it.data_inicio as string).getFullYear() : 2026);
    const av   = normalizeUrl(it.upload_anexo as string);
    const vUrl = ((it.url_video as string) || '').trim();
    const anexos: unknown[] = [];
    if (av)   anexos.push({ id: (it.id as number)*100+1, nome: `Anexo Sessão nº ${it.numero}`,     tipo: 'Anexo', data: d, url: av });
    if (vUrl) anexos.push({ id: (it.id as number)*100+2, nome: `Gravação - Sessão nº ${it.numero}`, tipo: 'Vídeo', data: d, url: vUrl });
    return {
      id: it.id, numero: it.numero, ano: sAno,
      tipo: it.__str__ || (it.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária'),
      data: d, horario: it.hora_inicio || '19:00',
      pauta_url: normalizeUrl(it.upload_pauta as string), ata_url: normalizeUrl(it.upload_ata as string),
      youtube_url: vUrl,
      situacao: it.finalizada ? 'Realizada' : it.iniciada ? 'Em Andamento' : 'Convocada',
      anexos,
    };
  }

  try {
    const first = await safeFetch(buildUrl(1), 10000);
    if (first.ok) {
      const fd         = await first.json() as Record<string,unknown>;
      const totalE     = (fd.pagination as Record<string,unknown>)?.total_entries as number ?? fd.count as number ?? ((fd.results||fd) as unknown[]).length;
      const totalPages = Math.ceil(totalE / SAPL_PS);
      let allRaw       = [...((fd.results || fd) as Record<string,unknown>[])];
      if (totalPages > 1) {
        const extra = await Promise.all(
          Array.from({length: totalPages-1}, (_, i) => i+2).map(p =>
            safeFetch(buildUrl(p), 9000).then(r => r.ok ? r.json() : null).catch(() => null)
          )
        );
        for (const d of extra) if (d) allRaw = allRaw.concat(((d as Record<string,unknown>).results || d) as Record<string,unknown>[]);
      }
      let items = allRaw.map(mapItem);
      if (busca) { const t = busca.toLowerCase(); items = items.filter(s => (s.tipo as string).toLowerCase().includes(t) || `${s.numero}/${s.ano}`.includes(t)); }
      items.sort((a, b) => {
        if ((b.ano as number) !== (a.ano as number)) return (b.ano as number||0) - (a.ano as number||0);
        const diff = brToTs(b.data as string) - brToTs(a.data as string);
        return diff !== 0 ? diff : Number(b.numero||0) - Number(a.numero||0);
      });
      const tot = items.length; const si = (pageNum-1)*limitNum;
      return json(200, { items: items.slice(si, si+limitNum), total: tot, page: pageNum, limit: limitNum, totalPages: Math.ceil(tot/limitNum)||1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleSessaoById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`);
    if (r.ok) {
      const it  = await r.json() as Record<string,unknown>;
      const d   = dateBR(it.data_inicio as string);
      const ano = it.ano || (it.data_inicio ? new Date(it.data_inicio as string).getFullYear() : 2026);
      const vUrl = ((it.url_video as string)||'').trim();
      const av   = normalizeUrl(it.upload_anexo as string);
      const anexos: unknown[] = [];
      if (av)   anexos.push({ id: (it.id as number)*100+1, nome: `Anexo Sessão nº ${it.numero}`,     tipo: 'Anexo', data: d, url: av });
      if (vUrl) anexos.push({ id: (it.id as number)*100+2, nome: `Gravação - Sessão nº ${it.numero}`, tipo: 'Vídeo', data: d, url: vUrl });
      return json(200, {
        id: it.id, numero: it.numero, ano,
        tipo: it.__str__ || (it.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária'),
        data: d, horario: it.hora_inicio || '19:00',
        pauta_url: normalizeUrl(it.upload_pauta as string), ata_url: normalizeUrl(it.upload_ata as string),
        youtube_url: vUrl,
        situacao: it.finalizada ? 'Realizada' : it.iniciada ? 'Em Andamento' : 'Convocada',
        anexos,
      });
    }
  } catch {}
  return json(404, { error: 'Sessão não encontrada' });
}

async function handleEstatisticas(): Promise<Response> {
  const anoAtual = new Date().getFullYear();
  async function count(url: string): Promise<number> {
    try {
      const r = await safeFetch(url, 7000);
      if (!r.ok) return 0;
      const d = await r.json() as Record<string,unknown>;
      return d.count as number ?? (d.pagination as Record<string,unknown>)?.total_entries as number ?? (Array.isArray(d.results) ? d.results.length : 0);
    } catch { return 0; }
  }
  try {
    const [tM, tN, tS, mA, nA, sA] = await Promise.all([
      count(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?page_size=1`),
      count(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=1`),
      count(`${SAPL_API_BASE}/materia/materialegislativa/?ano=${anoAtual}&page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?ano=${anoAtual}&page_size=1`),
      count(`${SAPL_API_BASE}/sessao/sessaoplenaria/?data_inicio_0=${anoAtual}-01-01&data_inicio_1=${anoAtual}-12-31&page_size=1`),
    ]);
    let materiaTipos: {id:number;nome:string}[]      = [];
    let normasTipos:  {id:number;descricao:string}[] = [];
    try {
      const [mTRes, nTRes] = await Promise.all([
        safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, 6000),
        safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`,        6000),
      ]);
      if (mTRes.ok) { const d = await mTRes.json() as Record<string,unknown>; materiaTipos = ((d.results||d) as Record<string,unknown>[]).map(t => ({ id: t.id as number, nome: (t.descricao||t.sigla||'') as string })); }
      if (nTRes.ok) { const d = await nTRes.json() as Record<string,unknown>; normasTipos  = ((d.results||d) as Record<string,unknown>[]).map(t => ({ id: t.id as number, descricao: (t.descricao||t.sigla||'') as string })); }
    } catch {}
    const [mTipos, nTipos] = await Promise.all([
      Promise.all(materiaTipos.map(t => count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then(q => ({ tipo: t.nome, quantidade: q })))),
      Promise.all(normasTipos.map(t  => count(`${SAPL_API_BASE}/norma/normajuridica/?tipo=${t.id}&page_size=1`).then(q  => ({ tipo: t.descricao, quantidade: q })))),
    ]);
    return json(200, {
      total_materias: tM, total_normas: tN, total_sessoes: tS,
      materias_ano_atual: mA, normas_ano_atual: nA, sessoes_ano_atual: sA,
      materias_por_tipo: mTipos.filter(t => t.quantidade > 0),
      normas_por_tipo:   nTipos.filter(t  => t.quantidade > 0),
      fonte: 'sapl-live', atualizado_em: new Date().toISOString(), cache_age_s: 0,
    });
  } catch {
    return json(200, { ...STATS_INDISPONIVEL, atualizado_em: new Date().toISOString(), cache_age_s: -1 });
  }
}

async function handleChat(request: Request, apiKey: string): Promise<Response> {
  if (!apiKey) return json(503, { error: 'Serviço de IA indisponível: chave de API não configurada.' });
  let body: Record<string,unknown> = {};
  try { body = await request.json() as Record<string,unknown>; } catch {}
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const history = Array.isArray(body.history) ? body.history as {role:string;content:string}[] : [];
  if (!message) return json(400, { error: 'Mensagem inválida.' });

  const systemInstruction = `Você é o Assistente do Paflegis, um aplicativo cívico independente de consulta às informações legislativas públicas de Pedro Afonso - TO. Responda em português brasileiro, de forma clara e acessível. Não invente dados específicos. Nunca se apresente como representante da Câmara Municipal ou de qualquer órgão governamental.`;

  const contents: {role:string;parts:{text:string}[]}[] = [];
  for (const h of history) {
    if (h.content) contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(25000),
      }
    );
    if (!res.ok) return json(502, { error: 'Erro ao consultar o serviço de IA.' });
    const data      = await res.json() as Record<string,unknown>;
    const candidate = (data.candidates as Record<string,unknown>[])?.[0];
    const parts     = ((candidate?.content as Record<string,unknown>)?.parts) as {text:string}[];
    return json(200, { reply: parts?.map(p => p.text).join('') || '' });
  } catch {
    return json(503, { error: 'Serviço de IA temporariamente indisponível.' });
  }
}

// ── roteador + entry point ─────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
}

async function handleApi(request: Request, env: Env): Promise<Response> {
  const url    = new URL(request.url);
  const path   = url.pathname;        // ex: /api/v1/materias
  const method = request.method.toUpperCase();
  const qs     = url.searchParams;

  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  let response: Response;
  if (method === 'GET') {
    const m = path.match(/^\/api\/v1\/materias\/(\d+)\/?$/);
    const n = path.match(/^\/api\/v1\/normas\/(\d+)\/?$/);
    const s = path.match(/^\/api\/v1\/sessoes\/(\d+)\/?$/);

    if      (/^\/api\/v1\/tipos\/materias\/?$/.test(path))  response = await handleTiposMaterias();
    else if (/^\/api\/v1\/tipos\/normas\/?$/.test(path))    response = await handleTiposNormas();
    else if (/^\/api\/v1\/estatisticas\/?$/.test(path))    response = await handleEstatisticas();
    else if (m)                                            response = await handleMateriaById(m[1]);
    else if (/^\/api\/v1\/materias\/?$/.test(path))        response = await handleMaterias(qs);
    else if (n)                                            response = await handleNormaById(n[1]);
    else if (/^\/api\/v1\/normas\/?$/.test(path))          response = await handleNormas(qs);
    else if (s)                                            response = await handleSessaoById(s[1]);
    else if (/^\/api\/v1\/sessoes\/?$/.test(path))         response = await handleSessoes(qs);
    else response = json(404, { error: 'Rota não encontrada.' });
  } else if (method === 'POST' && /^\/api\/v1\/chat\/?$/.test(path)) {
    response = await handleChat(request, env.GEMINI_API_KEY || '');
  } else {
    response = json(method === 'POST' ? 404 : 405, { error: 'Rota ou método não suportado.' });
  }

  return withCors(response);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Rotas de API
    if (url.pathname.startsWith('/api/')) {
      return handleApi(request, env);
    }

    // Arquivos estáticos — tenta servir do bucket de assets
    let response = await env.ASSETS.fetch(request);

    // SPA fallback: rotas do React que não correspondem a arquivos
    if (response.status === 404) {
      const indexReq = new Request(new URL('/index.html', request.url).toString());
      response = await env.ASSETS.fetch(indexReq);
    }

    return response;
  },
};
