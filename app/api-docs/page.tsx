'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code,
  Terminal,
  Key,
  Database,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Layers,
  Play,
  FileText,
  BookOpen,
  Video,
  Users,
  FolderKanban,
  BarChart3,
  Activity,
  ArrowRight,
  Eye,
  FileJson,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/urlUtils';
import { getStoredApiKey, setStoredApiKey } from '@/lib/sapl/client';

export default function ApiDocsPage() {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'query' | 'header'>('query');

  // Live Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/');
  const [endpointParam, setEndpointParam] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [codeTab, setCodeTab] = useState<'curl' | 'js' | 'python'>('curl');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paflegis.vercel.app';

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSaveCustomKey = (newKey: string) => {
    setApiKey(newKey);
    setStoredApiKey(newKey);
  };

  const currentPathWithParams = endpointParam ? `${selectedEndpoint}${endpointParam}` : selectedEndpoint;
  const currentFullUrl = `${origin}${currentPathWithParams}`;
  const currentQueryUrl = `${currentFullUrl}${currentPathWithParams.includes('?') ? '&' : '?'}API_KEYS=${apiKey}`;

  const executeLiveTest = async () => {
    setTesting(true);
    setTestResult(null);
    setTestStatus(null);
    setTestLatency(null);

    const t0 = performance.now();
    try {
      const urlToCall = authMode === 'query' ? currentQueryUrl : currentFullUrl;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (authMode === 'header') {
        headers['x-api-key'] = apiKey;
      }

      const res = await fetch(urlToCall, { headers });
      const t1 = performance.now();
      setTestStatus(res.status);
      setTestLatency(Math.round(t1 - t0));

      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestStatus(500);
      setTestResult({ erro: err.message || 'Erro de conexão com o servidor' });
    } finally {
      setTesting(false);
    }
  };

  const getSnippets = (path: string, param: string) => {
    const fullPath = param ? `${path}${param}` : path;
    const url = `${origin}${fullPath}`;
    const displayKey = 'SUA_CHAVE_API';
    const urlWithQuery = `${url}${fullPath.includes('?') ? '&' : '?'}API_KEYS=${displayKey}`;

    const curl =
      authMode === 'query'
        ? `curl -X GET "${urlWithQuery}"`
        : `curl -X GET "${url}" \\\n  -H "x-api-key: ${displayKey}" \\\n  -H "Accept: application/json"`;

    const js =
      authMode === 'query'
        ? `// Consulta via Query String ?API_KEYS=
const res = await fetch("${urlWithQuery}");
const data = await res.json();
console.log(data);`
        : `// Consulta via Cabeçalho x-api-key
const res = await fetch("${url}", {
  headers: {
    "x-api-key": "${displayKey}",
    "Accept": "application/json"
  }
});
const data = await res.json();
console.log(data);`;

    const python =
      authMode === 'query'
        ? `# Consulta via Query String
import requests
res = requests.get("${urlWithQuery}")
data = res.json()
print(data)`
        : `# Consulta via Cabeçalho
import requests
headers = {"x-api-key": "${displayKey}", "Accept": "application/json"}
res = requests.get("${url}", headers=headers)
data = res.json()
print(data)`;

    return { curl, js, python };
  };

  const snippets = getSnippets(selectedEndpoint, endpointParam);

  const visualizerModules = [
    {
      title: 'Matérias Legislativas',
      desc: 'Projetos de lei, requerimentos, indicações e emendas com tramitações e anexos.',
      frontendUrl: '/materias',
      apiPath: '/api/v1/materias',
      icon: FileText,
      color: 'primary',
      defaultParam: '?busca=educacao&limite=5',
    },
    {
      title: 'Normas Jurídicas & Leis',
      desc: 'Legislação municipal, leis ordinárias, complementares, decretos e atos normativos.',
      frontendUrl: '/normas',
      apiPath: '/api/v1/normas',
      icon: BookOpen,
      color: 'success',
      defaultParam: '?ano=2024&limite=5',
    },
    {
      title: 'Sessões Plenárias',
      desc: 'Sessões ordinárias e solenes com pautas, atas, presença e vídeos no YouTube.',
      frontendUrl: '/sessoes',
      apiPath: '/api/v1/sessoes',
      icon: Video,
      color: 'danger',
      defaultParam: '?ano=2024&limite=5',
    },
    {
      title: 'Vereadores & Mesa Diretora',
      desc: 'Parlamentares eleitos, histórico de mandatos, filiações partidárias e proposições.',
      frontendUrl: '/parlamentares',
      apiPath: '/api/parlamentares/parlamentar/',
      icon: Users,
      color: 'info',
      defaultParam: '?page=1',
    },
    {
      title: 'Comissões Parlamentares',
      desc: 'Comissões permanentes e especiais com atribuições, pareceres e membros.',
      frontendUrl: '/comissoes',
      apiPath: '/api/comissoes/comissao/',
      icon: FolderKanban,
      color: 'warning',
      defaultParam: '?page=1',
    },
    {
      title: 'Catálogo de 129 Endpoints',
      desc: 'Descoberta dinâmica e mapeamento completo de todos os recursos nativos do SAPL.',
      frontendUrl: '/dados-publicos',
      apiPath: '/api/v1/endpoints',
      icon: Layers,
      color: 'secondary',
      defaultParam: '?format=template',
    },
  ];

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="d-inline-flex align-items-center bg-primary text-white p-3 rounded-circle shadow mb-3">
          <Code size={34} />
        </div>
        <h1 className="h2 fw-bold text-dark mb-2">
          Sistema de Visualização no Frontend & API de Integração
        </h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 760 }}>
          O Paflegis opera como um ecossistema integrado: uma interface de visualização cidadã de alta
          fidelidade no frontend conectada a uma API REST protegida para desenvolvedores e pesquisadores.
        </p>
      </div>

      {/* Chave de API & Modo de Acesso */}
      <div className="card border-0 shadow-sm p-4 mb-5 bg-white">
        <div className="row align-items-center g-3">
          <div className="col-lg-6">
            <h5 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2 fs-6">
              <Key size={18} className="text-primary" /> Chave de API Ativa para Integração
            </h5>
            <p className="small text-muted mb-0">
              Chave configurada via variáveis de ambiente (<code>API_KEYS_PERMITIDAS</code> ou <code>API_KEYS</code>).
            </p>
          </div>
          <div className="col-lg-6">
            <div className="input-group">
              <span className="input-group-text bg-light font-monospace small">API_KEY</span>
              <input
                type="text"
                className="form-control font-monospace small"
                value={apiKey}
                onChange={(e) => handleSaveCustomKey(e.target.value)}
                placeholder="Insira sua chave de API..."
              />
              <button
                type="button"
                onClick={() => handleCopy(apiKey, 'active-key')}
                className="btn btn-outline-secondary d-flex align-items-center gap-1"
              >
                {copiedKey === 'active-key' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                <span>{copiedKey === 'active-key' ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Módulos do Sistema de Visualização & API */}
      <h3 className="h5 fw-bold text-dark mb-3 d-flex align-items-center gap-2">
        <Eye size={20} className="text-primary" /> Módulos Integrados: Visualizador + Endpoints da API
      </h3>
      <div className="row g-4 mb-5">
        {visualizerModules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div key={i} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 card-hover d-flex flex-column">
                <div className="card-body p-4 flex-grow-1">
                  <div className="d-flex align-items-center gap-2.5 mb-2.5">
                    <div className={`p-2 rounded-3 bg-${mod.color} bg-opacity-10 text-${mod.color}`}>
                      <Icon size={20} />
                    </div>
                    <h5 className="fw-bold text-dark fs-6 mb-0">{mod.title}</h5>
                  </div>
                  <p className="text-muted small mb-3">{mod.desc}</p>
                  <div className="bg-light p-2 rounded border small font-monospace text-truncate text-secondary mb-3">
                    <code>{mod.apiPath}</code>
                  </div>
                </div>
                <div className="card-footer bg-white border-top p-3 d-flex gap-2">
                  <Link
                    href={mod.frontendUrl}
                    className="btn btn-sm btn-primary flex-grow-1 d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <Eye size={14} />
                    <span>Visualizar</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEndpoint(mod.apiPath);
                      setEndpointParam(mod.defaultParam);
                      window.scrollTo({ top: 750, behavior: 'smooth' });
                    }}
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    title="Carregar no Console Interativo de API"
                  >
                    <Code size={14} />
                    <span>API</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Console Interativo de Teste e Integração da API */}
      <div className="card border-0 shadow-lg overflow-hidden mb-5" id="api-console">
        <div className="bg-dark text-white p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <span className="badge bg-primary mb-2 px-2.5 py-1">Console Interativo</span>
              <h2 className="h4 fw-bold mb-1 d-flex align-items-center gap-2">
                <Terminal size={22} className="text-primary" /> Testador ao Vivo da API
              </h2>
              <p className="text-white-50 mb-0 small">
                Selecione o endpoint, escolha o método de autenticação e execute a chamada em tempo real.
              </p>
            </div>

            {/* Alternador Query vs Header */}
            <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 p-1.5 rounded border border-secondary">
              <span className="small text-white-50 fw-semibold">Modo:</span>
              <div className="btn-group btn-group-sm">
                <button
                  type="button"
                  className={`btn ${authMode === 'query' ? 'btn-primary' : 'btn-outline-light'}`}
                  onClick={() => setAuthMode('query')}
                >
                  Query String (?API_KEYS=)
                </button>
                <button
                  type="button"
                  className={`btn ${authMode === 'header' ? 'btn-primary' : 'btn-outline-light'}`}
                  onClick={() => setAuthMode('header')}
                >
                  Cabeçalho (x-api-key)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body p-4 bg-light">
          {/* Seletor de Endpoint */}
          <div className="row g-3 align-items-center mb-4">
            <div className="col-md-5">
              <label className="form-label small fw-bold text-dark mb-1">Endpoint Alvo (Clean Path):</label>
              <select
                className="form-select font-monospace small"
                value={selectedEndpoint}
                onChange={(e) => {
                  setSelectedEndpoint(e.target.value);
                  setEndpointParam('');
                  setTestResult(null);
                }}
              >
                <option value="/api/v1/">/api/v1/ (Raiz & Metadados da API)</option>
                <option value="/api/v1/endpoints">/api/v1/endpoints (Catálogo dos 129 Endpoints)</option>
                <option value="/api/v1/materias">/api/v1/materias (Projetos & Matérias)</option>
                <option value="/api/v1/normas">/api/v1/normas (Leis & Normas Jurídicas)</option>
                <option value="/api/v1/sessoes">/api/v1/sessoes (Sessões Plenárias & Pautas)</option>
                <option value="/api/parlamentares/parlamentar/">/api/parlamentares/parlamentar/ (Vereadores)</option>
                <option value="/api/comissoes/comissao/">/api/comissoes/comissao/ (Comissões)</option>
                <option value="/api/v1/estatisticas">/api/v1/estatisticas (Estatísticas Legislativas)</option>
                <option value="/api/v1/health">/api/v1/health (Saúde & Conectividade SAPL)</option>
                <option value="/api/v1/sync/status">/api/v1/sync/status (Status do Espelho)</option>
                <option value="/api/v1/openapi.json">/api/v1/openapi.json (Especificação OpenAPI)</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small fw-bold text-dark mb-1">Parâmetros Adicionais:</label>
              <input
                type="text"
                className="form-control font-monospace small"
                placeholder="ex: ?busca=educacao ou ?ano=2024"
                value={endpointParam}
                onChange={(e) => setEndpointParam(e.target.value)}
              />
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button
                type="button"
                onClick={executeLiveTest}
                disabled={testing}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold"
              >
                <Play size={16} />
                <span>{testing ? 'Chamando...' : 'Executar Teste'}</span>
              </button>
            </div>
          </div>

          {/* URL e Status */}
          <div className="bg-white p-3 rounded border mb-3">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
              <div className="d-flex align-items-center gap-2 font-monospace small text-truncate">
                <span className="badge bg-dark">URL</span>
                <span className="text-secondary">{authMode === 'query' ? currentQueryUrl : currentFullUrl}</span>
              </div>
              {testStatus !== null && (
                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge ${testStatus === 200 ? 'bg-success' : 'bg-danger'} px-2.5 py-1`}
                  >
                    HTTP {testStatus} {testStatus === 200 ? 'OK' : 'Unauthorized/Error'}
                  </span>
                  {testLatency !== null && (
                    <span className="badge bg-light text-muted border">{testLatency} ms</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Abas de Snippet e Resposta JSON */}
          <div className="card border">
            <div className="card-header bg-white border-bottom p-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
              <ul className="nav nav-pills gap-1">
                <li className="nav-item">
                  <button
                    className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${codeTab === 'curl' ? 'active' : 'text-dark'}`}
                    onClick={() => setCodeTab('curl')}
                  >
                    cURL
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${codeTab === 'js' ? 'active' : 'text-dark'}`}
                    onClick={() => setCodeTab('js')}
                  >
                    JavaScript / Fetch
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${codeTab === 'python' ? 'active' : 'text-dark'}`}
                    onClick={() => setCodeTab('python')}
                  >
                    Python
                  </button>
                </li>
              </ul>

              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      codeTab === 'curl' ? snippets.curl : codeTab === 'js' ? snippets.js : snippets.python,
                      'code-snippet'
                    )
                  }
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5"
                >
                  {copiedKey === 'code-snippet' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copiedKey === 'code-snippet' ? 'Copiado!' : 'Copiar Código'}</span>
                </button>

                <a
                  href={currentQueryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 py-1 px-2.5"
                >
                  <ExternalLink size={14} />
                  <span>Abrir no Navegador</span>
                </a>
              </div>
            </div>

            <div className="card-body p-0">
              <pre
                className="p-3 mb-0 bg-dark text-light font-monospace small"
                style={{ maxHeight: 240, overflowY: 'auto' }}
              >
                <code>{codeTab === 'curl' ? snippets.curl : codeTab === 'js' ? snippets.js : snippets.python}</code>
              </pre>
            </div>
          </div>

          {/* Resposta JSON ao Vivo */}
          {testResult && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                  <FileJson size={16} className="text-success" /> Resposta da API em Tempo Real
                </h6>
                <button
                  type="button"
                  onClick={() => handleCopy(JSON.stringify(testResult, null, 2), 'json-res')}
                  className="btn btn-sm btn-link text-decoration-none text-muted p-0"
                >
                  {copiedKey === 'json-res' ? 'JSON Copiado!' : 'Copiar JSON'}
                </button>
              </div>
              <div className="card border">
                <pre
                  className="p-3 mb-0 bg-dark text-success-emphasis font-monospace small"
                  style={{ maxHeight: 360, overflowY: 'auto', fontSize: '0.82rem' }}
                >
                  <code>{JSON.stringify(testResult, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
