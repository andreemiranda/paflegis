/**
 * Vercel Serverless Function - proxy SAPL + chat Gemini
 * Substitui o Express backend quando publicado no Vercel.
 * Rota: /api/*  →  /api/index?_path=$1  (via vercel.json)
 */

import { GoogleGenAI } from '@google/genai';

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC   = 'https://sapl.pedroafonso.to.leg.br';

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

// ── helpers ────────────────────────────────────────────────────────────────
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
  if (!isNaN(p.getTime()))
    return `${String(p.getUTCDate()).padStart(2,'0')}/${String(p.getUTCMonth()+1).padStart(2,'0')}/${p.getUTCFullYear()}`;
  return s;
}

function brToTs(d?: string | null): number {
  if (!d) return 0;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
  return new Date(d).getTime() || 0;
}

function safeFetch(url: string, ms = 9000) {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

// Sem fallbacks fictícios — se o SAPL estiver indisponível, retorna vazio
const STATS_INDISPONIVEL = {
  total_materias:0, total_normas:0, total_sessoes:0,
  materias_ano_atual:0, normas_ano_atual:0, sessoes_ano_atual:0,
  materias_por_tipo:[] as {tipo:string;quantidade:number}[],
  normas_por_tipo:[]  as {tipo:string;quantidade:number}[],
  fonte:'fallback',
};

// ── handlers (mesma lógica da Netlify Function) ────────────────────────────

async function handleTiposMaterias() {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (r.ok) { const d = await r.json(); return { status:200, data: d.results || d }; }
  } catch {}
  return { status:200, data: [] };
}

async function handleTiposNormas() {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (r.ok) { const d = await r.json(); return { status:200, data: d.results || d }; }
  } catch {}
  return { status:200, data: [] };
}

async function handleMaterias(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
    if (busca)    url.searchParams.set('pesquisa', str(busca));
    if (tipo)     url.searchParams.set('tipo',     str(tipo));
    if (ano)      url.searchParams.set('ano',      str(ano));
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));
    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id:                    it.id,
        numero:                it.numero,
        ano:                   it.ano,
        tipo:                  it.tipo_materia?.descricao || it.tipo || 'Matéria Legislativa',
        ementa:                it.ementa || '',
        autor:                 extractAutor(it),
        data_apresentacao:     dateBR(it.data_apresentacao),
        situacao:              it.situacao_materia?.descricao || it.situacao || 'Em Tramitação',
        texto_original_url:    normalizeUrl(it.texto_original),
        documentos_acessorios: (it.documentoacessorio_set || []).map((d: any) => ({
          id:   d.id,
          nome: d.nome || 'Documento Acessório',
          url:  normalizeUrl(d.arquivo),
        })),
      }));
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano||0)-(a.ano||0);
        const diff = brToTs(b.data_apresentacao)-brToTs(a.data_apresentacao);
        return diff !== 0 ? diff : Number(b.numero||0)-Number(a.numero||0);
      });
      const total = data.pagination?.total_entries || data.count || items.length;
      return { status:200, data:{ items, total, page:pageNum, limit:limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1 } };
    }
  } catch {}

  return { status:503, data:{ items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true } };
}

async function handleMateriaById(id: string) {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`);
    if (r.ok) {
      const it = await r.json();
      return { status:200, data:{
        id:it.id, numero:it.numero, ano:it.ano,
        tipo:it.tipo_materia?.descricao||'Matéria Legislativa',
        ementa:it.ementa||'', autor:extractAutor(it),
        data_apresentacao:dateBR(it.data_apresentacao),
        situacao:it.situacao_materia?.descricao||'Em Tramitação',
        texto_original_url:normalizeUrl(it.texto_original),
        documentos_acessorios:(it.documentoacessorio_set||[]).map((d:any)=>({id:d.id,nome:d.nome||'Documento',url:normalizeUrl(d.arquivo)})),
        tramitacoes:(it.tramitacao_set||[]).map((t:any)=>({
          data:dateBR(t.data_tramitacao),unidade_origem:t.unidade_tramitacao_local?.nome||'',
          unidade_destino:t.unidade_tramitacao_destino?.nome||'',status:t.status?.descricao||'',
        })),
      }};
    }
  } catch {}
  return { status:404, data:{ error:'Matéria não encontrada' } };
}

async function handleNormas(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
    if (busca) url.searchParams.set('pesquisa', str(busca));
    if (tipo)  url.searchParams.set('tipo',     str(tipo));
    if (ano)   url.searchParams.set('ano',      str(ano));
    url.searchParams.set('page',      String(pageNum));
    url.searchParams.set('page_size', String(limitNum));
    const r = await safeFetch(url.toString());
    if (r.ok) {
      const data  = await r.json();
      const items = (data.results || data).map((it: any) => ({
        id:                 it.id,
        numero:             it.numero,
        ano:                it.ano,
        tipo:               it.tipo_norma?.descricao||(typeof it.__str__==='string'?it.__str__.split(' ')[0]:'Norma Jurídica'),
        ementa:             it.ementa||'',
        data_publicacao:    dateBR(it.data_publicacao||it.data),
        situacao:           'Vigente',
        assunto:            it.indexacao||it.observacao||'Legislação Municipal',
        texto_integral_url: normalizeUrl(it.texto_integral),
        anexos:             [],
      }));
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano||0)-(a.ano||0);
        const diff = brToTs(b.data_publicacao)-brToTs(a.data_publicacao);
        return diff !== 0 ? diff : Number(b.numero||0)-Number(a.numero||0);
      });
      const total = data.pagination?.total_entries || data.count || items.length;
      return { status:200, data:{ items, total, page:pageNum, limit:limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1 } };
    }
  } catch {}

  return { status:503, data:{ items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true } };
}

async function handleNormaById(id: string) {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`);
    if (r.ok) {
      const it = await r.json();
      return { status:200, data:{
        id:it.id, numero:it.numero, ano:it.ano,
        tipo:it.tipo_norma?.descricao||'Norma Jurídica',
        ementa:it.ementa||'', data_publicacao:dateBR(it.data_publicacao||it.data),
        situacao:'Vigente', assunto:it.indexacao||'Legislação Municipal',
        texto_integral_url:normalizeUrl(it.texto_integral), anexos:[],
      }};
    }
  } catch {}
  return { status:404, data:{ error:'Norma não encontrada' } };
}

async function handleSessoes(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);
  const SAPL_PS  = 100;

  function buildUrl(saplPage: number) {
    const u = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
    if (ano) { u.searchParams.set('data_inicio_0',`${str(ano)}-01-01`); u.searchParams.set('data_inicio_1',`${str(ano)}-12-31`); }
    u.searchParams.set('page',      String(saplPage));
    u.searchParams.set('page_size', String(SAPL_PS));
    return u.toString();
  }

  function mapItem(it: any) {
    const d    = dateBR(it.data_inicio);
    const sAno = it.ano||(it.data_inicio?new Date(it.data_inicio).getFullYear():2026);
    const av   = normalizeUrl(it.upload_anexo);
    const vUrl = it.url_video?.trim()||'';
    const anexos: any[] = [];
    if (av)   anexos.push({ id:it.id*100+1, nome:`Anexo Sessão nº ${it.numero}`, tipo:'Anexo', data:d, url:av });
    if (vUrl) anexos.push({ id:it.id*100+2, nome:`Gravação - Sessão nº ${it.numero}`, tipo:'Vídeo', data:d, url:vUrl });
    return {
      id:it.id, numero:it.numero, ano:sAno,
      tipo:it.__str__||(it.tipo===1?'Sessão Plenária Ordinária':'Sessão Plenária Extraordinária'),
      data:d, horario:it.hora_inicio||'19:00',
      pauta_url:normalizeUrl(it.upload_pauta), ata_url:normalizeUrl(it.upload_ata),
      youtube_url:vUrl,
      situacao:it.finalizada?'Realizada':it.iniciada?'Em Andamento':'Convocada',
      anexos,
    };
  }

  try {
    const first = await safeFetch(buildUrl(1), 10000);
    if (first.ok) {
      const fd         = await first.json();
      const totalE     = fd.pagination?.total_entries ?? fd.count ?? (fd.results||fd).length;
      const totalPages = Math.ceil(totalE / SAPL_PS);
      let allRaw: any[] = [...(fd.results||fd)];
      if (totalPages > 1) {
        const extra = await Promise.all(
          Array.from({length:totalPages-1},(_,i)=>i+2).map(p =>
            safeFetch(buildUrl(p),9000).then(r=>r.ok?r.json():null).catch(()=>null)
          )
        );
        for (const d of extra) if (d) allRaw = allRaw.concat(d.results||d);
      }
      let items = allRaw.map(mapItem);
      if (busca) { const t=str(busca).toLowerCase(); items=items.filter((s:any)=>s.tipo.toLowerCase().includes(t)||`${s.numero}/${s.ano}`.includes(t)); }
      items.sort((a:any,b:any)=>{
        if (b.ano!==a.ano) return (b.ano||0)-(a.ano||0);
        const diff=brToTs(b.data)-brToTs(a.data);
        return diff!==0?diff:Number(b.numero||0)-Number(a.numero||0);
      });
      const tot=items.length; const si=(pageNum-1)*limitNum;
      return { status:200, data:{items:items.slice(si,si+limitNum),total:tot,page:pageNum,limit:limitNum,totalPages:Math.ceil(tot/limitNum)||1} };
    }
  } catch {}

  return { status:503, data:{ items:[], total:0, page:pageNum, limit:limitNum, totalPages:0, sapl_indisponivel:true } };
}

async function handleSessaoById(id: string) {
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`);
    if (r.ok) {
      const it  = await r.json();
      const d   = dateBR(it.data_inicio);
      const ano = it.ano||(it.data_inicio?new Date(it.data_inicio).getFullYear():2026);
      const vUrl = it.url_video?.trim()||'';
      const av   = normalizeUrl(it.upload_anexo);
      const anexos: any[] = [];
      if (av)   anexos.push({ id:it.id*100+1, nome:`Anexo Sessão nº ${it.numero}`, tipo:'Anexo', data:d, url:av });
      if (vUrl) anexos.push({ id:it.id*100+2, nome:`Gravação - Sessão nº ${it.numero}`, tipo:'Vídeo', data:d, url:vUrl });
      return { status:200, data:{
        id:it.id, numero:it.numero, ano,
        tipo:it.__str__||(it.tipo===1?'Sessão Plenária Ordinária':'Sessão Plenária Extraordinária'),
        data:d, horario:it.hora_inicio||'19:00',
        pauta_url:normalizeUrl(it.upload_pauta), ata_url:normalizeUrl(it.upload_ata),
        youtube_url:vUrl,
        situacao:it.finalizada?'Realizada':it.iniciada?'Em Andamento':'Convocada',
        anexos,
      }};
    }
  } catch {}
  return { status:404, data:{ error:'Sessão não encontrada' } };
}

async function handleEstatisticas() {
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
    const [tM,tN,tS,mA,nA,sA] = await Promise.all([
      count(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?page_size=1`),
      count(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=1`),
      count(`${SAPL_API_BASE}/materia/materialegislativa/?ano=${anoAtual}&page_size=1`),
      count(`${SAPL_API_BASE}/norma/normajuridica/?ano=${anoAtual}&page_size=1`),
      count(`${SAPL_API_BASE}/sessao/sessaoplenaria/?data_inicio_0=${anoAtual}-01-01&data_inicio_1=${anoAtual}-12-31&page_size=1`),
    ]);
    // Busca tipos reais da API — sem hardcode
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
    const [mTipos,nTipos] = await Promise.all([
      Promise.all(materiaTipos.map(t=>count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.nome,quantidade:q})))),
      Promise.all(normasTipos.map(t=>count(`${SAPL_API_BASE}/norma/normajuridica/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.descricao,quantidade:q})))),
    ]);
    return { status:200, data:{
      total_materias:tM, total_normas:tN, total_sessoes:tS,
      materias_ano_atual:mA, normas_ano_atual:nA, sessoes_ano_atual:sA,
      materias_por_tipo:mTipos.filter(t=>t.quantidade>0),
      normas_por_tipo:nTipos.filter(t=>t.quantidade>0),
      fonte:'sapl-live', atualizado_em:new Date().toISOString(), cache_age_s:0,
    }};
  } catch {
    return { status:200, data:{...STATS_INDISPONIVEL,atualizado_em:new Date().toISOString(),cache_age_s:-1} };
  }
}

async function handleChat(body: any) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY)
    return { status:503, data:{ error:'Serviço de IA indisponível: chave de API não configurada.' } };
  const message  = typeof body?.message === 'string' ? body.message.trim() : '';
  const history  = Array.isArray(body?.history) ? body.history : [];
  if (!message) return { status:400, data:{ error:'Mensagem inválida.' } };
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const systemInstruction = `Você é o Assistente do Paflegis, um aplicativo cívico independente de consulta às informações legislativas públicas de Pedro Afonso - TO. Responda em português brasileiro, de forma clara e acessível. Não invente dados específicos. Nunca se apresente como representante da Câmara Municipal ou de qualquer órgão governamental.`;
    const contents = [
      ...history.filter((m:any)=>m.role==='user'||m.role==='assistant').map((m:any)=>({ role:m.role==='assistant'?'model':'user', parts:[{text:String(m.content)}] })),
      { role:'user', parts:[{text:message}] },
    ];
    const response = await ai.models.generateContent({ model:'gemini-2.0-flash', contents, config:{ systemInstruction, maxOutputTokens:512, temperature:0.7 } });
    return { status:200, data:{ reply: response.text?.trim()||'Não consegui gerar uma resposta.' } };
  } catch (err: any) {
    const msg = String(err?.message||'');
    if (err?.status===429||msg.includes('429')||msg.toUpperCase().includes('RESOURCE_EXHAUSTED'))
      return { status:429, data:{ error:'Muitas solicitações. Tente novamente em instantes.' } };
    return { status:503, data:{ error:'O assistente está temporariamente indisponível.' } };
  }
}

// ── roteador principal ─────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  // CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  // Vercel injeta _path via dest: "/api/index?_path=$1"
  // Também aceita req.url para compatibilidade local
  const rawPath: string = (() => {
    const qp = req.query?._path;
    if (qp) return '/' + (Array.isArray(qp) ? qp.join('/') : qp);
    // Fallback: extrair do req.url
    try {
      const u = new URL(req.url, 'http://localhost');
      const p = u.searchParams.get('_path');
      if (p) return '/' + p;
      return u.pathname.replace(/^\/api/, '') || '/';
    } catch { return '/'; }
  })();

  const qs: Record<string,string|string[]> = { ...req.query };
  delete (qs as any)._path;

  const method = req.method?.toUpperCase() || 'GET';
  let result: { status:number; data:unknown };

  if (method === 'GET') {
    if      (rawPath === '/v1/tipos/materias')                        result = await handleTiposMaterias();
    else if (rawPath === '/v1/tipos/normas')                          result = await handleTiposNormas();
    else if (rawPath === '/v1/materias')                              result = await handleMaterias(qs);
    else if (/^\/v1\/materias\/(\d+)\/?$/.test(rawPath))             result = await handleMateriaById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/normas')                                result = await handleNormas(qs);
    else if (/^\/v1\/normas\/(\d+)\/?$/.test(rawPath))               result = await handleNormaById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/sessoes')                               result = await handleSessoes(qs);
    else if (/^\/v1\/sessoes\/(\d+)\/?$/.test(rawPath))              result = await handleSessaoById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/estatisticas' || rawPath === '/stats')  result = await handleEstatisticas();
    else result = { status:404, data:{ error:'Endpoint não encontrado.' } };
  } else if (method === 'POST' && (rawPath === '/chat' || rawPath === '/v1/chat')) {
    result = await handleChat(req.body);
  } else {
    result = { status:404, data:{ error:'Endpoint não encontrado.' } };
  }

  res.status(result.status).json(result.data);
}
