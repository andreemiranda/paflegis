import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
// vite é importado dinamicamente dentro de startServer() apenas em modo dev
// para não gerar require('vite') no topo do bundle CJS (que falharia em produção)
type ViteDevServer = import('vite').ViteDevServer;
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Session secret guard ────────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET;
if (IS_PROD && !SESSION_SECRET) {
  console.error('[FATAL] SESSION_SECRET env var is required in production. Set it before starting.');
  process.exit(1);
}

// ── CORS ────────────────────────────────────────────────────────────────────
// In production allow only same-origin (SPA served by same server).
// In dev allow all so Vite HMR and direct API calls work.
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [];

app.use(cors(IS_PROD ? {
  origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : false,
  credentials: true,
} : { origin: true, credentials: true }));

app.use(express.json({ limit: '64kb' }));

// ── Security headers ─────────────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  next();
});

// Session middleware
app.use(
  session({
    secret: SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,
      httpOnly: true,
      sameSite: IS_PROD ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 h
    },
  })
);

// Servir imagens, manifest, browserconfig e demais assets estáticos
app.use('/images', express.static(path.join(process.cwd(), 'public', 'images')));
app.get('/manifest.json', (_req, res) => res.sendFile(path.join(process.cwd(), 'public', 'manifest.json')));
app.get('/browserconfig.xml', (_req, res) => res.sendFile(path.join(process.cwd(), 'public', 'browserconfig.xml')));

// Servir arquivos estáticos de verificação e SEO na raiz
app.get('/ads.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(process.cwd(), 'public', 'ads.txt'));
});

app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.sendFile(path.join(process.cwd(), 'public', 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
});

app.get('/sitemap.xsl', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xsl'));
});

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC_DOMAIN = 'https://sapl.pedroafonso.to.leg.br';

// Mapa de autores reais cadastrados no SAPL de Pedro Afonso (tipo=2: vereadores)
// Fonte: /api/base/autor/?page_size=100 — atualizar se houver mudança de legislatura
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

/**
 * Extrai o nome do autor de uma matéria legislativa.
 * A API do SAPL retorna `autores: [id]` (IDs), não `autoria_set` com objetos.
 * Prioridade: mapa estático → regex no __str__ → 'Não informado'.
 */
function extractAutor(it: any): string {
  const autorId = Array.isArray(it.autores) ? it.autores[0] : null;
  if (autorId && AUTOR_MAP[autorId]) return AUTOR_MAP[autorId];
  if (it.__str__) {
    const m = String(it.__str__).match(/Ver\.\s+(.+?)\s+n[º°]/i);
    if (m?.[1]) return m[1].trim();
  }
  return it.autor || 'Não informado';
}

// Helper de normalização no backend
function normalizeUrlBackend(rawUrl: string | null | undefined): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      if (
        parsed.hostname.includes('sapl') ||
        parsed.hostname.includes('pedroafonso') ||
        /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) ||
        parsed.hostname === 'localhost'
      ) {
        return `${SAPL_PUBLIC_DOMAIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }
  if (trimmed.startsWith('/')) {
    return `${SAPL_PUBLIC_DOMAIN}${trimmed}`;
  }
  return `${SAPL_PUBLIC_DOMAIN}/${trimmed}`;
}

// Formatação estrita de datas no padrão brasileiro (dd/mm/aaaa)
function formatDateBR(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const trimmed = dateStr.trim();
  if (!trimmed) return '';

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }

  const matchYMD = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchYMD) {
    const [, ano, mes, dia] = matchYMD;
    return `${dia}/${mes}/${ano}`;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const year = parsed.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  return trimmed;
}

function parseBRDateToTimestamp(dateStr?: string | null): number {
  if (!dateStr) return 0;
  const matchBR = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchBR) {
    const [, d, m, a] = matchBR;
    return new Date(`${a}-${m}-${d}`).getTime();
  }
  return new Date(dateStr).getTime() || 0;
}

// Especificação OpenAPI 3.0 do Paflegis
const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Paflegis Public API - Pedro Afonso - TO',
    version: '1.0.0',
    description:
      'API pública otimizada e normalizada do Paflegis, agregando dados de Matérias Legislativas, Normas Jurídicas e Sessões Plenárias de Pedro Afonso - TO. Fonte original oficial: SAPL Pedro Afonso-TO.',
    contact: {
      name: 'Paflegis - Transparência Legislativa',
      url: 'https://sapl.pedroafonso.to.leg.br',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Servidor Proxy e Agregador Paflegis',
    },
  ],
  paths: {
    '/materias': {
      get: {
        summary: 'Listar Matérias Legislativas',
        description: 'Retorna matérias legislativas com filtros opcionais de busca, tipo, ano e situação.',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' }, description: 'Termo de busca na ementa ou autor' },
          { name: 'tipo', in: 'query', schema: { type: 'string' }, description: 'Sigla ou ID do tipo de matéria' },
          { name: 'ano', in: 'query', schema: { type: 'string' }, description: 'Ano de apresentação' },
        ],
        responses: {
          '200': { description: 'Lista de matérias legislativas' },
        },
      },
    },
    '/materias/{id}': {
      get: {
        summary: 'Obter Detalhe de Matéria Legislativa',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da matéria legislativa com documentos acessórios e tramitações' },
          '404': { description: 'Matéria não encontrada' },
        },
      },
    },
    '/normas': {
      get: {
        summary: 'Listar Normas Jurídicas',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' } },
          { name: 'tipo', in: 'query', schema: { type: 'string' } },
          { name: 'ano', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Lista de normas jurídicas publicadas' },
        },
      },
    },
    '/normas/{id}': {
      get: {
        summary: 'Obter Detalhe de Norma Jurídica',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Detalhes da norma jurídica e anexo integral' },
        },
      },
    },
    '/sessoes': {
      get: {
        summary: 'Listar Sessões Plenárias',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' } },
          { name: 'ano', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Lista de sessões plenárias com pauta e ata' },
        },
      },
    },
    '/estatisticas': {
      get: {
        summary: 'Obter Estatísticas Legislativas',
        responses: {
          '200': { description: 'Totais e consolidados por tipo de matéria, norma e sessões' },
        },
      },
    },
  },
};

// ── AI Chat Endpoint ──────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'Serviço de IA indisponível: chave de API não configurada.' });
  }

  const { message, history } = req.body as {
    message?: string;
    history?: Array<{ role: string; content: string }>;
  };

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Mensagem inválida.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const systemInstruction = `Você é o Assistente do Paflegis, um aplicativo cívico independente de consulta às informações legislativas públicas de Pedro Afonso - TO (Tocantins, Brasil). O Paflegis NÃO é o portal oficial do governo nem da Câmara Municipal - é uma ferramenta independente que facilita o acesso a dados públicos disponibilizados pelo SAPL.
Sua função é ajudar cidadãos a entenderem e encontrarem informações sobre:
- Matérias Legislativas (Projetos de Lei, Requerimentos, Indicações, Moções, etc.)
- Normas Jurídicas (Leis Ordinárias, Leis Complementares, Decretos Legislativos, Resoluções)
- Sessões Plenárias (Ordinárias e Extraordinárias)
- Processo Legislativo municipal em geral
- Como usar o Paflegis para consultar dados públicos abertos

Responda sempre em português brasileiro, de forma clara e acessível ao cidadão comum.
Seja conciso e objetivo. Se não souber algo específico, oriente o usuário a buscar diretamente nas seções do Paflegis ou acessar o portal oficial SAPL em sapl.pedroafonso.to.leg.br.
Não invente dados, números ou informações específicas que você não sabe com certeza.
Mantenha um tom formal mas amigável e acessível.
Nunca se apresente como representante da Câmara Municipal ou de qualquer órgão governamental.`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: String(msg.content) }],
          });
        }
      }
    }

    // Add the current user message
    contents.push({ role: 'user', parts: [{ text: message.trim() }] });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: {
        systemInstruction,
        maxOutputTokens: 512,
        temperature: 0.7,
      },
    });

    const reply = response.text?.trim() ?? 'Não consegui gerar uma resposta. Tente novamente.';
    return res.json({ reply });
  } catch (err: any) {
    console.error('[AI Chat] Erro ao chamar Gemini:', err?.message ?? err);

    // Detect quota / rate-limit errors from the Gemini SDK
    const isRateLimit =
      err?.status === 429 ||
      err?.code === 429 ||
      (typeof err?.message === 'string' &&
        (err.message.includes('429') || err.message.toUpperCase().includes('RESOURCE_EXHAUSTED')));

    if (isRateLimit) {
      return res.status(429).json({
        error: 'Muitas solicitações agora. Por favor, tente novamente em instantes.',
      });
    }

    // Detect network / service-unavailability errors (the AI backend is unreachable or returned 5xx)
    const errMsg = typeof err?.message === 'string' ? err.message : '';
    const isServiceUnavailable =
      err?.status >= 500 ||
      err?.code >= 500 ||
      errMsg.includes('503') ||
      errMsg.includes('502') ||
      errMsg.includes('500') ||
      errMsg.toUpperCase().includes('SERVICE_UNAVAILABLE') ||
      errMsg.toUpperCase().includes('UNAVAILABLE') ||
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ENOTFOUND' ||
      err?.code === 'ETIMEDOUT' ||
      err?.code === 'ECONNRESET' ||
      errMsg.includes('fetch failed') ||
      errMsg.includes('network');

    if (isServiceUnavailable) {
      return res.status(503).json({
        error: 'O assistente está temporariamente indisponível. Por favor, tente novamente mais tarde.',
      });
    }

    return res.status(500).json({ error: 'Erro interno ao processar sua mensagem. Tente novamente.' });
  }
});

// Servir Swagger UI estático (arquivos originais) em /api-docs
app.use('/api-docs', express.static(path.join(process.cwd(), 'public', 'swagger-ui')));
app.get('/api-docs', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'swagger-ui', 'index.html'));
});

// Servir JSON do OpenAPI
app.get('/api/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Mock/Fallback Endpoints do Proxy Backend para alta resiliência

app.get('/api/v1/tipos/materias', async (req, res) => {
  try {
    const saplRes = await fetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (saplRes.ok) {
      const data = await saplRes.json();
      return res.json(data.results || data);
    }
  } catch (e) {
    console.warn('Proxy SAPL offline para tipos de materia:', e);
  }
  res.json([]);
});

app.get('/api/v1/tipos/normas', async (req, res) => {
  try {
    const saplRes = await fetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (saplRes.ok) {
      const data = await saplRes.json();
      return res.json(data.results || data);
    }
  } catch (e) {
    console.warn('Proxy SAPL offline para tipos de norma:', e);
  }
  res.json([]);
});

app.get('/api/v1/materias', async (req, res) => {
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
    if (busca) url.searchParams.set('pesquisa', String(busca));
    if (tipo) url.searchParams.set('tipo', String(tipo));
    if (ano) url.searchParams.set('ano', String(ano));
    url.searchParams.set('page', String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const saplRes = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (saplRes.ok) {
      const data = await saplRes.json();
      const rawItems = data.results || data;
      const items = rawItems.map((item: any) => ({
        id: item.id,
        numero: item.numero,
        ano: item.ano,
        tipo: item.tipo_materia?.descricao || item.tipo || 'Matéria Legislativa',
        ementa: item.ementa || '',
        autor: extractAutor(item),
        data_apresentacao: formatDateBR(item.data_apresentacao),
        situacao: item.situacao_materia?.descricao || item.situacao || 'Em Tramitação',
        texto_original_url: normalizeUrlBackend(item.texto_original),
        documentos_acessorios: (item.documentoacessorio_set || []).map((doc: any) => ({
          id: doc.id,
          nome: doc.nome || 'Documento Acessório',
          url: normalizeUrlBackend(doc.arquivo),
        })),
      }));

      // Ordenar em ordem regressiva temporal
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data_apresentacao);
        const dA = parseBRDateToTimestamp(a.data_apresentacao);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total = data.pagination?.total_entries || data.count || items.length;
      return res.json({
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total / limitNum) || 1,
      });
    }
  } catch (e) {
    console.warn('Proxy SAPL indisponível para matérias:', e);
  }

  res.status(503).json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
});

app.get('/api/v1/normas', async (req, res) => {
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  try {
    const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
    if (busca) url.searchParams.set('pesquisa', String(busca));
    if (tipo) url.searchParams.set('tipo', String(tipo));
    if (ano) url.searchParams.set('ano', String(ano));
    url.searchParams.set('page', String(pageNum));
    url.searchParams.set('page_size', String(limitNum));

    const saplRes = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (saplRes.ok) {
      const data = await saplRes.json();
      const rawItems = data.results || data;
      const items = rawItems.map((item: any) => ({
        id: item.id,
        numero: item.numero,
        ano: item.ano,
        tipo: item.tipo_norma?.descricao || (typeof item.__str__ === 'string' ? item.__str__.split(' ')[0] : 'Norma Jurídica'),
        ementa: item.ementa || '',
        data_publicacao: formatDateBR(item.data_publicacao || item.data),
        situacao: 'Vigente',
        assunto: item.indexacao || item.observacao || 'Legislação Municipal',
        texto_integral_url: normalizeUrlBackend(item.texto_integral),
        anexos: [],
      }));

      // Ordenar em ordem regressiva temporal
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data_publicacao);
        const dA = parseBRDateToTimestamp(a.data_publicacao);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total = data.pagination?.total_entries || data.count || items.length;
      return res.json({
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total / limitNum) || 1,
      });
    }
  } catch (e) {
    console.warn('Proxy SAPL indisponível para normas:', e);
  }

  res.status(503).json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
});

app.get('/api/v1/sessoes', async (req, res) => {
  const { busca, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  // O SAPL desta instância ignora o parâmetro `ordering` e limita page_size a
  // 100 registros. Para exibir as sessões mais recentes na página 1, buscamos
  // TODAS as páginas do SAPL em paralelo, combinamos e paginamos localmente.
  const SAPL_PAGE_SIZE = 100;

  function buildSaplSessoesUrl(saplPage: number): string {
    const u = new URL(`${SAPL_API_BASE}/sessao/sessaoplenaria/`);
    if (ano) {
      u.searchParams.set('data_inicio_0', `${ano}-01-01`);
      u.searchParams.set('data_inicio_1', `${ano}-12-31`);
    }
    u.searchParams.set('page', String(saplPage));
    u.searchParams.set('page_size', String(SAPL_PAGE_SIZE));
    return u.toString();
  }

  function mapSessaoItem(item: any) {
    const pautaUrl = normalizeUrlBackend(item.upload_pauta);
    const ataUrl   = normalizeUrlBackend(item.upload_ata);
    const videoUrl = item.url_video && item.url_video.trim() ? item.url_video.trim() : '';
    const anexoUrl = normalizeUrlBackend(item.upload_anexo);
    const sessaoDataFormatted = formatDateBR(item.data_inicio);
    const sessaoAno = item.ano || (item.data_inicio ? new Date(item.data_inicio).getFullYear() : 2026);

    const anexos: any[] = [];
    if (anexoUrl) anexos.push({ id: item.id * 100 + 1, nome: `Anexo da Sessão nº ${item.numero}`, tipo: 'Anexo', data: sessaoDataFormatted, url: anexoUrl });
    if (videoUrl) anexos.push({ id: item.id * 100 + 2, nome: `Gravação de Vídeo - Sessão nº ${item.numero}`, tipo: 'Vídeo', data: sessaoDataFormatted, url: videoUrl });

    return {
      id: item.id,
      numero: item.numero,
      ano: sessaoAno,
      tipo: item.__str__ || (item.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária'),
      data: sessaoDataFormatted,
      horario: item.hora_inicio || '19:00',
      pauta_url: pautaUrl,
      ata_url: ataUrl,
      youtube_url: videoUrl,
      situacao: item.finalizada ? 'Realizada' : item.iniciada ? 'Em Andamento' : 'Convocada',
      anexos,
    };
  }

  try {
    // 1ª requisição: obtém a 1ª página e o total de páginas do SAPL
    const firstRes = await fetch(buildSaplSessoesUrl(1), { signal: AbortSignal.timeout(12000) });
    if (firstRes.ok) {
      const firstData = await firstRes.json();
      const totalEntries: number = firstData.pagination?.total_entries ?? firstData.count ?? (firstData.results || firstData).length;
      const saplTotalPages = Math.ceil(totalEntries / SAPL_PAGE_SIZE);

      // Busca demais páginas do SAPL em paralelo (se houver)
      let allRaw: any[] = [...(firstData.results || firstData)];
      if (saplTotalPages > 1) {
        const extraPages = Array.from({ length: saplTotalPages - 1 }, (_, i) => i + 2);
        const extras = await Promise.all(
          extraPages.map(p =>
            fetch(buildSaplSessoesUrl(p), { signal: AbortSignal.timeout(12000) })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const d of extras) {
          if (d) allRaw = allRaw.concat(d.results || d);
        }
      }

      // Mapeia, filtra, ordena e pagina localmente
      let items = allRaw.map(mapSessaoItem);

      if (busca) {
        const term = String(busca).toLowerCase();
        items = items.filter((s: any) => s.tipo.toLowerCase().includes(term) || `${s.numero}/${s.ano}`.includes(term));
      }

      // Ordenação decrescente: sessões mais recentes na página 1
      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data);
        const dA = parseBRDateToTimestamp(a.data);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total      = items.length;
      const startIndex = (pageNum - 1) * limitNum;

      return res.json({
        items: items.slice(startIndex, startIndex + limitNum),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      });
    }
  } catch (e) {
    console.warn('Proxy SAPL indisponível para sessões:', e);
  }

  res.status(503).json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 0, sapl_indisponivel: true });
});

// ── Statistics cache ──────────────────────────────────────────────────────────
const STATS_TTL_MS = parseInt(process.env.STATS_TTL_MS || String(30 * 60 * 1000), 10); // default 30 min

const STATS_CACHE_DIR = path.join(process.cwd(), '.cache');
const STATS_CACHE_FILE = path.join(STATS_CACHE_DIR, 'estatisticas.json');

/** Persist a successful stats payload to disk; never throws. */
function writeDiskCache(data: Record<string, any>): void {
  try {
    fs.mkdirSync(STATS_CACHE_DIR, { recursive: true });
    fs.writeFileSync(STATS_CACHE_FILE, JSON.stringify({ data, fetchedAt: Date.now() }, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Paflegis] Não foi possível gravar cache em disco:', e);
  }
}

/** Load a previously persisted stats payload from disk; returns null if unavailable. */
function readDiskCache(): StatsCache | null {
  try {
    const raw = fs.readFileSync(STATS_CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as { data: Record<string, any>; fetchedAt: number };
    if (parsed?.data && typeof parsed.fetchedAt === 'number') {
      return { data: { ...parsed.data, fonte: 'disk-cache' }, fetchedAt: parsed.fetchedAt };
    }
  } catch {
    // file missing or corrupt - ignore
  }
  return null;
}

const STATS_INDISPONIVEL = {
  total_materias: 0, total_normas: 0, total_sessoes: 0,
  materias_ano_atual: 0, normas_ano_atual: 0, sessoes_ano_atual: 0,
  materias_por_tipo: [] as { tipo: string; quantidade: number }[],
  normas_por_tipo:   [] as { tipo: string; quantidade: number }[],
};

interface StatsCache {
  data: Record<string, any>;
  fetchedAt: number;
}

let statsCache: StatsCache | null = null;
let statsRefreshInProgress = false;

async function fetchCountStats(url: string): Promise<number> {
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return 0;
  const d = await r.json();
  return d.count ?? d.pagination?.total_entries ?? (Array.isArray(d.results) ? d.results.length : 0);
}

async function fetchLiveStats(): Promise<Record<string, any>> {
  const anoAtual = new Date().getFullYear();

  const [
    totalMaterias,
    totalNormas,
    totalSessoes,
    materiasAnoAtual,
    normasAnoAtual,
    sessoesAnoAtual,
  ] = await Promise.all([
    fetchCountStats(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=1`),
    fetchCountStats(`${SAPL_API_BASE}/norma/normajuridica/?page_size=1`),
    fetchCountStats(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=1`),
    fetchCountStats(`${SAPL_API_BASE}/materia/materialegislativa/?ano=${anoAtual}&page_size=1`),
    fetchCountStats(`${SAPL_API_BASE}/norma/normajuridica/?ano=${anoAtual}&page_size=1`),
    fetchCountStats(`${SAPL_API_BASE}/sessao/sessaoplenaria/?data_inicio_0=${anoAtual}-01-01&data_inicio_1=${anoAtual}-12-31&page_size=1`),
  ]);

  // Busca os tipos reais da API — sem hardcode
  let materiaTipos: { id: number; nome: string }[] = [];
  let normasTipos:  { id: number; descricao: string }[] = [];
  try {
    const [mTRes, nTRes] = await Promise.all([
      fetch(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`, { signal: AbortSignal.timeout(6000) }),
      fetch(`${SAPL_API_BASE}/norma/tiponormajuridica/`,        { signal: AbortSignal.timeout(6000) }),
    ]);
    if (mTRes.ok) {
      const d = await mTRes.json();
      materiaTipos = (d.results || d).map((t: any) => ({ id: t.id, nome: t.descricao || t.sigla || '' }));
    }
    if (nTRes.ok) {
      const d = await nTRes.json();
      normasTipos = (d.results || d).map((t: any) => ({ id: t.id, descricao: t.descricao || t.sigla || '' }));
    }
  } catch {
    // se a API de tipos falhar, *_por_tipo ficará vazio — sem inventar dados
  }

  const [materiaTipoCounts, normaTipoCounts] = await Promise.all([
    Promise.all(
      materiaTipos.map(t =>
        fetchCountStats(`${SAPL_API_BASE}/materia/materialegislativa/?tipo=${t.id}&page_size=1`)
          .then(quantidade => ({ tipo: t.nome, quantidade }))
      )
    ),
    Promise.all(
      normasTipos.map(t =>
        fetchCountStats(`${SAPL_API_BASE}/norma/normajuridica/?tipo=${t.id}&page_size=1`)
          .then(quantidade => ({ tipo: t.descricao, quantidade }))
      )
    ),
  ]);

  const materiasPorTipo = materiaTipoCounts.filter(t => t.quantidade > 0);
  const normasPorTipo = normaTipoCounts.filter(t => t.quantidade > 0);

  return {
    total_materias:     totalMaterias,
    total_normas:       totalNormas,
    total_sessoes:      totalSessoes,
    materias_ano_atual: materiasAnoAtual,
    normas_ano_atual:   normasAnoAtual,
    sessoes_ano_atual:  sessoesAnoAtual,
    materias_por_tipo:  materiasPorTipo,
    normas_por_tipo:    normasPorTipo,
    fonte:              'sapl-live',
    atualizado_em:      new Date().toISOString(),
  };
}

/** Refresh the cache in the background; never throws. */
async function refreshStatsCache(): Promise<void> {
  if (statsRefreshInProgress) return;
  statsRefreshInProgress = true;
  try {
    console.log('[Paflegis] Atualizando cache de estatísticas…');
    const data = await fetchLiveStats();
    statsCache = { data, fetchedAt: Date.now() };
    writeDiskCache(data);
    console.log('[Paflegis] Cache de estatísticas atualizado e gravado em disco.');
  } catch (e) {
    console.warn('[Paflegis] Falha ao atualizar cache de estatísticas:', e);
    // If we have no in-memory cache yet, try to seed from disk so the first
    // request doesn't fall back to hardcoded placeholder values.
    if (!statsCache) {
      const diskEntry = readDiskCache();
      if (diskEntry) {
        statsCache = diskEntry;
        console.log('[Paflegis] Cache de estatísticas carregado do disco (SAPL indisponível no momento).');
      }
    }
  } finally {
    statsRefreshInProgress = false;
  }
}

app.get('/api/v1/estatisticas', async (req, res) => {
  const now = Date.now();
  const cacheAge = statsCache ? now - statsCache.fetchedAt : Infinity;
  const cacheStale = cacheAge > STATS_TTL_MS;

  // If we have a cached value, return it immediately; trigger background refresh if stale.
  if (statsCache) {
    if (cacheStale) {
      refreshStatsCache(); // fire-and-forget
    }
    return res.json({ ...statsCache.data, cache_age_s: Math.floor(cacheAge / 1000) });
  }

  // No cache yet - fetch synchronously (only on the very first request after startup).
  try {
    const data = await fetchLiveStats();
    statsCache = { data, fetchedAt: Date.now() };
    writeDiskCache(data);
    return res.json({ ...data, cache_age_s: 0 });
  } catch (e) {
    console.warn('Estatísticas: SAPL indisponível, tentando cache em disco…', e);
    const diskEntry = readDiskCache();
    if (diskEntry) {
      statsCache = diskEntry;
      const diskAge = Math.floor((Date.now() - diskEntry.fetchedAt) / 1000);
      return res.json({ ...diskEntry.data, cache_age_s: diskAge });
    }
    return res.json({ ...STATS_INDISPONIVEL, fonte: 'fallback', atualizado_em: new Date().toISOString(), cache_age_s: -1 });
  }
});

// Vite Middleware em dev / Static Files em prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Import dinâmico: só executado em dev, nunca no bundle CJS de produção
    const { createServer: createViteServer } = await import('vite') as typeof import('vite');
    const vite: ViteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Paflegis Server] Rodando na porta ${PORT} em host 0.0.0.0`);
    // Warm up the statistics cache so the first visitor gets instant data.
    refreshStatsCache();
  });
}

startServer();
