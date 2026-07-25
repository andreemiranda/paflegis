/**
 * Cloudflare Pages Function - captura todas as rotas /api/*
 * Funciona no runtime V8 isolate do Cloudflare (sem Node.js),
 * usando apenas Web APIs padrão (fetch, URL, AbortSignal, etc.).
 *
 * Variáveis de ambiente: configure no painel do Cloudflare Pages
 *   → Settings → Environment Variables:
 *     GEMINI_API_KEY, SESSION_SECRET
 */

interface Env {
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

/** Fetch with timeout + linear-backoff retry (4xx not retried). */
async function safeFetch(url: string, ms = 9000, maxRetries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await new Promise<void>(r => setTimeout(r, attempt * 1000));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
      if (res.status >= 400 && res.status < 500) return res;
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function handleHealth(): Promise<Response> {
  const start = Date.now();
  try {
    const r = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    return json(r.ok ? 200 : 503, {
      status: r.ok ? 'ok' : 'degraded', sapl: r.ok ? 'reachable' : 'unreachable',
      sapl_latency_ms: latencyMs, ts: new Date().toISOString(),
    });
  } catch {
    return json(503, { status: 'degraded', sapl: 'unreachable', sapl_latency_ms: Date.now() - start, ts: new Date().toISOString() });
  }
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
  if (raw.startsWith('/')) return `https://sapl.pedroafonso.to.leg.br${raw}`;
  return `https://sapl.pedroafonso.to.leg.br/${raw}`;
}

// Mapa de IDs reais do SAPL para nomes dos vereadores
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
    if (str) {
      const m = str.match(/Autor[:\s]+([^,]+)/i);
      if (m) return m[1].trim();
    }
  }
  return 'Não informado';
}


// ── handlers ───────────────────────────────────────────────────────────────────

async function handleTiposMaterias(): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (r.ok) { const d = await r.json(); return json(200, d.results || d); }
  } catch {}
  return json(503, { error: 'SAPL indisponível para tipos de matéria.' });
}

async function handleTiposNormas(): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (r.ok) { const d = await r.json(); return json(200, d.results || d); }
  } catch {}
  return json(503, { error: 'SAPL indisponível para tipos de norma.' });
}

async function handleMaterias(qs: URLSearchParams): Promise<Response> {
  const busca   = qs.get('busca') || '';
  const tipo    = qs.get('tipo') || '';
  const ano     = qs.get('ano') || '';
  const pageNum  = Number(qs.get('pagina') || qs.get('page') || 1);
  const limitNum = Number(qs.get('limite') || qs.get('limit') || qs.get('page_size') || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
    if (busca) url.searchParams.set('pesquisa', busca);
    if (tipo)  url.searchParams.set('tipo', tipo);
    if (ano)   url.searchParams.set('ano', ano);
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json() as Record<string, unknown>;
      const results = (data.results || data) as Record<string, unknown>[];
      const items = results.map((it: Record<string, unknown>) => ({
        id:                    it.id,
        numero:                it.numero,
        ano:                   it.ano,
        tipo:                  (it.tipo_materia as Record<string, unknown>)?.descricao || it.tipo || 'Matéria Legislativa',
        ementa:                it.ementa || '',
        autor:                 extractAutor(it),
        data_apresentacao:     dateBR(it.data_apresentacao as string),
        situacao:              (it.situacao_materia as Record<string, unknown>)?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url:    normalizeUrl(it.texto_original as string),
        documentos_acessorios: ((it.documentoacessorio_set as Record<string, unknown>[]) || []).map((d) => ({
          id:   d.id,
          nome: d.nome || 'Documento Acessório',
          url:  normalizeUrl(d.arquivo as string),
        })),
      }));
      items.sort((a, b) => {
        if ((b.ano as number) !== (a.ano as number)) return (b.ano as number || 0) - (a.ano as number || 0);
        const diff = brToTs(b.data_apresentacao as string) - brToTs(a.data_apresentacao as string);
        return diff !== 0 ? diff : Number(b.numero || 0) - Number(a.numero || 0);
      });
      const total = (data.pagination as Record<string, unknown>)?.total_entries as number
        || data.count as number || items.length;
      return json(200, { items, total, page: pageNum, limit: limitNum,
        totalPages: (data.pagination as Record<string, unknown>)?.total_pages as number
          || Math.ceil(total / limitNum) || 1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleMateriaById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`);
    if (r.ok) {
      const it = await r.json() as Record<string, unknown>;
      return json(200, {
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:   (it.tipo_materia as Record<string, unknown>)?.descricao || 'Matéria Legislativa',
        ementa: it.ementa || '',
        autor:  extractAutor(it),
        data_apresentacao:    dateBR(it.data_apresentacao as string),
        situacao:             (it.situacao_materia as Record<string, unknown>)?.descricao || 'Em Tramitação',
        texto_original_url:   normalizeUrl(it.texto_original as string),
        documentos_acessorios: ((it.documentoacessorio_set as Record<string, unknown>[]) || []).map((d) => ({
          id: d.id, nome: d.nome || 'Documento', url: normalizeUrl(d.arquivo as string),
        })),
        tramitacoes: ((it.tramitacao_set as Record<string, unknown>[]) || []).map((t) => ({
          id:          t.id,
          data:        dateBR(t.data_tramitacao as string),
          status:      (t.status as Record<string, unknown>)?.descricao || '',
          texto:       t.texto || '',
          unidade:     (t.unidade_tramitacao_destino as Record<string, unknown>)?.descricao || '',
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
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json() as Record<string, unknown>;
      const results = (data.results || data) as Record<string, unknown>[];
      const items = results.map((it: Record<string, unknown>) => ({
        id:                 it.id,
        numero:             it.numero,
        ano:                it.ano,
        tipo:               (it.tipo_norma as Record<string, unknown>)?.descricao || it.tipo || 'Norma Jurídica',
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
      const total = (data.pagination as Record<string, unknown>)?.total_entries as number
        || data.count as number || items.length;
      return json(200, { items, total, page: pageNum, limit: limitNum,
        totalPages: (data.pagination as Record<string, unknown>)?.total_pages as number
          || Math.ceil(total / limitNum) || 1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleNormaById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`);
    if (r.ok) {
      const it = await r.json() as Record<string, unknown>;
      return json(200, {
        id: it.id, numero: it.numero, ano: it.ano,
        tipo:               (it.tipo_norma as Record<string, unknown>)?.descricao || 'Norma Jurídica',
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

  function buildUrl(saplPage: number): string {
    const u = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
    if (ano) {
      u.searchParams.set('data_inicio_0', `${ano}-01-01`);
      u.searchParams.set('data_inicio_1', `${ano}-12-31`);
    }
    u.searchParams.set('page',      String(saplPage));
    u.searchParams.set('page_size', String(SAPL_PS));
    return u.toString();
  }

  function mapItem(it: Record<string, unknown>) {
    const d    = dateBR(it.data_inicio as string);
    const sAno = it.ano || (it.data_inicio ? new Date(it.data_inicio as string).getFullYear() : 2026);
    const av   = normalizeUrl(it.upload_anexo as string);
    const vUrl = ((it.url_video as string) || '').trim();
    const anexos: unknown[] = [];
    if (av)   anexos.push({ id: (it.id as number) * 100 + 1, nome: `Anexo Sessão nº ${it.numero}`,    tipo: 'Anexo', data: d, url: av });
    if (vUrl) anexos.push({ id: (it.id as number) * 100 + 2, nome: `Gravação - Sessão nº ${it.numero}`, tipo: 'Vídeo', data: d, url: vUrl });
    return {
      id: it.id, numero: it.numero, ano: sAno,
      tipo: it.__str__ || (it.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária'),
      data: d, horario: it.hora_inicio || '19:00',
      pauta_url: normalizeUrl(it.upload_pauta as string),
      ata_url:   normalizeUrl(it.upload_ata as string),
      youtube_url: vUrl,
      situacao: it.finalizada ? 'Realizada' : it.iniciada ? 'Em Andamento' : 'Convocada',
      anexos,
    };
  }

  try {
    const first = await safeFetch(buildUrl(1), 10000);
    if (first.ok) {
      const fd         = await first.json() as Record<string, unknown>;
      const totalE     = (fd.pagination as Record<string, unknown>)?.total_entries as number
        ?? fd.count as number
        ?? ((fd.results || fd) as unknown[]).length;
      const totalPages = Math.ceil(totalE / SAPL_PS);
      let allRaw: Record<string, unknown>[] = [...((fd.results || fd) as Record<string, unknown>[])];

      if (totalPages > 1) {
        const extra = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map(p =>
            safeFetch(buildUrl(p), 9000).then(r => r.ok ? r.json() : null).catch(() => null)
          )
        );
        for (const d of extra) if (d) {
          const dd = d as Record<string, unknown>;
          allRaw = allRaw.concat((dd.results || dd) as Record<string, unknown>[]);
        }
      }

      let items = allRaw.map(mapItem);
      if (busca) {
        const t = busca.toLowerCase();
        items = items.filter((s) =>
          (s.tipo as string).toLowerCase().includes(t) || `${s.numero}/${s.ano}`.includes(t)
        );
      }
      items.sort((a, b) => {
        if ((b.ano as number) !== (a.ano as number)) return (b.ano as number || 0) - (a.ano as number || 0);
        const diff = brToTs(b.data as string) - brToTs(a.data as string);
        return diff !== 0 ? diff : Number(b.numero || 0) - Number(a.numero || 0);
      });
      const tot = items.length;
      const si  = (pageNum - 1) * limitNum;
      return json(200, { items: items.slice(si, si + limitNum), total: tot, page: pageNum, limit: limitNum,
        totalPages: Math.ceil(tot / limitNum) || 1 });
    }
  } catch {}
  return json(503, { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
}

async function handleSessaoById(id: string): Promise<Response> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`);
    if (r.ok) {
      const it  = await r.json() as Record<string, unknown>;
      const d   = dateBR(it.data_inicio as string);
      const ano = it.ano || (it.data_inicio ? new Date(it.data_inicio as string).getFullYear() : 2026);
      const vUrl = ((it.url_video as string) || '').trim();
      const av   = normalizeUrl(it.upload_anexo as string);
      const anexos: unknown[] = [];
      if (av)   anexos.push({ id: (it.id as number) * 100 + 1, nome: `Anexo Sessão nº ${it.numero}`,    tipo: 'Anexo', data: d, url: av });
      if (vUrl) anexos.push({ id: (it.id as number) * 100 + 2, nome: `Gravação - Sessão nº ${it.numero}`, tipo: 'Vídeo', data: d, url: vUrl });
      return json(200, {
        id: it.id, numero: it.numero, ano,
        tipo: it.__str__ || (it.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária'),
        data: d, horario: it.hora_inicio || '19:00',
        pauta_url:   normalizeUrl(it.upload_pauta as string),
        ata_url:     normalizeUrl(it.upload_ata as string),
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
      const d = await r.json() as Record<string, unknown>;
      return d.count as number
        ?? (d.pagination as Record<string, unknown>)?.total_entries as number
        ?? (Array.isArray(d.results) ? d.results.length : 0);
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

    let materiaTipos: { id: number; nome: string }[]      = [];
    let normasTipos:  { id: number; descricao: string }[] = [];
    try {
      const [mTRes, nTRes] = await Promise.all([
        safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, 6000),
        safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`,        6000),
      ]);
      if (mTRes.ok) {
        const d = await mTRes.json() as Record<string, unknown>;
        materiaTipos = ((d.results || d) as Record<string, unknown>[]).map((t) => ({
          id: t.id as number, nome: (t.descricao || t.sigla || '') as string,
        }));
      }
      if (nTRes.ok) {
        const d = await nTRes.json() as Record<string, unknown>;
        normasTipos = ((d.results || d) as Record<string, unknown>[]).map((t) => ({
          id: t.id as number, descricao: (t.descricao || t.sigla || '') as string,
        }));
      }
    } catch {}

    const [mTipos, nTipos] = await Promise.all([
      Promise.all(materiaTipos.map(t => count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then(q => ({ tipo: t.nome, quantidade: q })))),
      Promise.all(normasTipos.map(t  => count(`${SAPL_API_BASE}/norma/normajuridica/?tipo=${t.id}&page_size=1`).then(q  => ({ tipo: t.descricao, quantidade: q })))),
    ]);

    return json(200, {
      total_materias: tM, total_normas: tN, total_sessoes: tS,
      materias_ano_atual: mA, normas_ano_atual: nA, sessoes_ano_atual: sA,
      materias_por_tipo: mTipos.filter(t => t.quantidade > 0),
      normas_por_tipo:   nTipos.filter(t => t.quantidade > 0),
      fonte: 'sapl-live', atualizado_em: new Date().toISOString(), cache_age_s: 0,
    });
  } catch {
    return json(503, { error: 'SAPL indisponível para estatísticas. Tente novamente.' });
  }
}

async function handleChat(body: unknown, apiKey: string): Promise<Response> {
  if (!apiKey) return json(503, { error: 'Serviço de IA indisponível: chave de API não configurada.' });

  const b = body as Record<string, unknown>;
  const message = typeof b?.message === 'string' ? b.message.trim() : '';
  const history = Array.isArray(b?.history) ? b.history as { role: string; content: string }[] : [];
  if (!message) return json(400, { error: 'Mensagem inválida.' });

  const systemInstruction = `Você é o assistente do Paflegis, focado em ajudar o usuário com dúvidas sobre matérias legislativas, normas jurídicas e sessões plenárias.

DIRETRIZES DE CONVERSA:
1. Responda em português do Brasil, de forma clara, direta e cordial.
2. Analise todo o histórico de mensagens enviado a cada turno para manter contexto e evitar repetições.
3. Se não entender a pergunta, peça para o usuário reformular, mantendo tom profissional.
4. Você não tem acesso ao status técnico da infraestrutura da aplicação (limites de uso, erros de rede, disponibilidade do servidor). Se o usuário mencionar ter visto uma mensagem de erro técnico, não confirme nem negue o estado do sistema, apenas oriente-o a tentar novamente e, se persistir, avise que pode reportar o problema pelo formulário de contato.`;

  // Monta histórico no formato Gemini
  const contents: { role: string; parts: { text: string }[] }[] = [];
  for (const h of history) {
    if (h.content) contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });

  // Retry com backoff exponencial: até 2 tentativas adicionais ao receber 429 do Gemini.
  for (let attempt = 0; attempt <= 2; attempt++) {
    if (attempt > 0) await new Promise<void>(r => setTimeout(r, attempt * 2000)); // 2s, 4s
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents,
            generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
          }),
          signal: AbortSignal.timeout(25000),
        }
      );

      if (res.status === 429 && attempt < 2) continue; // tentar novamente

      if (!res.ok) {
        const errBody = await res.text();
        console.error('[CF-Chat] Gemini error:', res.status, errBody);
        if (res.status === 429) return json(429, { error: 'Muitas solicitações. Tente novamente em instantes.' });
        return json(502, { error: 'Erro ao consultar o serviço de IA.' });
      }

      const data = await res.json() as Record<string, unknown>;
      const candidate = (data.candidates as Record<string, unknown>[])?.[0];
      const parts     = (candidate?.content as Record<string, unknown>)?.parts as { text: string }[];
      const reply     = parts?.map(p => p.text).join('') || '';
      return json(200, { reply });
    } catch {
      if (attempt < 2) continue;
      return json(503, { error: 'Serviço de IA temporariamente indisponível.' });
    }
  }
  return json(503, { error: 'Serviço de IA temporariamente indisponível.' });
}

// ── roteador principal ─────────────────────────────────────────────────────────

interface CFContext {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}

export const onRequest = async (context: CFContext): Promise<Response> => {
  const { request, env, params } = context;
  const method = request.method.toUpperCase();

  // Resolve o path da URL: params.path é um array de segmentos
  const segments = Array.isArray(params.path)
    ? (params.path as string[])
    : typeof params.path === 'string'
      ? [params.path]
      : [];
  const apiPath = '/' + segments.join('/');           // ex: "/v1/materias"

  const url    = new URL(request.url);
  const qs     = url.searchParams;

  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  let response: Response;

  // ── GET routes ─────────────────────────────────────────────────────────────
  if (method === 'GET') {
    if (/^\/health\/?$/.test(apiPath) || /^\/v1\/health\/?$/.test(apiPath)) { response = await handleHealth(); }
    else if (/^\/v1\/tipos\/materias\/?$/.test(apiPath))  { response = await handleTiposMaterias(); }
    else if (/^\/v1\/tipos\/normas\/?$/.test(apiPath))    { response = await handleTiposNormas(); }
    else if (/^\/v1\/estatisticas\/?$/.test(apiPath))   { response = await handleEstatisticas(); }
    else if (/^\/v1\/materias\/(\d+)\/?$/.test(apiPath)) {
      const m = apiPath.match(/\/v1\/materias\/(\d+)/);
      response = await handleMateriaById(m![1]);
    }
    else if (/^\/v1\/materias\/?$/.test(apiPath))    { response = await handleMaterias(qs); }
    else if (/^\/v1\/normas\/(\d+)\/?$/.test(apiPath)) {
      const m = apiPath.match(/\/v1\/normas\/(\d+)/);
      response = await handleNormaById(m![1]);
    }
    else if (/^\/v1\/normas\/?$/.test(apiPath))      { response = await handleNormas(qs); }
    else if (/^\/v1\/sessoes\/(\d+)\/?$/.test(apiPath)) {
      const m = apiPath.match(/\/v1\/sessoes\/(\d+)/);
      response = await handleSessaoById(m![1]);
    }
    else if (/^\/v1\/sessoes\/?$/.test(apiPath))     { response = await handleSessoes(qs); }
    else { response = json(404, { error: 'Rota não encontrada.' }); }
  }
  // ── POST routes ────────────────────────────────────────────────────────────
  else if (method === 'POST') {
    if (/^\/v1\/contato\/?$/.test(apiPath)) {
      // SMTP via TCP não é suportado em Cloudflare Workers (V8 isolate).
      let b: Record<string,string> = {};
      try { b = await request.json() as Record<string,string>; } catch {}
      if (b._hp) { response = json(200, { sucesso: true }); }
      else if (!b.nome?.trim() || !b.email?.trim() || !b.assunto?.trim() || !b.mensagem?.trim())
        response = json(400, { sucesso:false, erro:'Todos os campos são obrigatórios.' });
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email.trim()))
        response = json(400, { sucesso:false, erro:'Formato de e-mail inválido.' });
      else
        response = json(503, { sucesso:false, erro:'Envio de e-mail indisponível neste ambiente. Use a versão Render, Vercel ou Netlify.' });
    }
    else if (/^\/v1\/chat\/?$/.test(apiPath)) {
      let body: unknown = {};
      try { body = await request.json(); } catch {}
      response = await handleChat(body, env.GEMINI_API_KEY || '');
    }
    else { response = json(404, { error: 'Rota não encontrada.' }); }
  }
  else {
    response = json(405, { error: 'Método não permitido.' });
  }

  // Adiciona headers CORS à resposta
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));
  return new Response(response.body, { status: response.status, headers });
};
