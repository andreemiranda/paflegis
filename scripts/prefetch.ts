import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREFETCH_FILE = path.join(__dirname, '..', 'dist', 'prefetch-fallback.json');

const rawApiBase =
  process.env.SAPL_API_BASE ||
  process.env.NEXT_PUBLIC_SAPL_API_BASE ||
  'https://sapl.pedroafonso.to.leg.br/api';
const SAPL_API_BASE = rawApiBase.trim().replace(/\/+$/, '');

const rawPublic =
  process.env.SAPL_PUBLIC_DOMAIN ||
  process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN ||
  'https://sapl.pedroafonso.to.leg.br';
const SAPL_PUBLIC = rawPublic.trim().replace(/\/+$/, '');

function replaceIpWithDomain(rawStr: string): string {
  if (!rawStr) return '';
  return rawStr
    .replace(/https?:\/\/64\.23\.167\.191\/api(\/|\b|$)/gi, `${SAPL_API_BASE}$1`)
    .replace(/https?:\/\/64\.23\.167\.191(\/|\b|$)/gi, `${SAPL_PUBLIC}$1`);
}

function normalizeUrl(raw?: string | null): string {
  if (!raw) return '';
  const s = replaceIpWithDomain(raw.trim());
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('/')) return `${SAPL_PUBLIC}${s}`;
  return `${SAPL_PUBLIC}/${s}`;
}

async function safeFetch(url: string) {
  const targetUrl = replaceIpWithDomain(url);
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) return await res.json();
    } catch {
      console.log('Retry...', targetUrl);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}

async function main() {
  console.log('Prefetching fallback data from SAPL with IP sanitization...');
  const data: any = {};

  const m = await safeFetch(`${SAPL_API_BASE}/materia/materialegislativa/?page_size=10`);
  if (m && m.results) {
    data.materias = {
      items: m.results.map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        ementa: it.ementa || '',
        tipo: it.tipo_materia?.descricao || it.tipo || 'Matéria Legislativa',
        autor: it.autor || 'Não informado',
        data_apresentacao: it.data_apresentacao,
        situacao: it.situacao_materia?.descricao || 'Em Tramitação',
        texto_original_url: normalizeUrl(it.texto_original),
        documentos_acessorios: [],
      })),
      total: m.pagination?.total_entries || m.count || 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
  }

  const n = await safeFetch(`${SAPL_API_BASE}/norma/normajuridica/?page_size=10`);
  if (n && n.results) {
    data.normas = {
      items: n.results.map((it: any) => ({
        id: it.id,
        numero: it.numero,
        ano: it.ano,
        ementa: it.ementa || '',
        tipo: it.tipo_norma?.descricao || it.tipo || 'Norma',
        data: it.data,
        texto_original_url: normalizeUrl(it.texto_original),
        documentos_acessorios: [],
      })),
      total: n.pagination?.total_entries || n.count || 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
  }

  const s = await safeFetch(`${SAPL_API_BASE}/sessao/sessaoplenaria/?page_size=10`);
  if (s && s.results) {
    data.sessoes = {
      items: s.results.map((it: any) => ({
        id: it.id,
        data: it.data_inicio,
        tipo: it.tipo_sessao?.nome || 'Sessão',
        numero: it.numero,
        url_audio: it.url_audio,
        url_video: it.url_video,
        documentos_acessorios: [],
      })),
      total: s.pagination?.total_entries || s.count || 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
  }

  if (Object.keys(data).length > 0) {
    if (!fs.existsSync(path.dirname(PREFETCH_FILE))) {
      fs.mkdirSync(path.dirname(PREFETCH_FILE), { recursive: true });
    }
    fs.writeFileSync(PREFETCH_FILE, JSON.stringify(data), 'utf8');
    console.log('Fallback prefetch completed.');
  }
}

main().catch(console.error);
