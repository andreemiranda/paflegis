/**
 * Vercel Serverless Function — proxy SAPL + chat Gemini + contato
 *
 * Rota: /api/*  →  /api/index?_path=$1  (via vercel.json)
 *
 * Variáveis de ambiente (configurar em Settings → Environment Variables no Vercel):
 *   GEMINI_API_KEY      — chave da Google Generative AI
 *   SESSION_SECRET      — segredo de sessão (opcional neste runtime)
 *   EMAIL_USER          — endereço Gmail de envio (ex: seuprojeto@gmail.com)
 *   EMAIL_APP_PASSWORD  — senha de app de 16 dígitos gerada no Google
 *   EMAIL_DESTINO       — e-mail destinatário das mensagens de contato
 */

import { GoogleGenAI } from '@google/genai';
import { openApiSpec } from '../lib/openApiSpec';
import {
  getDocumentSeoItem,
  syncSaplSeo,
  getSeoAuditData,
  generateDynamicSitemapXml,
  buildPreRenderedHtml,
} from '../lib/seo/seoCache';
import { isValidApiKey, extractApiKeyFromReq, maskApiKey } from '../lib/apiKeyAuth';
import { getGeminiApiKey } from '../lib/geminiKey';
import { stripMarkdown } from '../lib/stripMarkdown';
import { applyCorsHeaders } from '../lib/cors';
import { getClientIp, checkRateLimit } from '../lib/rateLimiter';
import { slog } from '../lib/saplBackend';
import {
  setPersistentCache,
  getPersistentCache,
  PRESEEDED_TIPOS_MATERIAS,
  PRESEEDED_TIPOS_NORMAS,
  PRESEEDED_ESTATISTICAS,
} from '../lib/fallbackCache';

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC   = 'https://sapl.pedroafonso.to.leg.br';

// Mapa de autores reais cadastrados no SAPL de Pedro Afonso (tipo=2: vereadores)
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

/** Garante o parsing seguro do corpo da requisição POST no runtime Serverless Vercel (Objeto, String, Buffer ou Stream). */
async function parseRequestBody(req: any): Promise<any> {
  try {
    if (req.body) {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        return req.body;
      }
      if (typeof req.body === 'string' && req.body.trim()) {
        return JSON.parse(req.body);
      }
      if (Buffer.isBuffer(req.body)) {
        return JSON.parse(req.body.toString('utf8'));
      }
    }
  } catch (e) {
    slog('WARN', 'parseRequestBody', 'Falha ao converter req.body existente', e);
  }

  // Fallback: lê do stream HTTP se req.body não tiver sido parseado pelo Vercel
  return new Promise((resolve) => {
    let rawStr = '';
    req.on?.('data', (chunk: any) => {
      rawStr += chunk;
    });
    req.on?.('end', () => {
      if (!rawStr.trim()) return resolve({});
      try {
        resolve(JSON.parse(rawStr));
      } catch {
        resolve({});
      }
    });
    setTimeout(() => {
      if (!rawStr.trim()) return resolve({});
      try {
        resolve(JSON.parse(rawStr));
      } catch {
        resolve({});
      }
    }, 250);
  });
}

/** Fetch com timeout seguro (7000ms) e retentativa contra o SAPL. */
async function safeFetch(url: string, ms = 7000, maxRetries = 2): Promise<Response> {
  let lastErr: unknown;
  const startTime = Date.now();
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) await new Promise<void>(r => setTimeout(r, 600));
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
      if (res.status >= 400 && res.status < 500) return res;
      if (res.ok) return res;
      lastErr = new Error(`HTTP ${res.status}`);
      slog('WARN', 'safeFetch', `Sapl retornou HTTP ${res.status} na tentativa ${attempt + 1}/${maxRetries + 1} (${Date.now() - startTime}ms): ${url}`);
    } catch (e) {
      lastErr = e;
      slog('WARN', 'safeFetch', `Erro ao buscar URL (tentativa ${attempt + 1}/${maxRetries + 1}, ${Date.now() - startTime}ms): ${url}`, e);
    }
  }
  throw lastErr;
}

async function handleHealth() {
  const start = Date.now();
  try {
    const r = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`, { signal: AbortSignal.timeout(3500) });
    const latencyMs = Date.now() - start;
    return {
      status: 200,
      data: {
        status: r.ok ? 'ok' : 'degraded',
        sapl: r.ok ? 'reachable' : 'unreachable',
        sapl_http_code: r.status,
        sapl_latency_ms: latencyMs,
        gemini: getGeminiApiKey() ? 'configured' : 'not_configured',
        env: process.env.NODE_ENV || 'production',
        ts: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    slog('WARN', 'handleHealth', `SAPL inalcançável em ${latencyMs}ms`, err);
    return {
      status: 200,
      data: {
        status: 'degraded',
        sapl: 'unreachable',
        sapl_latency_ms: latencyMs,
        sapl_error: err?.message || String(err),
        gemini: getGeminiApiKey() ? 'configured' : 'not_configured',
        env: process.env.NODE_ENV || 'production',
        ts: new Date().toISOString(),
      },
    };
  }
}

/** Busca todas as páginas de um endpoint paginado do SAPL e retorna o array completo. */
async function fetchAllPages(baseUrl: string): Promise<unknown[]> {
  const all: unknown[] = [];
  let url: string | null = `${baseUrl}?page_size=100`;
  let pageCount = 0;
  while (url && pageCount < 5) {
    pageCount++;
    try {
      const r = await safeFetch(url, 4000, 1);
      if (!r.ok) break;
      const data = await r.json();
      const results: unknown[] = data.results || (Array.isArray(data) ? data : []);
      all.push(...results);
      url = data.next ?? null;
    } catch (e) {
      slog('WARN', 'fetchAllPages', `Falha ao buscar página ${pageCount} de ${baseUrl}`, e);
      break;
    }
  }
  return all;
}

// ── handlers ────────────────────────────────────────────────────────────────

async function handleTiposMaterias() {
  const cacheKey = 'tipos:materias';
  const startMs = Date.now();
  try {
    const items = await fetchAllPages(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (items.length) {
      setPersistentCache(cacheKey, items);
      return { status: 200, data: items };
    }
  } catch (e) {
    slog('WARN', 'handleTiposMaterias', `Erro no SAPL para tipos de matéria (${Date.now() - startMs}ms)`, e);
  }

  // Fallback para cache persistente ou pré-semeado
  const cached = getPersistentCache<unknown[]>(cacheKey);
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    return { status: 200, data: cached.data };
  }
  return { status: 200, data: PRESEEDED_TIPOS_MATERIAS };
}

async function handleTiposNormas() {
  const cacheKey = 'tipos:normas';
  const startMs = Date.now();
  try {
    const items = await fetchAllPages(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (items.length) {
      setPersistentCache(cacheKey, items);
      return { status: 200, data: items };
    }
  } catch (e) {
    slog('WARN', 'handleTiposNormas', `Erro no SAPL para tipos de norma (${Date.now() - startMs}ms)`, e);
  }

  // Fallback para cache persistente ou pré-semeado
  const cached = getPersistentCache<unknown[]>(cacheKey);
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
    return { status: 200, data: cached.data };
  }
  return { status: 200, data: PRESEEDED_TIPOS_NORMAS };
}

async function handleMaterias(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);
  const startMs  = Date.now();

  const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
  if (busca)    url.searchParams.set('pesquisa', str(busca));
  if (tipo)     url.searchParams.set('tipo',     str(tipo));
  if (ano)      url.searchParams.set('ano',      str(ano));
  url.searchParams.set('page',      String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  slog('INFO', 'handleMaterias', `Requisitando matérias no SAPL: ${url.toString()}`);

  const cacheKey = `materias:${url.toString()}`;

  try {
    const r = await safeFetch(url.toString(), 4000, 1);
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
      const payload = {
        items, total, page: pageNum, limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleMaterias', `Erro/Timeout ao buscar matérias (${Date.now() - startMs}ms): ${url.toString()}`, e);
  }

  // Fallback para cache persistente
  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return { status: 200, data: { ...cached.data, fonte: cached.source } };
  }

  // Tenta recuperar qualquer lista armazenada
  const generalCache = getPersistentCache<any>('materias:last_good');
  if (generalCache && generalCache.data) {
    return { status: 200, data: { ...generalCache.data, fonte: generalCache.source } };
  }

  return {
    status: 200,
    data: { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' }
  };
}

async function handleMateriaById(id: string) {
  const cacheKey = `materia_id:${id}`;
  const startMs = Date.now();
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/${id}/`, 4000, 1);
    if (r.ok) {
      const it = await r.json();
      const payload = {
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
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleMateriaById', `Erro ao buscar matéria ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return { status: 200, data: { ...cached.data, fonte: cached.source } };

  return { status: 404, data: { error: 'Matéria não encontrada' } };
}

async function handleNormas(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);
  const startMs  = Date.now();

  const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
  if (busca) url.searchParams.set('pesquisa', str(busca));
  if (tipo)  url.searchParams.set('tipo',     str(tipo));
  if (ano)   url.searchParams.set('ano',      str(ano));
  url.searchParams.set('page',      String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  slog('INFO', 'handleNormas', `Requisitando normas no SAPL: ${url.toString()}`);

  const cacheKey = `normas:${url.toString()}`;

  try {
    const r = await safeFetch(url.toString(), 4000, 1);
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
      const payload = {
        items, total, page: pageNum, limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total/limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleNormas', `Erro ao buscar normas (${Date.now() - startMs}ms): ${url.toString()}`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return { status: 200, data: { ...cached.data, fonte: cached.source } };
  }

  const generalCache = getPersistentCache<any>('normas:last_good');
  if (generalCache && generalCache.data) {
    return { status: 200, data: { ...generalCache.data, fonte: generalCache.source } };
  }

  return {
    status: 200,
    data: { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' }
  };
}

async function handleNormaById(id: string) {
  const cacheKey = `norma_id:${id}`;
  const startMs = Date.now();
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/${id}/`, 4000, 1);
    if (r.ok) {
      const it = await r.json();
      const payload = {
        id:it.id, numero:it.numero, ano:it.ano,
        tipo:it.tipo_norma?.descricao||'Norma Jurídica',
        ementa:it.ementa||'', data_publicacao:dateBR(it.data_publicacao||it.data),
        situacao:'Vigente', assunto:it.indexacao||'Legislação Municipal',
        texto_integral_url:normalizeUrl(it.texto_integral), anexos:[],
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleNormaById', `Erro ao buscar norma ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return { status: 200, data: { ...cached.data, fonte: cached.source } };

  return { status: 404, data: { error: 'Norma não encontrada' } };
}

async function handleSessoes(qs: Record<string,string|string[]>) {
  const str = (v: any) => Array.isArray(v) ? v[0] : String(v||'');
  const { busca, ano, pagina, page, limite, limit, page_size } = qs as any;
  const pageNum  = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);
  const SAPL_PS  = 100;
  const startMs  = Date.now();

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

  const cacheKey = `sessoes:${buildUrl(1)}:p${pageNum}:l${limitNum}`;

  try {
    const first = await safeFetch(buildUrl(1), 4000, 1);
    if (first.ok) {
      const fd         = await first.json();
      const totalE     = fd.pagination?.total_entries ?? fd.count ?? (fd.results||fd).length;
      const totalPages = Math.ceil(totalE / SAPL_PS);
      let allRaw: any[] = [...(fd.results||fd)];
      if (totalPages > 1) {
        const extraPages = Array.from({length: Math.min(totalPages - 1, 2)}, (_,i) => i + 2);
        const extra = await Promise.all(
          extraPages.map(p =>
            safeFetch(buildUrl(p), 3500, 0).then(r=>r.ok?r.json():null).catch(err => {
              slog('WARN', 'handleSessoes', `Falha ao buscar página extra ${p} de sessões`, err);
              return null;
            })
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
      const payload = { items: items.slice(si, si+limitNum), total: tot, page: pageNum, limit: limitNum, totalPages: Math.ceil(tot/limitNum)||1, fonte: 'sapl-live' };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleSessoes', `Erro ao buscar sessões (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return { status: 200, data: { ...cached.data, fonte: cached.source } };
  }

  const generalCache = getPersistentCache<any>('sessoes:last_good');
  if (generalCache && generalCache.data) {
    return { status: 200, data: { ...generalCache.data, fonte: generalCache.source } };
  }

  return {
    status: 200,
    data: { items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' }
  };
}

async function handleSessaoById(id: string) {
  const cacheKey = `sessao_id:${id}`;
  const startMs = Date.now();
  try {
    const r = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`, 4000, 1);
    if (r.ok) {
      const it  = await r.json();
      const d   = dateBR(it.data_inicio);
      const ano = it.ano||(it.data_inicio?new Date(it.data_inicio).getFullYear():2026);
      const vUrl = it.url_video?.trim()||'';
      const av   = normalizeUrl(it.upload_anexo);
      const anexos: any[] = [];
      if (av)   anexos.push({ id:it.id*100+1, nome:`Anexo Sessão nº ${it.numero}`, tipo:'Anexo', data:d, url:av });
      if (vUrl) anexos.push({ id:it.id*100+2, nome:`Gravação - Sessão nº ${it.numero}`, tipo:'Vídeo', data:d, url:vUrl });
      const payload = {
        id:it.id, numero:it.numero, ano,
        tipo:it.__str__||(it.tipo===1?'Sessão Plenária Ordinária':'Sessão Plenária Extraordinária'),
        data:d, horario:it.hora_inicio||'19:00',
        pauta_url:normalizeUrl(it.upload_pauta), ata_url:normalizeUrl(it.upload_ata),
        youtube_url:vUrl,
        situacao:it.finalizada?'Realizada':it.iniciada?'Em Andamento':'Convocada',
        anexos,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return { status: 200, data: payload };
    }
  } catch (e) {
    slog('WARN', 'handleSessaoById', `Erro ao buscar sessão ${id} (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return { status: 200, data: { ...cached.data, fonte: cached.source } };

  return { status: 404, data: { error: 'Sessão não encontrada' } };
}

async function handleEstatisticas() {
  const anoAtual = new Date().getFullYear();
  const cacheKey = 'estatisticas:live';
  const startMs = Date.now();

  async function count(url: string): Promise<number> {
    try {
      const r = await safeFetch(url, 3500, 0);
      if (!r.ok) return 0;
      const d = await r.json();
      return d.count ?? d.pagination?.total_entries ?? (Array.isArray(d.results)?d.results.length:0);
    } catch (e) {
      slog('WARN', 'handleEstatisticas', `Contagem falhou para ${url}`, e);
      return 0;
    }
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

    let materiaTipos: {id:number;nome:string}[]      = [];
    let normasTipos:  {id:number;descricao:string}[] = [];
    try {
      const [mTRes, nTRes] = await Promise.all([
        safeFetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, 3500, 0),
        safeFetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`,        3500, 0),
      ]);
      if (mTRes.ok) { const d=await mTRes.json(); materiaTipos=(d.results||d).map((t:any)=>({id:t.id,nome:t.descricao||t.sigla||''})); }
      if (nTRes.ok) { const d=await nTRes.json(); normasTipos=(d.results||d).map((t:any)=>({id:t.id,descricao:t.descricao||t.sigla||''})); }
    } catch (e) {
      slog('WARN', 'handleEstatisticas', `Erro ao buscar tipos para estatísticas`, e);
    }

    const [mTipos,nTipos] = await Promise.all([
      Promise.all(materiaTipos.map(t=>count(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.nome,quantidade:q})))),
      Promise.all(normasTipos.map(t=>count(`${SAPL_API_BASE}/norma/tiponormajuridica/?tipo=${t.id}&page_size=1`).then(q=>({tipo:t.descricao,quantidade:q})))),
    ]);

    const payload = {
      total_materias: tM || PRESEEDED_ESTATISTICAS.total_materias,
      total_normas: tN || PRESEEDED_ESTATISTICAS.total_normas,
      total_sessoes: tS || PRESEEDED_ESTATISTICAS.total_sessoes,
      materias_ano_atual: mA || PRESEEDED_ESTATISTICAS.materias_ano_atual,
      normas_ano_atual: nA || PRESEEDED_ESTATISTICAS.normas_ano_atual,
      sessoes_ano_atual: sA || PRESEEDED_ESTATISTICAS.sessoes_ano_atual,
      materias_por_tipo: mTipos.filter(t=>t.quantidade>0).length > 0 ? mTipos.filter(t=>t.quantidade>0) : PRESEEDED_ESTATISTICAS.materias_por_tipo,
      normas_por_tipo: nTipos.filter(t=>t.quantidade>0).length > 0 ? nTipos.filter(t=>t.quantidade>0) : PRESEEDED_ESTATISTICAS.normas_por_tipo,
      fonte: 'sapl-live',
      atualizado_em: new Date().toISOString(),
      cache_age_s: 0,
    };

    setPersistentCache(cacheKey, payload);
    return { status: 200, data: payload };
  } catch (e) {
    slog('WARN', 'handleEstatisticas', `Falha ao calcular estatísticas ao vivo (${Date.now() - startMs}ms)`, e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) {
    return { status: 200, data: { ...cached.data, fonte: cached.source } };
  }

  return { status: 200, data: PRESEEDED_ESTATISTICAS };
}

async function handleContato(body: any) {
  const { nome, email, assunto, mensagem, origem, _hp } = (body ?? {}) as Record<string,string>;
  if (_hp) return { status: 200, data: { sucesso: true } };
  if (!nome?.trim() || !email?.trim() || !assunto?.trim() || !mensagem?.trim())
    return { status: 400, data: { sucesso: false, erro: 'Todos os campos são obrigatórios.' } };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    return { status: 400, data: { sucesso: false, erro: 'Formato de e-mail inválido.' } };

  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_DESTINO) {
    try {
      const { enviarEmail } = await import('../lib/mail/mailer');
      await enviarEmail({
        nome:     nome.trim(),
        email:    email.trim(),
        assunto:  assunto.trim(),
        mensagem: mensagem.trim(),
        origem:   (origem || 'Contato').trim(),
      });
      return { status: 200, data: { sucesso: true } };
    } catch (err: any) {
      slog('ERROR', 'handleContato', 'Erro detalhado ao enviar e-mail via SMTP', {
        message: err?.message || String(err),
        code: err?.code,
        command: err?.command,
        response: err?.response,
      });
      return {
        status: 200,
        data: {
          sucesso: false,
          erro: `Falha na conexão SMTP (${err?.message || 'Erro de envio'}). Verifique as credenciais no Vercel.`,
        },
      };
    }
  }

  slog('INFO', 'handleContato', 'Mensagem de contato recebida (sem credenciais SMTP configuradas no Vercel)', {
    nome, email, assunto, mensagem, origem
  });
  return {
    status: 200,
    data: {
      sucesso: true,
      mensagem: 'Mensagem recebida e registrada com sucesso.',
    },
  };
}

async function handleChat(body: any) {
  const GEMINI_API_KEY = getGeminiApiKey();
  if (!GEMINI_API_KEY)
    return { status: 503, data: { error: 'Serviço de IA indisponível: a chave GEMINI_API_KEY precisa ser configurada nas variáveis do Vercel.' } };

  const message = (typeof body?.message === 'string' && body.message.trim())
    ? body.message.trim()
    : ((typeof body?.mensagem === 'string' && body.mensagem.trim()) ? body.mensagem.trim() : '');
  const history = Array.isArray(body?.history) ? body.history : (Array.isArray(body?.historico) ? body.historico : []);
  if (!message) return { status: 400, data: { error: 'Mensagem inválida. Certifique-se de fornecer um texto válido.' } };

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const systemInstruction = `Você é o assistente virtual do Paflegis, um aplicativo cívico e independente. Você é focado em ajudar o usuário com dúvidas sobre matérias legislativas, normas jurídicas e sessões plenárias do Legislativo de Pedro Afonso - TO. Se o usuário perguntar quem você é ou se você é da câmara, deixe claro que você é o assistente do aplicativo independente Paflegis, e não um representante oficial do órgão.

DIRETRIZES DE CONVERSA:
1. Responda em português do Brasil, de forma clara, direta, cordial e objetiva.
2. Analise todo o histórico de mensagens enviado a cada turno para manter contexto e evitar repetições.
3. Se não entender a pergunta, peça para o usuário reformular, mantendo tom profissional.
4. Você não tem acesso ao status técnico da infraestrutura da aplicação (limites de uso, erros de rede, disponibilidade do servidor). Se o usuário mencionar ter visto uma mensagem de erro técnico, não confirme nem negue o estado do sistema, apenas oriente-o a tentar novamente e, se persistir, avise que pode reportar o problema pelo formulário de contato.
5. Se a pergunta estiver claramente fora do escopo do Paflegis — ou seja, não estiver relacionada ao Legislativo de Pedro Afonso, matérias legislativas, normas jurídicas, sessões plenárias ou ao processo legislativo municipal — comece sua resposta com a tag exata [FORA_DO_ESCOPO] (sem espaço antes), explique brevemente o que você pode ajudar, mas não responda à pergunta fora de escopo com informações gerais.
6. FORMATO DE TEXTO: Responda ESTRITAMENTE em TEXTO PLANO PURO. NUNCA use formatação markdown de nenhum tipo: NÃO use asteriscos (* ou **), NÃO use sublinhados (__), NÃO use hashtags (#) para títulos, NÃO use divisórias (---) e NÃO use marcadores de lista com asterisco.
7. Mantenha a resposta completa e conclusiva, sem interromper o raciocínio ou deixar frases incompletas.`;

    const contents = [
      ...history
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content) }],
        })),
      { role: 'user', parts: [{ text: message }] },
    ];

    let rawReply: string | undefined;
    let isOutOfScope = false;
    let lastErr: unknown;

    const retryDelays = [1500, 3000, 6000, 10000];
    const modelsToTry = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash'];

    for (let attempt = 0; attempt <= 4; attempt++) {
      if (attempt > 0) {
        const jitter = Math.floor(Math.random() * 800);
        const delayMs = (retryDelays[attempt - 1] || 10000) + jitter;
        await new Promise<void>(r => setTimeout(r, delayMs));
      }

      const modelName = modelsToTry[attempt % modelsToTry.length];

      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction, maxOutputTokens: 2048, temperature: 0.5 },
        });

        const candidate = response.candidates?.[0];
        const finishReasonStr = String(candidate?.finishReason || '');
        let generatedText = response.text?.trim() || candidate?.content?.parts?.[0]?.text?.trim() || '';

        // Se a resposta foi interrompida por atingir o teto de tokens, tenta re-gerar uma vez com teto expandido
        if ((finishReasonStr.toUpperCase().includes('MAX') || finishReasonStr.toUpperCase().includes('LENGTH')) && generatedText.length > 0) {
          slog('WARN', 'handleChat', 'Resposta truncada por MAX_TOKENS. Re-gerando com teto maior (3072)...');
          try {
            const retryResp = await ai.models.generateContent({
              model: modelName,
              contents,
              config: { systemInstruction, maxOutputTokens: 3072, temperature: 0.4 },
            });
            const retryText = retryResp.text?.trim() || retryResp.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (retryText && retryText.length > generatedText.length) {
              generatedText = retryText;
            }
          } catch (retryTokenErr) {
            slog('ERROR', 'handleChat', 'Erro ao tentar expandir tokens', retryTokenErr);
          }
        }

        // Garante que o texto termine com pontuação sem cortar frases ou tópicos
        if (generatedText && !/[.!?:\s)]$/.test(generatedText)) {
          generatedText += '.';
        }

        if (!generatedText) {
          generatedText = 'Não consegui gerar uma resposta completa. Por favor, tente novamente.';
        }

        const outOfScopeTag = '[FORA_DO_ESCOPO]';
        if (generatedText.startsWith(outOfScopeTag)) {
          rawReply = generatedText.slice(outOfScopeTag.length).trimStart();
          isOutOfScope = true;
        } else {
          rawReply = generatedText;
        }

        break;
      } catch (err: any) {
        lastErr = err;
        const status = err?.status || err?.code;
        const errMsg = String(err?.message || '');
        const isQuota = status === 429 || errMsg.includes('429') || errMsg.toUpperCase().includes('RESOURCE_EXHAUSTED');

        // Se houver cabeçalho de Retry-After, ajusta a espera
        let retryHeaderSec = 0;
        if (err?.response?.headers?.['retry-after']) {
          const parsed = parseInt(err.response.headers['retry-after'], 10);
          if (!isNaN(parsed) && parsed > 0) retryHeaderSec = parsed;
        }

        slog('ERROR', 'handleChat', `Tentativa ${attempt + 1}/5 (${modelName}) falhou`, {
          status,
          message: errMsg,
          code: err?.code,
          retryHeaderSec,
        });

        if (isQuota && attempt < 4) {
          if (retryHeaderSec > 0) {
            await new Promise<void>(r => setTimeout(r, retryHeaderSec * 1000));
          }
          continue;
        }
      }
    }

    if (rawReply !== undefined) {
      const cleanReply = stripMarkdown(rawReply);
      return { status: 200, data: { reply: cleanReply, outOfScope: isOutOfScope } };
    }

    const lastErrMsg = String((lastErr as any)?.message || '');
    const isRateLimit = lastErrMsg.includes('429') || lastErrMsg.toUpperCase().includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      return {
        status: 429,
        data: {
          error: 'Limite de cota de requisições excedido. Por favor, aguarde alguns instantes e tente novamente.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      };
    }

    return {
      status: 503,
      data: {
        error: 'O assistente está temporariamente indisponível. Verifique se a chave GEMINI_API_KEY no Vercel possui cota e tente novamente.',
        code: 'SERVICE_UNAVAILABLE',
      },
    };
  } catch (err: any) {
    slog('ERROR', 'handleChat', 'Erro fatal no Chat Gemini', err);
    return {
      status: 503,
      data: {
        error: 'O assistente está temporariamente indisponível. Tente novamente em instantes.',
        code: 'SERVICE_UNAVAILABLE',
      },
    };
  }
}

// ── roteador principal ─────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  applyCorsHeaders(req, res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  const rawPath: string = (() => {
    const qp = req.query?._path;
    if (qp) return '/' + (Array.isArray(qp) ? qp.join('/') : qp);
    try {
      const u = new URL(req.url, 'http://localhost');
      const p = u.searchParams.get('_path');
      if (p) return '/' + p;
      return u.pathname.replace(/^\/api/, '') || '/';
    } catch { return '/'; }
  })();

  const qs: Record<string,string|string[]> = { ...req.query };
  delete (qs as any)._path;

  const isDataRoute =
    (rawPath.startsWith('/v1/') || rawPath === '/v1') &&
    rawPath !== '/v1/contato' &&
    rawPath !== '/v1/chat' &&
    rawPath !== '/v1/health' &&
    rawPath !== '/v1/openapi.json' &&
    rawPath !== '/v1/seo-audit';
  if (isDataRoute) {
    const key = extractApiKeyFromReq(req);
    if (!isValidApiKey(key)) {
      slog('WARN', 'auth', `Rejeitada tentativa de acesso não autorizada. Rota: ${rawPath} | Key: ${maskApiKey(key)}`);
      res.status(401).json({
        error: 'Chave de API ausente ou inválida. Forneça um cabeçalho x-api-key válido.',
        code: 'UNAUTHORIZED_API_KEY',
      });
      return;
    }
  }

  const method = req.method?.toUpperCase() || 'GET';
  let result: { status:number; data:unknown };

  if (method === 'GET') {
    if (rawPath === '/sitemap.xml') {
      try {
        const xml = await generateDynamicSitemapXml();
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.status(200).send(xml);
        return;
      } catch (err) {
        slog('ERROR', 'sitemap', 'Falha ao gerar sitemap.xml', err);
        res.setHeader('Content-Type', 'application/xml');
        res.status(500).send('<?xml version="1.0"?><error>Falha ao gerar sitemap</error>');
        return;
      }
    }

    if (rawPath === '/openapi.json' || rawPath === '/v1/openapi.json') {
      res.status(200).json(openApiSpec);
      return;
    }

    if (rawPath === '/v1/seo-audit' || rawPath === '/seo-audit') {
      res.status(200).json(getSeoAuditData());
      return;
    }

    if (rawPath === '/v1/sync-seo' || rawPath === '/sync-seo') {
      const log = await syncSaplSeo();
      res.status(200).json({ sucesso: true, log });
      return;
    }

    const ssrMatch = rawPath.match(/^\/ssr\/(materias|normas|sessoes)\/(\d+)\/?$/);
    if (ssrMatch) {
      const type = ssrMatch[1] as 'materias' | 'normas' | 'sessoes';
      const id = ssrMatch[2];
      try {
        const item = await getDocumentSeoItem(type, id);
        const baseHtml = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Paflegis - Processo Legislativo Aberto</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
        if (item) {
          const html = buildPreRenderedHtml(baseHtml, item);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.status(200).send(html);
          return;
        }
      } catch (e) {
        slog('WARN', 'ssr', `Erro ao pré-renderizar ${type}/${id}`, e);
      }
    }

    if      (rawPath === '/health' || rawPath === '/v1/health')       result = await handleHealth();
    else if (rawPath === '/v1/tipos/materias')                        result = await handleTiposMaterias();
    else if (rawPath === '/v1/tipos/normas')                          result = await handleTiposNormas();
    else if (rawPath === '/v1/materias')                              result = await handleMaterias(qs);
    else if (/^\/v1\/materias\/(\d+)\/?$/.test(rawPath))             result = await handleMateriaById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/normas')                                result = await handleNormas(qs);
    else if (/^\/v1\/normas\/(\d+)\/?$/.test(rawPath))               result = await handleNormaById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/sessoes')                               result = await handleSessoes(qs);
    else if (/^\/v1\/sessoes\/(\d+)\/?$/.test(rawPath))              result = await handleSessaoById(rawPath.match(/\d+/)![0]);
    else if (rawPath === '/v1/estatisticas' || rawPath === '/stats')  result = await handleEstatisticas();
    else result = { status:404, data:{ error:'Endpoint não encontrado.' } };
  } else if (method === 'POST') {
    const parsedBody = await parseRequestBody(req);

    if (rawPath === '/v1/sync-seo' || rawPath === '/sync-seo') {
      const log = await syncSaplSeo();
      res.status(200).json({ sucesso: true, log });
      return;
    }
    if (rawPath === '/v1/contato' || rawPath === '/contato') {
      const clientIp = getClientIp(req);
      const rl = checkRateLimit(clientIp, 5, 60 * 1000);
      if (!rl.allowed) {
        res.setHeader('Retry-After', '60');
        res.status(429).json({
          sucesso: false,
          erro: 'Muitas tentativas de envio em curto intervalo. Por favor, aguarde um minuto.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
        return;
      }
      result = await handleContato(parsedBody);
    } else if (rawPath === '/chat' || rawPath === '/v1/chat') {
      const clientIp = getClientIp(req);
      const rl = checkRateLimit(clientIp, 10, 60 * 1000);
      if (!rl.allowed) {
        res.setHeader('Retry-After', '60');
        res.status(429).json({
          error: 'Muitas mensagens enviadas em curto intervalo. Por favor, aguarde um minuto e tente novamente.',
          code: 'RATE_LIMIT_EXCEEDED',
        });
        return;
      }
      result = await handleChat(parsedBody);
    } else {
      result = { status: 404, data: { error: 'Endpoint não encontrado.' } };
    }
  } else {
    result = { status:404, data:{ error:'Endpoint não encontrado.' } };
  }

  res.status(result.status).json(result.data);
}
