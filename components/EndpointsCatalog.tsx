'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Copy,
  Check,
  ExternalLink,
  Database,
  Code2,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  ALL_129_SAPL_ENDPOINT_KEYS,
  MODULE_NAMES,
  buildResolvedEndpointsMap,
  buildTemplateEndpointsMap,
} from '@/lib/sapl/endpointsData';
import { copyToClipboard } from '@/lib/urlUtils';

interface Props {
  apiBase?: string;
  publicDomain?: string;
}

export default function EndpointsCatalog({
  apiBase = 'https://sapl.pedroafonso.to.leg.br/api',
  publicDomain = 'https://sapl.pedroafonso.to.leg.br',
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('todos');
  const [viewMode, setViewMode] = useState<'resolved' | 'template'>('resolved');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const resolvedMap = useMemo(() => buildResolvedEndpointsMap(apiBase), [apiBase]);
  const templateMap = useMemo(() => buildTemplateEndpointsMap('[NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]'), []);

  const endpointsList = useMemo(() => {
    return ALL_129_SAPL_ENDPOINT_KEYS.map((key) => {
      const slashIdx = key.indexOf('/');
      const mod = slashIdx !== -1 ? key.substring(0, slashIdx) : key;
      return {
        key,
        module: mod,
        moduleLabel: MODULE_NAMES[mod] || mod,
        resolvedUrl: resolvedMap[key] || `${apiBase}/${key}/`,
        templateUrl: templateMap[key] || `[NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]/${key}/`,
      };
    });
  }, [apiBase, resolvedMap, templateMap]);

  const filteredEndpoints = useMemo(() => {
    return endpointsList.filter((item) => {
      const matchModule = selectedModule === 'todos' || item.module === selectedModule;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        item.key.toLowerCase().includes(term) ||
        item.moduleLabel.toLowerCase().includes(term);
      return matchModule && matchSearch;
    });
  }, [endpointsList, selectedModule, searchTerm]);

  const handleCopy = async (text: string, key: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCopyAllJson = async () => {
    const dataToCopy =
      viewMode === 'template' ? templateMap : resolvedMap;
    const ok = await copyToClipboard(JSON.stringify(dataToCopy, null, 2));
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const modulesList = useMemo(() => {
    const list = Object.keys(MODULE_NAMES).map((mod) => ({
      id: mod,
      name: MODULE_NAMES[mod],
      count: endpointsList.filter((e) => e.module === mod).length,
    }));
    return list;
  }, [endpointsList]);

  return (
    <div className="mt-4">
      {/* Banner de sanitização de IP */}
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6 text-emerald-900">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-emerald-950 mb-1">
              Normalização de Domínio & Sanitização de IP Ativa
            </p>
            <p className="text-emerald-800 leading-relaxed">
              O servidor interno legado do SAPL retorna endpoints e arquivos referenciando o IP bruto{' '}
              <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-xs font-mono">
                http://64.23.167.191
              </code>
              . Esta aplicação substitui automaticamente o IP pelo domínio público seguro oficial{' '}
              <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-xs font-mono">
                {publicDomain}
              </code>{' '}
              e base da API{' '}
              <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-xs font-mono">
                {apiBase}
              </code>
              , garantindo integridade HTTPS e compatibilidade para todos os cidadãos e integradores.
            </p>
          </div>
        </div>
      </div>

      {/* Controles de Busca e Modos */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar entre os 129 endpoints (ex: materia, norma, sessao, autor)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Limpar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
              <button
                onClick={() => setViewMode('resolved')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  viewMode === 'resolved'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                URLs Públicas
              </button>
              <button
                onClick={() => setViewMode('template')}
                className={`px-3 py-1.5 rounded-md font-medium transition ${
                  viewMode === 'template'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Variável Template
              </button>
            </div>

            <button
              onClick={handleCopyAllJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
            >
              {copiedAll ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>JSON Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todos (JSON)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filtro por Módulos */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-400 flex items-center gap-1 mr-1 flex-shrink-0">
            <Filter className="w-3 h-3" /> Módulo:
          </span>
          <button
            onClick={() => setSelectedModule('todos')}
            className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
              selectedModule === 'todos'
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos ({endpointsList.length})
          </button>
          {modulesList.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModule(m.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                selectedModule === m.id
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {m.name} ({m.count})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Endpoints */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>
            Exibindo <strong>{filteredEndpoints.length}</strong> de{' '}
            <strong>{endpointsList.length}</strong> endpoints disponíveis
          </span>
          <span className="hidden sm:inline">
            Formato:{' '}
            <span className="font-semibold text-gray-700">
              {viewMode === 'resolved' ? 'URL HTTPS Resolvida' : '[NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]'}
            </span>
          </span>
        </div>

        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {filteredEndpoints.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhum endpoint encontrado para o filtro aplicado.
            </div>
          ) : (
            filteredEndpoints.map((item) => {
              const displayUrl =
                viewMode === 'template' ? item.templateUrl : item.resolvedUrl;
              const isCopied = copiedKey === item.key;

              return (
                <div
                  key={item.key}
                  className="p-3.5 hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono font-semibold text-gray-900 text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {item.key}
                      </span>
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                        {item.moduleLabel}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-gray-600 truncate max-w-2xl select-all">
                      {displayUrl}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleCopy(displayUrl, item.key)}
                      title="Copiar URL"
                      className="p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition inline-flex items-center gap-1 text-xs"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Copiar</span>
                        </>
                      )}
                    </button>

                    {viewMode === 'resolved' && (
                      <a
                        href={item.resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir no SAPL (JSON público)"
                        className="p-1.5 rounded-md hover:bg-emerald-50 text-emerald-700 transition inline-flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Acessar</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
