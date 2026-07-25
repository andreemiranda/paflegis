import React, { useState } from 'react';
import { Code2, ExternalLink, Copy, Check, FileCode, Server } from 'lucide-react';
import { copyToClipboard } from '../lib/urlUtils';

export const ApiDocsView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const openApiSpecJson = {
    openapi: '3.0.0',
    info: {
      title: 'Paflegis Public API - Pedro Afonso - TO',
      version: '1.0.0',
      description:
        'API pública otimizada do Paflegis, com normalização de URLs de documentos e suporte a matérias legislativas, normas jurídicas e sessões plenárias.',
    },
    servers: [{ url: '/api/v1' }],
    paths: {
      '/materias': {
        get: {
          summary: 'Listar Matérias Legislativas',
          parameters: [
            { name: 'busca', in: 'query', schema: { type: 'string' } },
            { name: 'tipo', in: 'query', schema: { type: 'string' } },
            { name: 'ano', in: 'query', schema: { type: 'string' } },
          ],
        },
      },
      '/normas': {
        get: { summary: 'Listar Normas Jurídicas' },
      },
      '/sessoes': {
        get: { summary: 'Listar Sessões Plenárias' },
      },
      '/estatisticas': {
        get: { summary: 'Obter Estatísticas Consolidadas' },
      },
    },
  };

  const handleCopyJson = async () => {
    const success = await copyToClipboard(JSON.stringify(openApiSpecJson, null, 2));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-sm space-y-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center font-bold">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Documentação da API Paflegis (Swagger UI)</h1>
            <p className="text-xs text-amber-300 font-mono">OpenAPI 3.0 • API Pública de Dados Cívicos Facilitados</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          O Paflegis disponibiliza uma API REST pública e otimizada que expõe dados públicos normalizados do SAPL de Pedro Afonso - TO para desenvolvedores, pesquisadores e cidadãos.
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-md transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Swagger UI Interativo (`/api-docs`)</span>
          </a>

          <a
            href="/api/openapi.json"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-3.5 py-2 rounded-md border border-slate-700 transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Download OpenAPI Schema (JSON)</span>
          </a>
        </div>
      </div>

      {/* Endpoints Reference Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-600" />
          <span>Principais Endpoints Disponíveis</span>
        </h2>

        <div className="space-y-2.5 text-xs">
          {/* Endpoint 1 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/materias</span>
            </div>
            <p className="text-slate-600">
              Retorna a lista de matérias legislativas. Aceita parâmetros: `busca`, `tipo`, `ano`. Todas as URLs de documentos retornadas contêm a normalização de domínio.
            </p>
          </div>

          {/* Endpoint 2 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/normas</span>
            </div>
            <p className="text-slate-600">
              Retorna o acervo de normas jurídicas (leis, decretos, resoluções) publicadas com texto integral.
            </p>
          </div>

          {/* Endpoint 3 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/sessoes</span>
            </div>
            <p className="text-slate-600">
              Retorna as sessões plenárias com pauta, ata e presenciais de vereadores.
            </p>
          </div>

          {/* Endpoint 4 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/estatisticas</span>
            </div>
            <p className="text-slate-600">
              Retorna indicadores consolidados do processo legislativo do município.
            </p>
          </div>
        </div>
      </div>

      {/* OpenAPI Specification Code View */}
      <div className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-bold text-amber-400">openapi-schema.json</span>
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Esquema JSON'}</span>
          </button>
        </div>

        <pre className="bg-slate-950 p-4 rounded-md font-mono text-[11px] text-sky-300 overflow-x-auto max-h-80 scrollbar-thin border border-slate-800">
          {JSON.stringify(openApiSpecJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};

