/**
 * Netlify Serverless Function - proxy SAPL + chat Gemini
 * Substitui o Express backend quando o app é publicado no Netlify Pages.
 * Rota: /api/*  →  /.netlify/functions/api/*  (via redirect no netlify.toml)
 */

import { GoogleGenAI } from '@google/genai';

const SAPL_API_BASE   = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC     = 'https://sapl.pedroafonso.to.leg.br';

// Mapa de autores reais cadastrados no SAPL de Pedro Afonso (tipo=2: vereadores)
// Fonte: /api/base/autor/?page_size=100
const AUTOR_MAP: Record<number, string> = {
  1:  'Marquim Catabriga',
  2:  'Gislayson Lacerda',
  3:  'Jader Mariano',
  4:  'Joilson Boca Preta',
  5:  'João do Povo',
  6:  'Lili Benício',
  7:  'Mirleyson Soares',
  8:  'Sipriano Soares',
  9:  'Breno Alves',
  14: 'Agnaldo Lima',
  15: 'José de Ribamar Coelho',
  16: 'Fabrício Martins',
  17: 'Antonio Neto',
  18: 'Mirneuton Soares',
  19: 'Pedro Belarmino',
  20: 'Rômulo Soares',
};

function extractAutor(it: any): string {
  const autorId = Array.isArray(it.autores) ? it.autores[0] : null;
  if (autorId && AUTOR_MAP[autorId]) return AUTOR_MAP[autorId];
  if (it.__str__) {
    const m = String(it.__str__).match(/Ver\.\s+(.+?)\s+n[º°]/i);
    if (m?.[1]) return m[1].trim();
  }
  return it.autor || 'Não informado';
}
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// ── tipos mínimos Netlify (evita dependência extra) ────────────────────────
interface NetlifyEvent {
  path: string;
  httpMethod: string;
  queryStringParameters: Record<string, string> | null;
  body: string | null;
}
interface NetlifyResponse { statusCode: number; headers: Record<string, string>; body: string }

// ── helpers ────────────────────────────────────────────────────────────────
function json(status: number, data: unknown): NetlifyResponse {
  return { statusCode: status, headers: CORS_HEADERS, body: JSON.stringify(data) };
}

function normalizeUrl(raw?: string | null): string {
  if (!raw) return '';
  const s = raw.trim();
  if (s.includes('youtube.com') || s.includes('youtu.be') || s.includes('vimeo.com')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.hostname.includes('sapl') || u.hostname.includes('pedroafonso') ||
          /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname) || u.hostname === 'localhost') {
        return `${SAPL_PUBLIC}${u.pathname}${u.search}${u.hash}`;
      }
      return s;
    } catch { return s; }
  }
  if (s.startsWith('/')) return `${SAPL_PUBLIC}${s}`;
  return `${SAPL_PUBLIC}/${s}`;
}

function dateBR(d?: string | null): string {
  if (!d) return '';
  const s = d.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const p = new Date(s);
  if (!isNaN(p.getTime())) {
    return `${String(p.getUTCDate()).padStart(2,'0')}/${String(p.getUTCMonth()+1).padStart(2,'0')}/${p.getUTCFullYear()}`;
  }
  return s;
}

function brToTs(d?: string | null): number {
  if (!d) return 0;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
  return new Date(d).getTime() || 0;
}

/** Fetch with timeout + linear-backoff retry (4xx not retried). */
async function safeFetch(url: string, timeoutMs = 9000, maxRetries = 2): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await new Promise<void>(r => setTimeout(r, attempt * 1000));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.status >= 400 && res.status < 500) return res;
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

async function handleHealth(): Promise<NetlifyResponse> {
  const start = Date.now();
  try {
    const r = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    return json(r.ok ? 200 : 503, {
      status: r.ok ? 'ok' : 'degraded', sapl: r.ok ? 'reachable' : 'unreachable',
      sapl_latency_ms: latencyMs, gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
      ts: new Date().toISOString(),
    });
  } catch {
    return json(503, { status: 'degraded', sapl: 'unreachable', sapl_latency_ms: Date.now() - start, ts: new Date().toISOString() });
  }
}


// ── handlers ───────────────────────────────────────────────────────────────

async function handleTiposMaterias(): Promise<NetlifyResponse> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (r.ok) { const d = await r.json(); return json(200, d.results || d); }
  } catch {}
  return json(503, { error: 'SAPL indisponível para tipos de matéria.' });
}

async function handleTiposNormas(): Promise<NetlifyResponse> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (r.ok) { const d = await r.json(); return json(200, d.results || d); }
  } catch {}
  return json(503, { error: 'SAPL indisponível para tipos de norma.' });
}

async function handleMaterias(qs: Record<string,string>): Promise<NetlifyResponse> {
  const { busca, tipo, ano, situacao, pagina, page, limite, limit, page_size } = qs;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
    if (busca)    url.searchParams.set('pesquisa', busca);
    if (tipo)     url.searchParams.set('tipo', tipo);
    if (ano)      url.searchParams.set('ano', ano);
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id:                   it.id,
        numero:               it.numero,
        ano:                  it.ano,
        tipo:                 it.tipo_materia?.descricao || it.tipo || 'Matéria Legislativa',
        ementa:               it.ementa || '',
        autor:                extractAutor(it),
        data_apresentacao:    dateBR(it.data_apresentacao),
        situacao:             it.situacao_materia?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url:   normalizeUrl(it.texto_original),
        documentos_acessorios:(it.documentoacessorio_set || []).map((d: any) => ({
          id:   d.id,
          nome: d.nome || 'Documento Acessório',
          url:  normalizeUrl(d.arquivo),
        })),
      }));
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano||0) - (a.ano||0);
        const diff = brToTs(b.data_apresentacao) - brToTs(a.data_apresentacao);
        return diff !== 0 ? diff : Number(b.numero||0) - Number(a.numero||0);
      });
      const total = data.pagination?.total_entries || data.count || items.length;
      return json(200, { items, total, page: pageNum, limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1 });
    }
  } catch {}

  return json(503, { items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true });
}

async function handleMateriaById(id: string): Promise<NetlifyResponse> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`);
    if (r.ok) {
      const it = await r.json();
      return json(200, {
        id: it.id, numero: it.numero, ano: it.ano,
        tipo: it.tipo_materia?.descricao || 'Matéria Legislativa',
        ementa: it.ementa || '', autor: extractAutor(it),
        data_apresentacao: dateBR(it.data_apresentacao),
        situacao: it.situacao_materia?.descricao || 'Em Tramitação',
        texto_original_url: normalizeUrl(it.texto_original),
        documentos_acessorios: (it.documentoacessorio_set||[]).map((d:any)=>({ id:d.id, nome:d.nome||'Documento', url:normalizeUrl(d.arquivo) })),
        tramitacoes: (it.tramitacao_set||[]).map((t:any)=>({
          data:dateBR(t.data_tramitacao), unidade_origem:t.unidade_tramitacao_local?.nome||'',
          unidade_destino:t.unidade_tramitacao_destino?.nome||'', status:t.status?.descricao||'',
        })),
      });
    }
  } catch {}
  return json(404, { error: 'Matéria não encontrada' });
}

async function handleNormas(qs: Record<string,string>): Promise<NetlifyResponse> {
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = qs;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
    if (busca) url.searchParams.set('pesquisa', busca);
    if (tipo)  url.searchParams.set('tipo', tipo);
    if (ano)   url.searchParams.set('ano', ano);
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id:                 it.id,
        numero:             it.numero,
        ano:                it.ano,
        tipo:               it.tipo_norma?.descricao || (typeof it.__str__==='string' ? it.__str__.split(' ')[0] : 'Norma Jurídica'),
        ementa:             it.ementa || '',
        data_publicacao:    dateBR(it.data_publicacao || it.data),
        situacao:           'Vigente',
        assunto:            it.indexacao || it.observacao || 'Legislação Municipal',
        texto_integral_url: normalizeUrl(it.texto_integral),
        anexos:             [],
      }));
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano||0)-(a.ano||0);
        const diff = brToTs(b.data_publicacao)-brToTs(a.data_publicacao);
        return diff !== 0 ? diff : Number(b.numero||0)-Number(a.numero||0);
      });
      const total = data.pagination?.total_entries || data.count || items.length;
      return json(200, { items, total, page:pageNum, limit:limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1 });
    }
  } catch {}

  return json(503, { items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true });
}

async function handleNormaById(id: string): Promise<NetlifyResponse> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`);
    if (r.ok) {
      const it = await r.json();
      return json(200, {
        id:it.id, numero:it.numero, ano:it.ano,
        tipo:it.tipo_norma?.descricao||'Norma Jurídica',
        ementa:it.ementa||'', data_publicacao:dateBR(it.data_publicacao||it.data),
        situacao:'Vigente', assunto:it.indexacao||'Legislação Municipal',
        texto_integral_url:normalizeUrl(it.texto_integral), anexos:[],
      });
    }
  } catch {}
  return json(404, { error: 'Norma não encontrada' });
}

async function handleSessoes(qs: Record<string,string>): Promise<NetlifyResponse> {
  const { busca, ano, pagina, page, limite, limit, page_size } = qs;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);
  const SAPL_PS  = 100;

  function buildUrl(saplPage: number) {
    const u = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
    if (ano) { u.searchParams.set('data_inicio_0',`${ano}-01-01`); u.searchParams.set('data_inicio_1',`${ano}-12-31`); }
    u.searchParams.set('page',      String(saplPage));
    u.searchParams.set('page_size', String(SAPL_PS));
    return u.toString();
  }

  function mapItem(it: any) {
    const d    = dateBR(it.data_inicio);
    const sAno = it.ano || (it.data_inicio ? new Date(it.data_inicio).getFullYear() : 2026);
    const anexoUrl = normalizeUrl(it.upload_anexo);
    const videoUrl = it.url_video?.trim() || '';
    const anexos: any[] = [];
    if (anexoUrl) anexos.push({ id:it.id*100+1, nome:`Anexo Sessão nº ${it.numero}`, tipo:'Anexo', data:d, url:anexoUrl });
    if (videoUrl) anexos.push({ id:it.id*100+2, nome:`Gravação - Sessão nº ${it.numero}`, tipo:'Vídeo', data:d, url:videoUrl });
    return {
      id:it.id, numero:it.numero, ano:sAno,
      tipo:it.__str__||(it.tipo===1?'Sessão Plenária Ordinária':'Sessão Plenária Extraordinária'),
      data:d, horario:it.hora_inicio||'19:00',
      pauta_url:normalizeUrl(it.upload_pauta),
      ata_url:normalizeUrl(it.upload_ata),
      youtube_url:videoUrl,
      situacao:it.finalizada?'Realizada':it.iniciada?'Em Andamento':'Convocada',
      anexos,
    };
  }

  try {
    const first = await safeFetch(buildUrl(1), 10000);
    if (first.ok) {
      const fd          = await first.json();
      const total_e     = fd.pagination?.total_entries ?? fd.count ?? (fd.results||fd).length;
      const totalPages  = Math.ceil(total_e / SAPL_PS);
      let allRaw: any[] = [...(fd.results || fd)];

      if (totalPages > 1) {
        const extra = await Promise.all(
          Array.from({length:totalPages-1},(_,i)=>i+2).map(p =>
            safeFetch(buildUrl(p), 9000).then(r=>r.ok?r.json():null).catch(()=>null)
          )
        );
        for (const d of extra) if (d) allRaw = allRaw.concat(d.results || d);
      }

      let items = allRaw.map(mapItem);
      if (busca) { const t=busca.toLowerCase(); items=items.filter((s:any)=>s.tipo.toLowerCase().includes(t)||`${s.numero}/${s.ano}`.includes(t)); }
      items.sort((a:any,b:any)=>{
        if (b.ano!==a.ano) return (b.ano||0)-(a.ano||0);
        const diff=brToTs(b.data)-brToTs(a.data);
        return diff!==0?diff:Number(b.numero||0)-Number(a.numero||0);
      });
      const tot=items.length; const si=(pageNum-1)*limitNum;
      return json(200,{items:items.slice(si,si+limitNum),total:tot,page:pageNum,limit:limitNum,totalPages:Math.ceil(tot/limitNum)||1});
    }
  } catch {}

  return json(503, { items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true });
}

async function handleSessaoById(id: string): Promise<NetlifyResponse> {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`);
    if (r.ok) {
      const it  = await r.json();
      const d   = dateBR(it.data_inicio);
      const ano = it.ano || (it.data_inicio ? new Date(it.data_inicio).getFullYear() : 2026);
      const videoUrl = it.url_video?.trim() || '';
      const anexos: any[] = [];
      const av = normalizeUrl(it.upload_anexo);
      if (av)       anexos.push({ id:it.id*100+1, nome:`Anexo Sessão nº ${it.numero}`, tipo:'Anexo', data:d, url:av });
      if (videoUrl) anexos.push({ id:it.id*100+2, nome:`Gravação - Sessão nº ${it.numero}`, tipo:'Vídeo', data:d, url:videoUrl });
      return json(200,{
        id:it.id, numero:it.numero, ano,
        tipo:it.__str__||(it.tipo===1?'Sessão Plenária Ordinária':'Sessão Plenária Extraordinária'),
        data:d, horario:it.hora_inicio||'19:00',
        pauta_url:normalizeUrl(it.upload_pauta), ata_url:normalizeUrl(it.upload_ata),
        youtube_url:videoUrl,
        situacao:it.finalizada?'Realizada':it.iniciada?'Em Andamento':'Convocada',
        anexos,
      });
    }
  } catch {}
  return json(404, { error: 'Sessão não encontrada' });
}

async function handleEstatisticas(): Promise<NetlifyResponse> {
  const anoAtual = new Date().getFullYear();

  async function count(url: string): Promise<number> {
    try {
      const r = await safeFetch(url, 7000);
      if (!r.ok) return 0;
      const d = await r.json();
      return d.count ?? d.pagination?.total_entries ?? (Array.isArray(d.results)?d.results.length:0);
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

    // Busca tipos reais da API - sem hardcode
    let materiaTipos: {id:number;nome:string}[]      = [];
    let normasTipos:  {id:number;descricao:string}[] = [];
    try {
      const [mTRes, nTRes] = await Promise.all([
        safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, 6000),
        safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`,        6000),
      ]);
      if (mTRes.ok) { const d=await mTRes.json(); materiaTipos=(d.results||d).map((t:any)=>({id:t.id,nome:t.descricao||t.sigla||''})); }
      if (nTRes.ok) { const d=await nTRes.json(); normasTipos=(d.results||d).map((t:any)=>({id:t.id,descricao:t.descricao||t.sigla||''})); }
    } catch {}
    const [mTipos, nTipos] = await Promise.all([
      Promise.all(materiaTipos.map(t=>count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.nome,quantidade:q})))),
      Promise.all(normasTipos.map(t=>count(`${SAPL_API_BASE}/norma/normajuridica/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.descricao,quantidade:q})))),
    ]);

    return json(200,{
      total_materias:tM, total_normas:tN, total_sessoes:tS,
      materias_ano_atual:mA, normas_ano_atual:nA, sessoes_ano_atual:sA,
      materias_por_tipo:mTipos.filter(t=>t.quantidade>0),
      normas_por_tipo:nTipos.filter(t=>t.quantidade>0),
      fonte:'sapl-live', atualizado_em:new Date().toISOString(), cache_age_s:0,
    });
  } catch {
    return json(503, { error: 'SAPL indisponível para estatísticas. Tente novamente.' });
  }
}

async function handleContato(rawBody: string | null): Promise<NetlifyResponse> {
  let body: Record<string,string> = {};
  try { body = JSON.parse(rawBody || '{}'); } catch {}
  const { nome, email, assunto, mensagem, origem, _hp } = body;
  if (_hp) return json(200, { sucesso:true });
  if (!nome?.trim() || !email?.trim() || !assunto?.trim() || !mensagem?.trim())
    return json(400, { sucesso:false, erro:'Todos os campos são obrigatórios.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return json(400, { sucesso:false, erro:'Formato de e-mail inválido.' });
  try {
    const { enviarEmailHttp } = await import('../../lib/mail/http-mailer');
    await enviarEmailHttp(
      { nome:nome.trim(), email:email.trim(), assunto:assunto.trim(), mensagem:mensagem.trim(), origem:(origem||'Contato').trim() },
      { apiKey: process.env.RESEND_API_KEY||'', destino: process.env.EMAIL_DESTINO||'', from: process.env.RESEND_FROM },
    );
    return json(200, { sucesso:true });
  } catch (err) {
    console.error('[contato]', String(err));
    return json(500, { sucesso:false, erro:'Falha ao enviar e-mail. Tente novamente mais tarde.' });
  }
}

async function handleChat(rawBody: string | null): Promise<NetlifyResponse> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return json(503, { error: 'Serviço de IA indisponível: chave de API não configurada.' });

  let message = '', history: Array<{role:string;content:string}> = [];
  try { const b = JSON.parse(rawBody||'{}'); message=b.message||''; history=b.history||[]; } catch {}
  if (!message.trim()) return json(400, { error: 'Mensagem inválida.' });

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const systemInstruction = `Você é o assistente do Paflegis, focado em ajudar o usuário com dúvidas sobre matérias legislativas, normas jurídicas e sessões plenárias.

DIRETRIZES DE CONVERSA:
1. Responda em português do Brasil, de forma clara, direta e cordial.
2. Analise todo o histórico de mensagens enviado a cada turno para manter contexto e evitar repetições.
3. Se não entender a pergunta, peça para o usuário reformular, mantendo tom profissional.
4. Você não tem acesso ao status técnico da infraestrutura da aplicação (limites de uso, erros de rede, disponibilidade do servidor). Se o usuário mencionar ter visto uma mensagem de erro técnico, não confirme nem negue o estado do sistema, apenas oriente-o a tentar novamente e, se persistir, avise que pode reportar o problema pelo formulário de contato.`;
    const contents = [
      ...history.filter(m=>m.role==='user'||m.role==='assistant').map(m=>({ role:m.role==='assistant'?'model':'user', parts:[{text:String(m.content)}] })),
      { role:'user', parts:[{text:message.trim()}] },
    ];
    // Retry com backoff exponencial: até 2 tentativas adicionais ao receber 429 do Gemini.
    let reply: string | undefined;
    let lastErr: unknown;
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (attempt > 0) await new Promise<void>(r => setTimeout(r, attempt * 2000));
      try {
        const response = await ai.models.generateContent({ model:'gemini-2.0-flash', contents, config:{ systemInstruction, maxOutputTokens:512, temperature:0.7 } });
        reply = response.text?.trim() || 'Não consegui gerar uma resposta.';
        break;
      } catch (err: any) {
        const isQuota = err?.status===429 || (typeof err?.message==='string' && (err.message.includes('429') || err.message.toUpperCase().includes('RESOURCE_EXHAUSTED')));
        if (isQuota && attempt < 2) { lastErr = err; continue; }
        throw err;
      }
    }
    if (reply !== undefined) return json(200, { reply });
    throw lastErr;
  } catch (err: any) {
    const msg = String(err?.message||'');
    if (err?.status===429||msg.includes('429')||msg.toUpperCase().includes('RESOURCE_EXHAUSTED'))
      return json(429, { error: 'Muitas solicitações. Tente novamente em instantes.' });
    return json(503, { error: 'O assistente está temporariamente indisponível.' });
  }
}

// ── roteador principal ─────────────────────────────────────────────────────
export const handler = async (event: NetlifyEvent): Promise<NetlifyResponse> => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Netlify pode enviar o path como /.netlify/functions/api/v1/materias
  // ou como o path original /api/v1/materias - ambos devem virar /v1/materias
  const apiPath = event.path
    .replace(/^\/.netlify\/functions\/api/, '')
    .replace(/^\/api/, '')
    || '/';
  const qs      = event.queryStringParameters || {};
  const method  = event.httpMethod;

  if (method === 'GET') {
    if (apiPath === '/health' || apiPath === '/v1/health')       return handleHealth();
    if (apiPath === '/v1/tipos/materias')                        return handleTiposMaterias();
    if (apiPath === '/v1/tipos/normas')                          return handleTiposNormas();
    if (apiPath === '/v1/materias')                              return handleMaterias(qs);
    if (/^\/v1\/materias\/\d+\/?$/.test(apiPath))               return handleMateriaById(apiPath.match(/(\d+)\/?$/)![1]);
    if (apiPath === '/v1/normas')                                return handleNormas(qs);
    if (/^\/v1\/normas\/\d+\/?$/.test(apiPath))                 return handleNormaById(apiPath.match(/(\d+)\/?$/)![1]);
    if (apiPath === '/v1/sessoes')                               return handleSessoes(qs);
    if (/^\/v1\/sessoes\/\d+\/?$/.test(apiPath))                return handleSessaoById(apiPath.match(/(\d+)\/?$/)![1]);
    if (apiPath === '/v1/estatisticas' || apiPath === '/stats')  return handleEstatisticas();
  }
  if (method === 'POST' && (apiPath === '/v1/contato' || apiPath === '/contato')) return handleContato(event.body);
  if (method === 'POST' && (apiPath === '/chat'       || apiPath === '/v1/chat')) return handleChat(event.body);

  return json(404, { error: 'Endpoint não encontrado.' });
};
