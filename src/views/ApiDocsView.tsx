import React, { useState } from 'react';
import { Code2, ExternalLink, Copy, Check, FileCode, Server, Key, ShieldAlert } from 'lucide-react';
import { copyToClipboard } from '../lib/urlUtils';

export const ApiDocsView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const openApiSpecJson = {
    openapi: '3.0.0',
    info: {
      title: 'Paflegis Public API - Pedro Afonso - TO',
      version: '1.0.0',
      description:
        'API pública otimizada do Paflegis. ATENÇÃO: Exige obrigatoriamente cabeçalho x-api-key para autenticação em todas as rotas de dados /api/v1/*.',
    },
    servers: [{ url: '/api/v1' }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Chave de API requerida em todas as requisições às rotas de dados /api/v1/*',
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
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

  const sampleCurl = `curl -X GET "https://paflegis.vercel.app/api/v1/materias" \\
  -H "x-api-key: paflegis_partner_demo_key_77182" \\
  -H "Accept: application/json"`;

  const handleCopyCurl = async () => {
    const success = await copyToClipboard(sampleCurl);
    if (success) {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2500);
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
          O Paflegis disponibiliza uma API REST pública e otimizada que expõe dados públicos normalizados do SAPL de Pedro Afonso - TO para desenvolvedores, pesquisadores e sistemas parceiros.
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          <a
            href="/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-md transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir Swagger UI em Nova Aba (`/swagger-ui`)</span>
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

      {/* Autenticação por API Key Banner / Guia para Parceiros */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-amber-950 font-bold text-sm sm:text-base">
          <Key className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Autenticação Obrigatória via API Key (`x-api-key`)</span>
        </div>

        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed">
          Todas as requisições às rotas de dados sob <code className="bg-amber-100 font-mono text-amber-950 px-1.5 py-0.5 rounded font-bold">/api/v1/*</code> exigem obrigatoriamente a inclusão de uma chave de API ativa no cabeçalho HTTP <code className="bg-amber-100 font-mono text-amber-950 px-1.5 py-0.5 rounded font-bold">x-api-key</code>.
          Requisições sem a chave ou com chave inválida receberão resposta <code className="bg-red-100 text-red-800 font-bold px-1 rounded">401 Unauthorized</code>.
        </p>

        {/* Exemplo cURL */}
        <div className="bg-slate-900 text-slate-200 rounded-lg p-4 space-y-2 border border-slate-800 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Code2 className="w-3.5 h-3.5" /> Exemplo de Requisição cURL
            </span>
            <button
              onClick={handleCopyCurl}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] transition-colors"
            >
              {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCurl ? 'Copiado!' : 'Copiar cURL'}</span>
            </button>
          </div>
          <pre className="text-amber-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {sampleCurl}
          </pre>
        </div>

        {/* Como solicitar chave de parceiro */}
        <div className="bg-white border border-amber-200/80 rounded-lg p-4 text-xs text-amber-900 space-y-2">
          <div className="font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Como solicitar uma nova chave para o seu aplicativo parceiro:</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Se você é um desenvolvedor, pesquisador ou parceiro institucional e deseja integrar seu aplicativo externo às rotas do Paflegis, solicite uma chave dedicada através do formulário na aba de <strong className="text-slate-900">Contato</strong> do portal, informando a identificação do app e a finalidade de uso.
          </p>
        </div>
      </div>

      {/* Embedded Swagger UI Console */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Console Interativo Swagger UI</span>
          </div>
          <a
            href="/swagger-ui/index.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Tela Cheia</span>
          </a>
        </div>
        <iframe
          src="/swagger-ui/index.html"
          className="w-full h-[650px] border-none bg-slate-50"
          title="Paflegis Swagger UI"
        />
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
              Retorna a lista de matérias legislativas. Aceita parâmetros: `busca`, `tipo`, `ano`. Requer cabeçalho `x-api-key`.
            </p>
          </div>

          {/* Endpoint 2 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/normas</span>
            </div>
            <p className="text-slate-600">
              Retorna o acervo de normas jurídicas (leis, decretos, resoluções) publicadas com texto integral. Requer cabeçalho `x-api-key`.
            </p>
          </div>

          {/* Endpoint 3 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/sessoes</span>
            </div>
            <p className="text-slate-600">
              Retorna as sessões plenárias com pauta, ata e presenciais de vereadores. Requer cabeçalho `x-api-key`.
            </p>
          </div>

          {/* Endpoint 4 */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="flex items-center gap-2 font-mono">
              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.5 text-[10px] rounded">GET</span>
              <span className="font-bold text-slate-900 text-xs">/api/v1/estatisticas</span>
            </div>
            <p className="text-slate-600">
              Retorna indicadores consolidados do processo legislativo do município. Requer cabeçalho `x-api-key`.
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

        <pre className="bg-slate-950 p-4 rounded-md font-mono text-xs text-sky-300 overflow-x-auto max-w-full whitespace-pre-wrap break-words max-h-80 scrollbar-thin border border-slate-800">
          {JSON.stringify(openApiSpecJson, null, 2)}
        </pre>
      </div>
    </div>
  );
};


