/**
 * lib/seo/seoCache.ts — Sincronização e cache de metadados SEO para Paflegis.
 */

import { extrairPalavrasChave, formatarMetaKeywords } from './keywords';
import {
  SAPL_API_BASE,
  SAPL_PUBLIC_DOMAIN,
  normalizeUrl,
  replaceIpWithDomain,
  safeFetchWithRetry,
  sanitizeSaplData,
} from '@/lib/sapl/backend';

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
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return m ? m[1] : null;
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

    const res = await safeFetchWithRetry(endpoint, 6000, 1);
    if (!res.ok) return null;
    const rawData = await res.json();
    const data = sanitizeSaplData(rawData);
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
    }

    if (type === 'normas') {
      const tipoNome = data.tipo?.descricao || data.tipo_norma?.descricao || 'Norma Jurídica';
      const numero = data.numero || '';
      const ano = data.ano || '';
      const title = `${tipoNome} Nº ${numero}/${ano} - Paflegis`;
      const ementa = data.ementa || 'Consulta à norma jurídica municipal de Pedro Afonso - TO.';
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
    }

    if (type === 'sessoes') {
      const ano = data.ano || (data.data_inicio ? new Date(data.data_inicio).getFullYear() : '');
      const tipoStr =
        data.__str__ ||
        (data.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária');
      const title = `${tipoStr} Nº ${data.numero || ''}/${ano} - Paflegis`;
      const resumo =
        data.observacao ||
        data.pauta_resumida ||
        `Sessão Plenária realizada na Câmara Municipal de Pedro Afonso.`;
      const keywords = extrairPalavrasChave(`${tipoStr} ${data.numero}/${ano}`, resumo);
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
        thumbnailUrl: ytId
          ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
          : `${PUBLIC_DOMAIN}/images/og-image.jpg`,
        lastUpdated: nowIso,
      };
      seoCacheStore.set(key, item);
      return item;
    }
  } catch (e: any) {
    console.error(`[seoCache] Erro ao buscar documento ${type}/${id}:`, e?.message || e);
  }

  return null;
}

/**
 * Executa a pré-indexação e extração de metadados em lote de matérias, normas e sessões.
 */
export async function syncSaplSeo(): Promise<SyncLog> {
  if (isSyncing) {
    return {
      timestamp: new Date().toISOString(),
      materiasCount: 0,
      normasCount: 0,
      sessoesCount: 0,
      totalProcessed: 0,
      errorsCount: 0,
      details: ['Sincronização já em andamento. Aguarde a conclusão.'],
    };
  }

  isSyncing = true;
  const nowIso = new Date().toISOString();
  let materiasCount = 0;
  let normasCount = 0;
  let sessoesCount = 0;
  let errorsCount = 0;
  const details: string[] = [];

  try {
    // 1. Sincronizar Matérias (lote recente)
    try {
      const resM = await safeFetchWithRetry(
        `${SAPL_API_BASE}/materia/materialegislativa/?page_size=30`,
        8000,
        1
      );
      if (resM.ok) {
        const rawM = await resM.json();
        const dataM = sanitizeSaplData(rawM);
        const items = dataM.results || dataM;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const tipoNome =
            item.tipo?.descricao ||
            item.tipo_materia?.descricao ||
            (typeof item.__str__ === 'string' ? item.__str__.split(' ')[0] : 'Matéria');
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
      const resN = await safeFetchWithRetry(
        `${SAPL_API_BASE}/norma/normajuridica/?page_size=30`,
        8000,
        1
      );
      if (resN.ok) {
        const rawN = await resN.json();
        const dataN = sanitizeSaplData(rawN);
        const items = dataN.results || dataN;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const tipoNome =
            item.tipo_norma?.descricao ||
            (typeof item.__str__ === 'string' ? item.__str__.split(' ')[0] : 'Norma Jurídica');
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
      const resS = await safeFetchWithRetry(
        `${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=30`,
        8000,
        1
      );
      if (resS.ok) {
        const rawS = await resS.json();
        const dataS = sanitizeSaplData(rawS);
        const items = dataS.results || dataS;
        for (const item of items) {
          if (!item.id) continue;
          const id = String(item.id);
          const ano =
            item.ano ||
            (item.data_inicio ? new Date(item.data_inicio).getFullYear() : '');
          const tipoStr =
            item.__str__ ||
            (item.tipo === 1 ? 'Sessão Plenária Ordinária' : 'Sessão Plenária Extraordinária');
          const title = `${tipoStr} Nº ${item.numero || ''}/${ano} - Paflegis`;
          const resumo =
            item.observacao ||
            item.pauta_resumida ||
            `Sessão Plenária realizada na Câmara Municipal de Pedro Afonso.`;
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
            thumbnailUrl: ytId
              ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
              : `${PUBLIC_DOMAIN}/images/og-image.jpg`,
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
  console.log(
    `[seoCache] Sincronização SEO concluída: ${syncLog.totalProcessed} itens atualizados em ${nowIso}`
  );
  return syncLog;
}

/**
 * Retorna os dados para o Painel de Auditoria de SEO.
 */
export function getSeoAuditData() {
  const items = Array.from(seoCacheStore.values());
  const materias = items.filter((i) => i.type === 'materias');
  const normas = items.filter((i) => i.type === 'normas');
  const sessoes = items.filter((i) => i.type === 'sessoes');

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
    { loc: `${PUBLIC_DOMAIN}/dados-publicos`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${PUBLIC_DOMAIN}/api-docs`, priority: '0.7', changefreq: 'monthly' },
    { loc: `${PUBLIC_DOMAIN}/sobre`, priority: '0.6', changefreq: 'monthly' },
    { loc: `${PUBLIC_DOMAIN}/termos`, priority: '0.3', changefreq: 'yearly' },
    { loc: `${PUBLIC_DOMAIN}/privacidade`, priority: '0.3', changefreq: 'yearly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const item of staticUrls) {
    xml += `  <url>\n`;
    xml += `    <loc>${item.loc}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${item.changefreq}</changefreq>\n`;
    xml += `    <priority>${item.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  for (const doc of items) {
    const loc = `${PUBLIC_DOMAIN}/${doc.type}/${doc.id}`;
    const dateFormatted = doc.date ? doc.date.split('T')[0] : today;
    xml += `  <url>\n`;
    xml += `    <loc>${loc}</loc>\n`;
    xml += `    <lastmod>${dateFormatted}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}
