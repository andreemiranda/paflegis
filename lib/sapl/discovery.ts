/**
 * lib/sapl/discovery.ts — Descoberta automática de metadados da Casa Legislativa e catálogo de endpoints.
 * Permite que o Paflegis configure títulos, município, UF e catálogo a partir de qualquer SAPL upstream.
 */

import { getConfig, updateDiscoveredConfig } from '@/lib/config';
import { safeFetchWithRetry, slog } from '@/lib/sapl/backend';
import { getStorage } from '@/lib/storage';
import { SAPL_ENDPOINTS_LIST, SAPL_ENDPOINTS_MAP } from '@/lib/sapl/endpointsData';

export interface DiscoveredCasaLegislativa {
  nome: string;
  sigla: string;
  municipio: string;
  uf: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  site?: string;
}

export interface DiscoveredEndpointItem {
  key: string;
  url: string;
  path: string;
  modulo: string;
  modulo_titulo: string;
  recurso: string;
  descricao?: string;
}

export interface DiscoveredCatalog {
  total: number;
  endpoints: DiscoveredEndpointItem[];
  endpointsMap: Record<string, string>;
  modulos: { id: string; titulo: string; total: number }[];
  fonte: 'upstream-live' | 'storage-cache' | 'offline-fallback';
  discoveredAt: number;
}

const DISCOVERY_CACHE_KEY = 'sapl:discovery:catalog';
const CASA_CACHE_KEY = 'sapl:discovery:casa';

/**
 * Mapeamento amigável de títulos de módulos do SAPL
 */
export const MODULOS_TITULOS: Record<string, string> = {
  audiencia: 'Audiências Públicas',
  base: 'Configurações & Casa Legislativa',
  comissoes: 'Comissões Parlamentares',
  compilacao: 'Compilação de Textos',
  contenttypes: 'Tipos de Conteúdo do Sistema',
  materia: 'Matérias & Processo Legislativo',
  norma: 'Legislação & Normas Jurídicas',
  painel: 'Painel Eletrônico de Votação',
  parlamentares: 'Parlamentares & Mesa Diretora',
  protocoloadm: 'Protocolo Administrativo',
  relatorios: 'Relatórios & Estatísticas',
  sessao: 'Sessões Plenárias & Pautas',
};

/**
 * Consulta a Casa Legislativa oficial configurada no SAPL upstream.
 */
export async function discoverCasaLegislativa(): Promise<DiscoveredCasaLegislativa | null> {
  const config = getConfig();
  const storage = getStorage();

  // 1. Tenta carregar do cache de armazenamento
  const cached = await storage.get<DiscoveredCasaLegislativa>(CASA_CACHE_KEY);
  if (cached) {
    updateDiscoveredConfig({
      orgName: cached.nome,
      orgAcronym: cached.sigla,
      orgCity: cached.municipio,
      orgUf: cached.uf,
      siteName: `Paflegis · ${cached.sigla || cached.municipio}`,
    });
    return cached;
  }

  // 2. Consulta upstream
  try {
    const url = `${config.saplApiBase}/base/casalegislativa/`;
    const res = await safeFetchWithRetry(url, 6000, 1);
    if (res.ok) {
      const json = await res.json();
      const results = Array.isArray(json) ? json : json.results || [];
      const casa = results[0];
      if (casa) {
        const info: DiscoveredCasaLegislativa = {
          nome: casa.nome || casa.__str__ || config.orgName,
          sigla: casa.sigla || config.orgAcronym,
          municipio: casa.municipio || config.orgCity,
          uf: casa.uf || config.orgUf,
          endereco: casa.endereco,
          telefone: casa.telefone,
          email: casa.email,
          site: casa.site,
        };

        await storage.set(CASA_CACHE_KEY, info, 86400 * 7); // 7 dias
        updateDiscoveredConfig({
          orgName: info.nome,
          orgAcronym: info.sigla,
          orgCity: info.municipio,
          orgUf: info.uf,
          siteName: `Paflegis · ${info.sigla || info.municipio}`,
        });
        slog('INFO', 'discovery', `Casa legislativa descoberta: ${info.nome} (${info.municipio}-${info.uf})`);
        return info;
      }
    }
  } catch (err: any) {
    slog('WARN', 'discovery', `Não foi possível consultar /base/casalegislativa: ${err.message}`);
  }

  return null;
}

/**
 * Gera o catálogo dinâmico de todos os endpoints suportados pela instância de SAPL configurada.
 */
export async function discoverCatalog(): Promise<DiscoveredCatalog> {
  const config = getConfig();
  const storage = getStorage();

  // 1. Tenta carregar do cache persistente
  const cached = await storage.get<DiscoveredCatalog>(DISCOVERY_CACHE_KEY);
  if (cached && cached.endpoints?.length > 0) {
    return cached;
  }

  // 2. Tenta descobrir via raiz da API upstream
  try {
    const rootUrl = `${config.saplApiBase}/`;
    const res = await safeFetchWithRetry(rootUrl, 7000, 1);
    if (res.ok) {
      const rootMap = (await res.json()) as Record<string, string>;
      const keys = Object.keys(rootMap);

      if (keys.length > 0) {
        const endpoints: DiscoveredEndpointItem[] = [];
        const endpointsMap: Record<string, string> = {};
        const modulosCount: Record<string, number> = {};

        for (const [key, rawUrl] of Object.entries(rootMap)) {
          let modulo = 'geral';
          let recurso = key;

          if (key.includes('/')) {
            const parts = key.split('/');
            modulo = parts[0] || 'geral';
            recurso = parts.slice(1).join('/') || key;
          } else if (key.includes(':')) {
            const parts = key.split(':');
            modulo = parts[0] || 'geral';
            recurso = parts.slice(1).join(':') || key;
          } else {
            try {
              const u = new URL(rawUrl);
              const segs = u.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
              if (segs.length >= 2) {
                modulo = segs[0];
                recurso = segs[1];
              }
            } catch {}
          }

          const moduloTitulo = MODULOS_TITULOS[modulo] || modulo.toUpperCase();

          let relativePath = `/api/${modulo}/${recurso}/`;
          try {
            const u = new URL(rawUrl);
            relativePath = u.pathname;
          } catch {}

          endpoints.push({
            key,
            url: rawUrl,
            path: relativePath,
            modulo,
            modulo_titulo: moduloTitulo,
            recurso,
          });

          endpointsMap[key] = rawUrl;
          modulosCount[modulo] = (modulosCount[modulo] || 0) + 1;
        }

        const modulos = Object.entries(modulosCount).map(([id, total]) => ({
          id,
          titulo: MODULOS_TITULOS[id] || id.toUpperCase(),
          total,
        })).sort((a, b) => b.total - a.total);

        const catalog: DiscoveredCatalog = {
          total: endpoints.length,
          endpoints,
          endpointsMap,
          modulos,
          fonte: 'upstream-live',
          discoveredAt: Date.now(),
        };

        await storage.set(DISCOVERY_CACHE_KEY, catalog, 86400 * 3); // 3 dias
        slog('INFO', 'discovery', `Catálogo do SAPL descoberto com sucesso: ${endpoints.length} endpoints`);
        return catalog;
      }
    }
  } catch (err: any) {
    slog('WARN', 'discovery', `Falha ao consultar raiz da API para descoberta: ${err.message}`);
  }

  // 3. Fallback estruturado a partir de endpointsData.ts
  const fallbackEndpoints: DiscoveredEndpointItem[] = SAPL_ENDPOINTS_LIST.map((ep) => {
    let modulo = 'geral';
    let recurso = ep.key;
    if (ep.key.includes('/')) {
      const parts = ep.key.split('/');
      modulo = parts[0];
      recurso = parts.slice(1).join('/');
    } else if (ep.key.includes(':')) {
      const parts = ep.key.split(':');
      modulo = parts[0];
      recurso = parts.slice(1).join(':');
    }
    return {
      key: ep.key,
      url: ep.url.replace('https://sapl.pedroafonso.to.leg.br/api', config.saplApiBase),
      path: ep.path,
      modulo,
      modulo_titulo: ep.module_title,
      recurso,
    };
  });

  const modulosCount: Record<string, number> = {};
  for (const ep of fallbackEndpoints) {
    modulosCount[ep.modulo] = (modulosCount[ep.modulo] || 0) + 1;
  }

  const modulos = Object.entries(modulosCount).map(([id, total]) => ({
    id,
    titulo: MODULOS_TITULOS[id] || id.toUpperCase(),
    total,
  })).sort((a, b) => b.total - a.total);

  return {
    total: fallbackEndpoints.length,
    endpoints: fallbackEndpoints,
    endpointsMap: SAPL_ENDPOINTS_MAP,
    modulos,
    fonte: 'offline-fallback',
    discoveredAt: Date.now(),
  };
}
