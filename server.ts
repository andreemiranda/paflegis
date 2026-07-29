import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import session from 'express-session';
// vite é importado dinamicamente dentro de startServer() apenas em modo dev
// para não gerar require('vite') no topo do bundle CJS (que falharia em produção)
type ViteDevServer = import('vite').ViteDevServer;
import { GoogleGenAI } from '@google/genai';
import { slog, validateEnv, safeFetchWithRetry, checkSaplHealth } from './lib/saplBackend';
import {
  setPersistentCache,
  getPersistentCache,
  PRESEEDED_TIPOS_MATERIAS,
  PRESEEDED_TIPOS_NORMAS,
  PRESEEDED_ESTATISTICAS,
} from './lib/fallbackCache';
import { enviarEmail, validarConfigEmail } from './lib/mail/mailer';
import {
  getDocumentSeoItem,
  syncSaplSeo,
  getSeoAuditData,
  generateDynamicSitemapXml,
  buildPreRenderedHtml,
} from './lib/seo/seoCache';
import { apiKeyAuthMiddleware, apiRateLimiter } from './lib/apiKeyAuth';
import { getGeminiApiKey } from './lib/geminiKey';
import { openApiSpec } from './lib/openApiSpec';
import { stripMarkdown } from './lib/stripMarkdown';
import { determineCorsOrigin } from './lib/cors';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Rate limiters para endpoints públicos ─────────────────────────────────────
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Muitas mensagens enviadas em curto intervalo. Por favor, aguarde um minuto e tente novamente.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

const contatoRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      sucesso: false,
      erro: 'Muitas tentativas de envio em curto intervalo. Por favor, aguarde um minuto.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

// ── Env var validation ───────────────────────────────────────────────────────
validateEnv(process.env as Record<string, string | undefined>, ['GEMINI_API_KEY', 'SESSION_SECRET']);
validarConfigEmail();

// ── Session secret guard ────────────────────────────────────────────────────
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('[FATAL] A variável de ambiente SESSION_SECRET não foi definida! O servidor recusa iniciar sem SESSION_SECRET.');
  process.exit(1);
}

// ── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (requestOrigin, callback) => {
    const originToSet = determineCorsOrigin(requestOrigin);
    callback(null, originToSet === '*' ? true : originToSet);
  },
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-API-KEY'],
  credentials: true,
}));

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
    secret: SESSION_SECRET,
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

app.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await generateDynamicSitemapXml();
    res.header('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    slog('WARN', 'sitemap', 'Falha ao gerar sitemap dinâmico, enviando fallback', err);
    res.header('Content-Type', 'application/xml');
    res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xml'));
  }
});

app.get('/sitemap.xsl', (req, res) => {
  res.header('Content-Type', 'application/xml');
  res.sendFile(path.join(process.cwd(), 'public', 'sitemap.xsl'));
});

// ── Middleware de Proteção e Rate Limiting para Rotas de Dados /api/v1 ────
app.use('/api/v1', apiRateLimiter);
app.use('/api/v1', apiKeyAuthMiddleware);

// ── SEO Audit & Sync API Endpoints ──────────────────────────────────────────
app.get('/api/v1/seo-audit', (_req, res) => {
  res.json(getSeoAuditData());
});

app.all('/api/v1/sync-seo', async (_req, res) => {
  try {
    const log = await syncSaplSeo();
    res.json({ sucesso: true, log });
  } catch (err: any) {
    slog('WARN', 'seo-sync', 'Falha ao sincronizar metadados SEO', err);
    res.status(500).json({ sucesso: false, erro: err?.message || String(err) });
  }
});

// ── Pré-renderização HTML para SEO de Páginas de Documentos ────────────────
async function handleSsrDocument(
  req: express.Request,
  res: express.Response,
  type: 'materias' | 'normas' | 'sessoes'
) {
  const id = req.params.id;
  const distPath = path.join(process.cwd(), IS_PROD ? 'dist' : 'public');
  const indexFile = path.join(distPath, 'index.html');
  const fallbackFile = path.join(process.cwd(), 'index.html');

  let baseHtml = '';
  if (fs.existsSync(indexFile)) {
    baseHtml = fs.readFileSync(indexFile, 'utf-8');
  } else if (fs.existsSync(fallbackFile)) {
    baseHtml = fs.readFileSync(fallbackFile, 'utf-8');
  }

  if (!baseHtml) {
    return res.status(404).send('Página não encontrada.');
  }

  try {
    const item = await getDocumentSeoItem(type, id);
    if (item) {
      const html = buildPreRenderedHtml(baseHtml, item);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    }
  } catch (e) {
    slog('WARN', 'ssr-doc', `Falha ao pré-renderizar SEO para ${type}/${id}`, e);
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.send(baseHtml);
}

app.get('/materias/:id', (req, res) => handleSsrDocument(req, res, 'materias'));
app.get('/normas/:id', (req, res) => handleSsrDocument(req, res, 'normas'));
app.get('/sessoes/:id', (req, res) => handleSsrDocument(req, res, 'sessoes'));

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC_DOMAIN = 'https://sapl.pedroafonso.to.leg.br';

// Mapa de autores reais cadastrados no SAPL de Pedro Afonso (tipo=2: vereadores)
// Fonte: /api/base/autor/?page_size=100 - atualizar se houver mudança de legislatura
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

// ── AI Chat Endpoint ──────────────────────────────────────────────────────────
app.post(['/api/chat', '/api/v1/chat'], chatRateLimiter, async (req, res) => {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
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
    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Você é o assistente virtual do Paflegis, um aplicativo cívico e independente. Você é focado em ajudar o usuário com dúvidas sobre matérias legislativas, normas jurídicas e sessões plenárias do Legislativo de Pedro Afonso - TO. Se o usuário perguntar quem você é ou se você é da câmara, deixe claro que você é o assistente do aplicativo independente Paflegis, e não um representante oficial do órgão.

DIRETRIZES DE CONVERSA:
1. Responda em português do Brasil, de forma clara, direta, cordial e objetiva.
2. Analise todo o histórico de mensagens enviado a cada turno para manter contexto e evitar repetições.
3. Se não entender a pergunta, peça para o usuário reformular, mantendo tom profissional.
4. Você não tem acesso ao status técnico da infraestrutura da aplicação (limites de uso, erros de rede, disponibilidade do servidor). Se o usuário mencionar ter visto uma mensagem de erro técnico, não confirme nem negue o estado do sistema, apenas oriente-o a tentar novamente e, se persistir, avise que pode reportar o problema pelo formulário de contato.
5. Se a pergunta estiver claramente fora do escopo do Paflegis — ou seja, não estiver relacionada ao Legislativo de Pedro Afonso, matérias legislativas, normas jurídicas, sessões plenárias ou ao processo legislativo municipal — comece sua resposta com a tag exata [FORA_DO_ESCOPO] (sem espaço antes), explique brevemente o que você pode ajudar, mas não responda à pergunta fora de escopo com informações gerais. Exemplos de perguntas fora de escopo: receitas culinárias, esportes, entretenimento, saúde geral, questões jurídicas federais sem relação com o município, entre outros.
6. FORMATO DE TEXTO: Responda ESTRITAMENTE em TEXTO PLANO PURO. NUNCA use formatação markdown de nenhum tipo: NÃO use asteriscos (* ou **), NÃO use sublinhados (__), NÃO use hashtags (#) para títulos, NÃO use divisórias (---) e NÃO use marcadores de lista com asterisco. Para listas ou enumerações, use numeração simples (1., 2., 3.) ou parágrafos curtos. Separe tópicos apenas com quebras de linha normais.
7. Mantenha a resposta completa e conclusiva, sem interromper o raciocínio ou deixar frases incompletas.`;

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

    let rawReply: string | undefined;
    let lastErr: unknown;

    // Retry com backoff generoso e jitter (até 3 retentativas = 4 tentativas no total)
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

        // Se a resposta foi interrompida por atingir o teto de tokens, tenta re-gerar uma vez com teto maior
        if ((finishReasonStr.toUpperCase().includes('MAX') || finishReasonStr.toUpperCase().includes('LENGTH')) && generatedText.length > 0) {
          console.warn('[server.ts /api/chat] Resposta truncada por MAX_TOKENS. Tentando re-gerar com teto de 3072 tokens...');
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
            console.error('[server.ts /api/chat] Erro na tentativa de expandir tokens:', retryTokenErr);
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
          (req as any)._outOfScope = true;
        } else {
          rawReply = generatedText;
        }

        break; // Sucesso na tentativa
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

        console.error(`[server.ts /api/chat Gemini Error] Tentativa ${attempt + 1}/5 (${modelName}) falhou:`, {
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
      // Sanitização de Markdown antes de entregar ao cliente
      const cleanReply = stripMarkdown(rawReply);
      return res.json({ reply: cleanReply, outOfScope: (req as any)._outOfScope === true });
    }

    throw lastErr;
  } catch (err: any) {
    console.error('[server.ts /api/chat Fatal Error]', {
      message: err?.message || String(err),
      status: err?.status || err?.code,
      stack: err?.stack,
    });

    const msg = String(err?.message || '');
    const status = err?.status || err?.code;
    const isRateLimit = status === 429 || msg.includes('429') || msg.toUpperCase().includes('RESOURCE_EXHAUSTED');

    if (isRateLimit) {
      return res.status(429).json({
        error: 'Limite de cota de requisições excedido. Por favor, aguarde alguns instantes e tente novamente.',
      });
    }

    const isServiceUnavailable =
      err?.status >= 500 ||
      err?.code >= 500 ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('500') ||
      msg.toUpperCase().includes('SERVICE_UNAVAILABLE') ||
      msg.toUpperCase().includes('UNAVAILABLE') ||
      err?.code === 'ECONNREFUSED' ||
      err?.code === 'ENOTFOUND' ||
      err?.code === 'ETIMEDOUT' ||
      err?.code === 'ECONNRESET' ||
      msg.includes('fetch failed') ||
      msg.includes('network');

    if (isServiceUnavailable) {
      return res.status(503).json({
        error: 'O assistente está temporariamente indisponível. Por favor, tente novamente mais tarde.',
      });
    }

    return res.status(500).json({ error: 'Erro interno ao processar sua mensagem. Tente novamente.' });
  }
});

// Servir Swagger UI estático em /api-docs e /swagger-ui
const swaggerUiDir = path.join(process.cwd(), 'public', 'swagger-ui');
app.use('/api-docs', express.static(swaggerUiDir));
app.use('/swagger-ui', express.static(swaggerUiDir));

app.get(['/api-docs', '/api-docs/*', '/swagger-ui', '/swagger-ui/*'], (req, res, next) => {
  if (path.extname(req.path)) {
    return next();
  }
  res.sendFile(path.join(swaggerUiDir, 'index.html'));
});

// Servir JSON do OpenAPI
app.get('/api/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// ── Contato (formulário) ──────────────────────────────────────────────────────
app.post(['/api/contato', '/api/v1/contato'], contatoRateLimiter, async (req, res) => {
  const { nome, email, assunto, mensagem, origem, _hp } = (req.body ?? {}) as Record<string, string>;

  // Honeypot: bots preenchem este campo; humanos não. Rejeitar silenciosamente.
  if (_hp) { res.json({ sucesso: true }); return; }

  // Validação
  if (!nome?.trim() || !email?.trim() || !assunto?.trim() || !mensagem?.trim()) {
    res.status(400).json({ sucesso: false, erro: 'Todos os campos são obrigatórios.' });
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    res.status(400).json({ sucesso: false, erro: 'Formato de e-mail inválido.' });
    return;
  }

  try {
    await enviarEmail({
      nome:     nome.trim(),
      email:    email.trim(),
      assunto:  assunto.trim(),
      mensagem: mensagem.trim(),
      origem:   (origem || 'Contato').trim(),
    });
    res.json({ sucesso: true });
  } catch (err: any) {
    const errorDetails = {
      message: err?.message || String(err),
      code: err?.code,
      command: err?.command,
      response: err?.response,
    };
    slog('WARN', 'contato', 'Falha ao enviar e-mail de contato via SMTP:', errorDetails);
    console.error('[contato] Erro detalhado ao enviar e-mail via SMTP:', err);
    res.status(500).json({ sucesso: false, erro: 'Falha ao enviar e-mail. Tente novamente mais tarde.' });
  }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  const sapl = await checkSaplHealth();
  res.status(sapl.reachable ? 200 : 503).json({
    status:          sapl.reachable ? 'ok' : 'degraded',
    sapl:            sapl.reachable ? 'reachable' : 'unreachable',
    sapl_latency_ms: sapl.latencyMs,
    gemini:          process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
    env:             IS_PROD ? 'production' : 'development',
    ts:              new Date().toISOString(),
  });
});

// ── In-memory list cache ──────────────────────────────────────────────────────
// Serves stale data while SAPL is temporarily down instead of 503-ing immediately.
const LIST_CACHE_TTL_MS = parseInt(process.env.LIST_CACHE_TTL_MS || String(5 * 60 * 1000), 10);
const listCacheStore = new Map<string, { data: unknown; fetchedAt: number }>();

function getCachedList(key: string): { data: unknown; stale: boolean } | null {
  const e = listCacheStore.get(key);
  if (!e) return null;
  return { data: e.data, stale: Date.now() - e.fetchedAt > LIST_CACHE_TTL_MS };
}
function setCachedList(key: string, data: unknown): void {
  listCacheStore.set(key, { data, fetchedAt: Date.now() });
}

// Proxy Backend Endpoints

/** Busca todas as páginas de um endpoint paginado do SAPL e retorna o array completo. */
async function fetchAllPages(baseUrl: string, timeoutMs = 9000): Promise<unknown[]> {
  const all: unknown[] = [];
  let url: string | null = `${baseUrl}?page_size=100`;
  while (url) {
    const r = await safeFetchWithRetry(url, timeoutMs, 1);
    if (!r.ok) break;
    const data = await r.json();
    const results: unknown[] = data.results || (Array.isArray(data) ? data : []);
    all.push(...results);
    url = data.next ?? null;   // segue para próxima página se existir
  }
  return all;
}

app.get('/api/v1/tipos/materias', async (req, res) => {
  try {
    const items = await fetchAllPages(`${SAPL_API_BASE}/materia/tipomaterialegislativa/`);
    if (items.length) {
      setPersistentCache('tipos:materias', items);
      return res.json(items);
    }
  } catch (e) {
    slog('WARN', 'proxy-tipos-materias', 'SAPL indisponível para tipos-materias', e);
  }
  const cached = getPersistentCache<unknown[]>('tipos:materias');
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) return res.json(cached.data);
  res.json(PRESEEDED_TIPOS_MATERIAS);
});

app.get('/api/v1/tipos/normas', async (req, res) => {
  try {
    const items = await fetchAllPages(`${SAPL_API_BASE}/norma/tiponormajuridica/`);
    if (items.length) {
      setPersistentCache('tipos:normas', items);
      return res.json(items);
    }
  } catch (e) {
    slog('WARN', 'proxy-tipos-normas', 'SAPL indisponível para tipos-normas', e);
  }
  const cached = getPersistentCache<unknown[]>('tipos:normas');
  if (cached && Array.isArray(cached.data) && cached.data.length > 0) return res.json(cached.data);
  res.json(PRESEEDED_TIPOS_NORMAS);
});

app.get('/api/v1/materias', async (req, res) => {
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  const url = new URL(`${SAPL_API_BASE}/materia/materialegislativa/`);
  if (busca) url.searchParams.set('pesquisa', String(busca));
  if (tipo) url.searchParams.set('tipo', String(tipo));
  if (ano) url.searchParams.set('ano', String(ano));
  url.searchParams.set('page', String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  slog('INFO', 'proxy-materias', `Requisitando matérias no SAPL: ${url.toString()}`);

  const cacheKey = `materias:${url.toString()}`;

  try {
    const saplRes = await safeFetchWithRetry(url.toString(), 4000, 1);
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

      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data_apresentacao);
        const dA = parseBRDateToTimestamp(a.data_apresentacao);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total = data.pagination?.total_entries || data.count || items.length;
      const payload = {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total / limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return res.json(payload);
    }
  } catch (e) {
    slog('WARN', 'proxy-materias', 'SAPL indisponível para matérias, buscando fallback cache', e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return res.json({ ...cached.data, fonte: cached.source });

  const generalCache = getPersistentCache<any>('materias:last_good');
  if (generalCache && generalCache.data) return res.json({ ...generalCache.data, fonte: generalCache.source });

  res.json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' });
});

app.get('/api/v1/normas', async (req, res) => {
  const { busca, tipo, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

  const url = new URL(`${SAPL_API_BASE}/norma/normajuridica/`);
  if (busca) url.searchParams.set('pesquisa', String(busca));
  if (tipo) url.searchParams.set('tipo', String(tipo));
  if (ano) url.searchParams.set('ano', String(ano));
  url.searchParams.set('page', String(pageNum));
  url.searchParams.set('page_size', String(limitNum));

  slog('INFO', 'proxy-normas', `Requisitando normas no SAPL: ${url.toString()}`);

  const cacheKey = `normas:${url.toString()}`;

  try {
    const saplRes = await safeFetchWithRetry(url.toString(), 4000, 1);
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

      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data_publicacao);
        const dA = parseBRDateToTimestamp(a.data_publicacao);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total = data.pagination?.total_entries || data.count || items.length;
      const payload = {
        items,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: data.pagination?.total_pages || Math.ceil(total / limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return res.json(payload);
    }
  } catch (e) {
    slog('WARN', 'proxy-normas', 'SAPL indisponível para normas, buscando fallback cache', e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return res.json({ ...cached.data, fonte: cached.source });

  const generalCache = getPersistentCache<any>('normas:last_good');
  if (generalCache && generalCache.data) return res.json({ ...generalCache.data, fonte: generalCache.source });

  res.json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' });
});

app.get('/api/v1/sessoes', async (req, res) => {
  const { busca, ano, pagina, page, limite, limit, page_size } = req.query;
  const pageNum = Number(pagina || page || 1);
  const limitNum = Number(limite || limit || page_size || 10);

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

  const cacheKey = `sessoes:${buildSaplSessoesUrl(1)}:p${pageNum}:l${limitNum}`;

  try {
    const firstRes = await safeFetchWithRetry(buildSaplSessoesUrl(1), 4000, 1);
    if (firstRes.ok) {
      const firstData = await firstRes.json();
      const totalEntries: number = firstData.pagination?.total_entries ?? firstData.count ?? (firstData.results || firstData).length;
      const saplTotalPages = Math.ceil(totalEntries / SAPL_PAGE_SIZE);

      let allRaw: any[] = [...(firstData.results || firstData)];
      if (saplTotalPages > 1) {
        const extraPages = Array.from({ length: Math.min(saplTotalPages - 1, 2) }, (_, i) => i + 2);
        const extras = await Promise.all(
          extraPages.map(p =>
            safeFetchWithRetry(buildSaplSessoesUrl(p), 3500, 0)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        );
        for (const d of extras) {
          if (d) allRaw = allRaw.concat(d.results || d);
        }
      }

      let items = allRaw.map(mapSessaoItem);

      if (busca) {
        const term = String(busca).toLowerCase();
        items = items.filter((s: any) => s.tipo.toLowerCase().includes(term) || `${s.numero}/${s.ano}`.includes(term));
      }

      items.sort((a: any, b: any) => {
        if (b.ano !== a.ano) return (b.ano || 0) - (a.ano || 0);
        const dB = parseBRDateToTimestamp(b.data);
        const dA = parseBRDateToTimestamp(a.data);
        if (dB !== dA) return dB - dA;
        return Number(b.numero || 0) - Number(a.numero || 0);
      });

      const total      = items.length;
      const startIndex = (pageNum - 1) * limitNum;

      const payload = {
        items: items.slice(startIndex, startIndex + limitNum),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
        fonte: 'sapl-live',
      };
      setPersistentCache(cacheKey, payload);
      return res.json(payload);
    }
  } catch (e) {
    slog('WARN', 'proxy-sessoes', 'SAPL indisponível para sessões, buscando fallback cache', e);
  }

  const cached = getPersistentCache<any>(cacheKey);
  if (cached && cached.data) return res.json({ ...cached.data, fonte: cached.source });

  const generalCache = getPersistentCache<any>('sessoes:last_good');
  if (generalCache && generalCache.data) return res.json({ ...generalCache.data, fonte: generalCache.source });

  res.json({ items: [], total: 0, page: pageNum, limit: limitNum, totalPages: 1, sapl_indisponivel: false, fonte: 'fallback' });
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
    slog('WARN', 'disk-cache', 'Não foi possível gravar cache em disco', e);
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

  // Busca os tipos reais da API - sem hardcode
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
    // se a API de tipos falhar, *_por_tipo ficará vazio - sem inventar dados
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
    slog('INFO', 'stats-cache', 'Atualizando cache de estatísticas…');
    const data = await fetchLiveStats();
    statsCache = { data, fetchedAt: Date.now() };
    writeDiskCache(data);
    slog('INFO', 'stats-cache', 'Cache de estatísticas atualizado e gravado em disco.');
  } catch (e) {
    slog('WARN', 'stats-cache', 'Falha ao atualizar cache de estatísticas', e);
    // If we have no in-memory cache yet, try to seed from disk so the first
    // request doesn't fall back to hardcoded placeholder values.
    if (!statsCache) {
      const diskEntry = readDiskCache();
      if (diskEntry) {
        statsCache = diskEntry;
        slog('INFO', 'stats-cache', 'Cache de estatísticas carregado do disco (SAPL indisponível no momento).');
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
    slog('WARN', 'stats-endpoint', 'SAPL indisponível, tentando cache em disco', e);
    const diskEntry = readDiskCache();
    if (diskEntry) {
      statsCache = diskEntry;
      const diskAge = Math.floor((Date.now() - diskEntry.fetchedAt) / 1000);
      return res.json({ ...diskEntry.data, cache_age_s: diskAge });
    }
    return res.status(503).json({ error: 'SAPL indisponível. Tente novamente mais tarde.' });
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
    slog('INFO', 'server', `Paflegis Server rodando na porta ${PORT}`);
    // Warm up the statistics cache so the first visitor gets instant data.
    refreshStatsCache();
    // Inicia sincronização de metadados SEO em segundo plano
    syncSaplSeo().catch(e => slog('WARN', 'startup-seo', 'Falha no sync inicial de SEO', e));
  });
}

startServer();
