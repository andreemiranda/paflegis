/**
 * lib/seo/seoCache.ts — Sincronização e cache de metadados SEO para Paflegis.
 */

import { extrairPalavrasChave, formatarMetaKeywords } from './keywords';

export interface DocumentSeoItem {
  id: string | number;
  type: 'materias' | 'normas' | 'sessoes';
  title: string;
  description: string;
  keywords: string[];
  date: string;
  originalUrl: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  lastUpdated: string;
}

export interface SyncLog {
  timestamp: string;
  materiasCount: number;
  normasCount: number;
  sessoesCount: number;
  totalProcessed: number;
  errorsCount: number;
  details: string[];
}

const SAPL_API_BASE = 'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_PUBLIC_DOMAIN = 'https://sapl.pedroafonso.to.leg.br';
const PUBLIC_DOMAIN = 'https://paflegis.vercel.app';

// Armazenamento em memória do cache de SEO
const seoCacheStore = new Map<string, DocumentSeoItem>();
let lastSyncLog: SyncLog | null = null;
let isSyncing = false;

function buildKey(type: string, id: string | number): string {
  return `${type}:${id}`;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return m ? m[1] : null;
}

function normalizeUrl(raw?: string | null): string {
  if (!raw) return '';
  const s = raw.trim();
  if (!s) return '';
  if (s.includes('youtube.com') || s.includes('youtu.be') || s.includes('vimeo.com')) return s;
  if (s.startsWith('http://') || s.startsWith('https://')) {
    try {
      const u = new URL(s);
      if (u.hostname.includes('sapl') || u.hostname.includes('pedroafonso') || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) {
        return `${SAPL_PUBLIC_DOMAIN}${u.pathname}${u.search}${u.hash}`;
      }
      return s;
    } catch { return s; }
  }
  if (s.startsWith('/')) return `${SAPL_PUBLIC_DOMAIN}${s}`;
  return `${SAPL_PUBLIC_DOMAIN}/${s}`;
}

/**
 * Busca e guarda em cache o metadado SEO de um documento individual sob demanda.
 */
export async function getDocumentSeoItem(
  type: 'materias' | 'normas' | 'sessoes',
  id: string
): Promise<DocumentSeoItem | null> {
  const key = buildKey(type, id);
  if (seoCacheStore.has(key)) {
    return seoCacheStore.get(key)!;
  }

  try {
    let endpoint = '';
    if (type === 'materias') endpoint = `${SAPL_API_BASE}/materia/materialegislativa/${id}/`;
    else if (type === 'normas') endpoint = `${SAPL_API_BASE}/norma/normajuridica/${id}/`;
    else if (type === 'sessoes') endpoint = `${SAPL_API_BASE}/sessao/sessaoplenaria/${id}/`;

    const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;

    const data = await res.json();
    const nowIso = new Date().toISOString();

    if (type === 'materias') {
      const tipoNome = data.tipo?.descricao || data.tipo_materia?.descricao || 'Matéria Legislativa';
      const numero = data.numero || '';
      const ano = data.ano || '';
      const title = `${tipoNome} Nº ${numero}/${ano} - Paflegis`;
      const ementa = data.ementa || 'Consulta pública à matéria legislativa de Pedro Afonso - TO.';
      const keywords = extrairPalavrasChave(`${tipoNome} ${numero}/${ano}`, ementa);
      const originalUrl = normalizeUrl(data.texto_original || data.texto_original_url);

      const item: DocumentSeoItem = {
        id,
        type: 'materias',
        title,
        description: ementa,
        keywords,
        date: data.data_apresentacao || data.data || '',
        originalUrl,
        lastUpdated: nowIso,
      };
      seoCacheStore.set(key, item);
      return item;
    } else if (type === 'normas') {
      const tipoNome = data.tipo_norma?.descricao || 'Norma Jurídica';
      const numero = data.numero || '';
      const ano = data.ano || '';
      const title = `${tipoNome} Nº ${numero}/${ano} - Paflegis`;
      const ementa = data.ementa || 'Consulta pública à norma jurídica de Pedro Afonso - TO.';
      const keywords = extrairPalavrasChave(`${tipoNome} ${numero}/${ano}`, ementa);
      const originalUrl = normalizeUrl(data.texto_integral || data.texto_original_url);

      const item: DocumentSeoItem = {
        id,
        type: 'normas',
        title,
        description: ementa,
        keywords,
        date: data.data_publicacao || data.data || '',
        originalUrl,
        lastUpdated: nowIso,
      };
      seoCacheStore.set(key, item);
      return item;
    } else if (type === 'sessoes') {
      const numero = data.numero || '';
      const ano = data.ano || (data.data_inicio ? new Date(data.data_inicio).getFullYear() : '');
      const tipoStr = data.__str__ || (data.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária');
      const title = `${tipoStr} Nº ${numero}/${ano} - Paflegis`;
      const resumo = data.observacao || data.pauta_resumida || `Sessão Plenária da Câmara Municipal de Pedro Afonso realizada em ${data.data_inicio || 'data oficial'}.`;
      const keywords = extrairPalavrasChave(`${tipoStr} ${numero}/${ano}`, resumo);
      const videoUrl = data.url_video || '';
      const ytId = extractYouTubeId(videoUrl);

      const item: DocumentSeoItem = {
        id,
        type: 'sessoes',
        title,
        description: resumo,
        keywords,
        date: data.data_inicio || data.data || '',
        originalUrl: videoUrl,
        embedUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : undefined,
        thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : `${PUBLIC_DOMAIN}/images/og-image.jpg`,
        lastUpdated: nowIso,
      };
      seoCacheStore.set(key, item);
      return item;
    }
  } catch (err) {
    console.warn(`[seoCache] Falha ao obter SEO item para ${type}/${id}:`, err);
  }

  return null;
}

/**
 * Executa rotina de sincronização de metadados SEO com a API do SAPL.
 * Busca lotes de matérias, normas e sessões recentes e calcula palavras-chave.
 */
export async function syncSaplSeo(): Promise<SyncLog> {
  if (isSyncing) {
    return lastSyncLog || {
      timestamp: new Date().toISOString(),
      materiasCount: 0,
      normasCount: 0,
      sessoesCount: 0,
      totalProcessed: 0,
      errorsCount: 0,
      details: ['Sincronização já em andamento.'],
    };
  }

  isSyncing = true;
  const nowIso = new Date().toISOString();
  const details: string[] = [];
  let materiasCount = 0;
  let normasCount = 0;
  let sessoesCount = 0;
  let errorsCount = 0;

  try {
    // 1. Sincronizar Matérias (lote recente)
    try {
      const resM = await fetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=30`, { signal: AbortSignal.timeout(8000) });
      if (resM.ok) {
        const dataM = await resM.json();
        const items = dataM.results || dataM;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const tipoNome = item.tipo?.descricao || item.tipo_materia?.descricao || (typeof item.__str__ === 'string' ? item.__str__.split(' ')[0] : 'Matéria');
          const title = `${tipoNome} Nº ${item.numero || ''}/${item.ano || ''} - Paflegis`;
          const ementa = item.ementa || 'Matéria legislativa pública de Pedro Afonso - TO.';
          const keywords = extrairPalavrasChave(`${tipoNome} ${item.numero}/${item.ano}`, ementa);

          seoCacheStore.set(buildKey('materias', id), {
            id,
            type: 'materias',
            title,
            description: ementa,
            keywords,
            date: item.data_apresentacao || item.data || '',
            originalUrl: normalizeUrl(item.texto_original || item.texto_original_url),
            lastUpdated: nowIso,
          });
          materiasCount++;
        }
        details.push(`Processadas ${materiasCount} matérias legislativas com sucesso.`);
      }
    } catch (e: any) {
      errorsCount++;
      details.push(`Erro ao sincronizar matérias: ${e?.message || e}`);
    }

    // 2. Sincronizar Normas (lote recente)
    try {
      const resN = await fetch(`${SAPL_API_BASE}/norma/normajuridica/?page_size=30`, { signal: AbortSignal.timeout(8000) });
      if (resN.ok) {
        const dataN = await resN.json();
        const items = dataN.results || dataN;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const tipoNome = item.tipo_norma?.descricao || (typeof item.__str__ === 'string' ? item.__str__.split(' ')[0] : 'Norma Jurídica');
          const title = `${tipoNome} Nº ${item.numero || ''}/${item.ano || ''} - Paflegis`;
          const ementa = item.ementa || 'Norma jurídica pública de Pedro Afonso - TO.';
          const keywords = extrairPalavrasChave(`${tipoNome} ${item.numero}/${item.ano}`, ementa);

          seoCacheStore.set(buildKey('normas', id), {
            id,
            type: 'normas',
            title,
            description: ementa,
            keywords,
            date: item.data_publicacao || item.data || '',
            originalUrl: normalizeUrl(item.texto_integral || item.texto_original_url),
            lastUpdated: nowIso,
          });
          normasCount++;
        }
        details.push(`Processadas ${normasCount} normas jurídicas com sucesso.`);
      }
    } catch (e: any) {
      errorsCount++;
      details.push(`Erro ao sincronizar normas: ${e?.message || e}`);
    }

    // 3. Sincronizar Sessões (lote recente)
    try {
      const resS = await fetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=30`, { signal: AbortSignal.timeout(8000) });
      if (resS.ok) {
        const dataS = await resS.json();
        const items = dataS.results || dataS;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const ano = item.ano || (item.data_inicio ? new Date(item.data_inicio).getFullYear() : '');
          const tipoStr = item.__str__ || (item.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária');
          const title = `${tipoStr} Nº ${item.numero || ''}/${ano} - Paflegis`;
          const resumo = item.observacao || item.pauta_resumida || `Sessão Plenária realizada na Câmara Municipal de Pedro Afonso.`;
          const keywords = extrairPalavrasChave(`${tipoStr} ${item.numero}/${ano}`, resumo);
          const videoUrl = item.url_video || '';
          const ytId = extractYouTubeId(videoUrl);

          seoCacheStore.set(buildKey('sessoes', id), {
            id,
            type: 'sessoes',
            title,
            description: resumo,
            keywords,
            date: item.data_inicio || item.data || '',
            originalUrl: videoUrl,
            embedUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : undefined,
            thumbnailUrl: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : `${PUBLIC_DOMAIN}/images/og-image.jpg`,
            lastUpdated: nowIso,
          });
          sessoesCount++;
        }
        details.push(`Processadas ${sessoesCount} sessões plenárias com sucesso.`);
      }
    } catch (e: any) {
      errorsCount++;
      details.push(`Erro ao sincronizar sessões: ${e?.message || e}`);
    }

  } finally {
    isSyncing = false;
  }

  const syncLog: SyncLog = {
    timestamp: nowIso,
    materiasCount,
    normasCount,
    sessoesCount,
    totalProcessed: materiasCount + normasCount + sessoesCount,
    errorsCount,
    details,
  };

  lastSyncLog = syncLog;
  console.log(`[seoCache] Sincronização SEO concluída: ${syncLog.totalProcessed} itens atualizados em ${nowIso}`);
  return syncLog;
}

/**
 * Retorna os dados para o Painel de Auditoria de SEO.
 */
export function getSeoAuditData() {
  const items = Array.from(seoCacheStore.values());
  const materias = items.filter(i => i.type === 'materias');
  const normas = items.filter(i => i.type === 'normas');
  const sessoes = items.filter(i => i.type === 'sessoes');

  return {
    lastSync: lastSyncLog,
    stats: {
      total: items.length,
      materias: materias.length,
      normas: normas.length,
      sessoes: sessoes.length,
    },
    items,
  };
}

/**
 * Gera dinamicamente o XML do sitemap contendo as rotas estáticas e
 * todas as páginas individuais de matérias, normas e sessões em cache.
 */
export async function generateDynamicSitemapXml(): Promise<string> {
  // Se o cache estiver vazio, executa uma sincronização rápida
  if (seoCacheStore.size === 0) {
    try {
      await syncSaplSeo();
    } catch {
      // continua com o que tiver
    }
  }

  const items = Array.from(seoCacheStore.values());
  const today = new Date().toISOString().split('T')[0];

  const staticUrls = [
    { loc: `${PUBLIC_DOMAIN}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${PUBLIC_DOMAIN}/materias`, priority: '0.9', changefreq: 'daily' },
    { loc: `${PUBLIC_DOMAIN}/normas`, priority: '0.9', changefreq: 'daily' },
    { loc: `${PUBLIC_DOMAIN}/sessoes`, priority: '0.9', changefreq: 'daily' },
    { loc: `${PUBLIC_DOMAIN}/api-docs`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${PUBLIC_DOMAIN}/sobre`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${PUBLIC_DOMAIN}/aviso-dados-publicos`, priority: '0.5', changefreq: 'monthly' },
    { loc: `${PUBLIC_DOMAIN}/termos-de-uso`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${PUBLIC_DOMAIN}/politica-privacidade`, priority: '0.3', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const s of staticUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${s.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${s.changefreq}</changefreq>\n`;
    xml += `    <priority>${s.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const item of items) {
    const itemUrl = `${PUBLIC_DOMAIN}/${item.type}/${item.id}`;
    const modDate = item.lastUpdated ? item.lastUpdated.split('T')[0] : today;
    xml += `  <url>\n`;
    xml += `    <loc>${itemUrl}</loc>\n`;
    xml += `    <lastmod>${modDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Constrói o HTML pré-renderizado com todas as meta tags SEO e JSON-LD
 * injetadas no <head> da base index.html.
 */
export function buildPreRenderedHtml(
  baseHtml: string,
  item: DocumentSeoItem
): string {
  const cleanDesc = item.description.replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
  const cleanTitle = item.title.replace(/"/g, '&quot;').trim();
  const canonicalUrl = `${PUBLIC_DOMAIN}/${item.type}/${item.id}`;
  const keywordsStr = formatarMetaKeywords(item.keywords);
  const imageOg = item.thumbnailUrl || `${PUBLIC_DOMAIN}/images/og-image-1200x630.jpg`;

  // Montagem do JSON-LD específico por tipo de documento
  let jsonLdObj: Record<string, any>;

  if (item.type === 'sessoes') {
    jsonLdObj = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': cleanTitle,
      'description': cleanDesc,
      'uploadDate': item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      'thumbnailUrl': imageOg,
      'embedUrl': item.embedUrl || item.originalUrl || `${PUBLIC_DOMAIN}/sessoes/${item.id}`,
      'url': canonicalUrl,
      'publisher': {
        '@type': 'Organization',
        'name': 'Paflegis',
        'url': PUBLIC_DOMAIN,
        'logo': `${PUBLIC_DOMAIN}/images/logo.jpg`,
      },
    };
  } else {
    // materias ou normas (PDF / Atos normativos)
    jsonLdObj = {
      '@context': 'https://schema.org',
      '@type': 'DigitalDocument',
      'name': cleanTitle,
      'description': cleanDesc,
      'url': canonicalUrl,
      'keywords': item.keywords,
      'datePublished': item.date || undefined,
      'publisher': {
        '@type': 'Organization',
        'name': 'Paflegis',
        'url': PUBLIC_DOMAIN,
        'logo': `${PUBLIC_DOMAIN}/images/logo.jpg`,
      },
      'hasDigitalDocumentPermission': {
        '@type': 'DigitalDocumentPermission',
        'permissionType': 'https://schema.org/ReadPermission',
        'grantee': {
          '@type': 'Audience',
          'audienceType': 'Public',
        },
      },
    };
  }

  // Tags do Open Graph article:tag para cada palavra-chave
  const articleTags = item.keywords
    .map(kw => `  <meta property="article:tag" content="${kw.replace(/"/g, '&quot;')}" />`)
    .join('\n');

  // Bloco de meta tags customizadas a serem injetadas no <head>
  const customHead = `
  <!-- ── SEO Pré-renderizado do Paflegis (Estância Editorial) ── -->
  <title>${cleanTitle}</title>
  <meta name="title" content="${cleanTitle}" />
  <meta name="description" content="${cleanDesc}" />
  <meta name="keywords" content="${keywordsStr}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="${item.type === 'sessoes' ? 'video.other' : 'article'}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:title" content="${cleanTitle}" />
  <meta property="og:description" content="${cleanDesc}" />
  <meta property="og:image" content="${imageOg}" />
  <meta property="og:image:secure_url" content="${imageOg}" />
${articleTags}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonicalUrl}" />
  <meta name="twitter:title" content="${cleanTitle}" />
  <meta name="twitter:description" content="${cleanDesc}" />
  <meta name="twitter:image" content="${imageOg}" />

  <!-- Schema.org JSON-LD -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonLdObj, null, 2)}
  </script>
`;

  // Substitui os blocos de title/description/og existentes no baseHtml ou injeta antes do </head>
  let newHtml = baseHtml;

  // Substitui a tag <title>...</title> se existir
  newHtml = newHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cleanTitle}</title>`);

  // Substitui ou injeta canonical
  if (newHtml.includes('<link rel="canonical"')) {
    newHtml = newHtml.replace(/<link rel="canonical"[\s\S]*?\/>/i, `<link rel="canonical" href="${canonicalUrl}" />`);
  }

  // Substitui meta description existente se houver
  if (newHtml.includes('<meta name="description"')) {
    newHtml = newHtml.replace(/<meta name="description"[\s\S]*?\/>/i, `<meta name="description" content="${cleanDesc}" />`);
  }

  // Injeta o bloco no final do </head>
  newHtml = newHtml.replace('</head>', `${customHead}\n</head>`);

  return newHtml;
}
