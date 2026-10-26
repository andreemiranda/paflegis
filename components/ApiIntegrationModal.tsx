'use client';

import React, { useState } from 'react';
import {
  Code,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Play,
  X,
  FileJson,
  Layers,
  Key,
} from 'lucide-react';
import { copyToClipboard } from '@/lib/urlUtils';
import { getStoredApiKey } from '@/lib/sapl/client';

interface ApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  cleanPath: string; // ex: '/api/v1/materias/123'
  category?: string;
  defaultData?: any;
}

export default function ApiIntegrationModal({
  isOpen,
  onClose,
  title,
  cleanPath,
  category = 'Recurso Legislativo',
  defaultData,
}: ApiIntegrationModalProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python' | 'json'>('curl');
  const [authMethod, setAuthMethod] = useState<'query' | 'header'>('query');
  const [copied, setCopied] = useState(false);
  const [liveData, setLiveData] = useState<any>(defaultData || null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState('');

  if (!isOpen) return null;

  const apiKey = getStoredApiKey();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://paflegis.vercel.app';
  const fullCleanUrl = `${origin}${cleanPath}`;
  const placeholderKey = 'SUA_CHAVE_API';
  const displayQueryUrl = `${fullCleanUrl}${cleanPath.includes('?') ? '&' : '?'}API_KEYS=${placeholderKey}`;
  const fullQueryUrl = `${fullCleanUrl}${cleanPath.includes('?') ? '&' : '?'}API_KEYS=${apiKey}`;

  const curlCommand =
    authMethod === 'query'
      ? `curl -X GET "${displayQueryUrl}"`
      : `curl -X GET "${fullCleanUrl}" \\\n  -H "x-api-key: ${placeholderKey}" \\\n  -H "Accept: application/json"`;

  const jsCode =
    authMethod === 'query'
      ? `// Consulta via Query String ?API_KEYS=
const response = await fetch("${displayQueryUrl}");
const data = await response.json();
console.log(data);`
      : `// Consulta via Cabeçalho x-api-key
const response = await fetch("${fullCleanUrl}", {
  headers: {
    "x-api-key": "${placeholderKey}",
    "Accept": "application/json"
  }
});
const data = await response.json();
console.log(data);`;

  const pythonCode =
    authMethod === 'query'
      ? `# Consulta via Query String
import requests

url = "${displayQueryUrl}"
response = requests.get(url)
data = response.json()
print(data)`
      : `# Consulta via Cabeçalho
import requests

url = "${fullCleanUrl}"
headers = {
    "x-api-key": "${placeholderKey}",
    "Accept": "application/json"
}
response = requests.get(url, headers=headers)
data = response.json()
print(data)`;

  const currentCode =
    activeTab === 'curl' ? curlCommand : activeTab === 'js' ? jsCode : pythonCode;

  const handleCopyCode = async () => {
    const textToCopy = activeTab === 'json' ? JSON.stringify(liveData, null, 2) : currentCode;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTestLive = async () => {
    setLoadingLive(true);
    setLiveError('');
    try {
      const res = await fetch(fullCleanUrl, {
        headers: {
          'x-api-key': apiKey,
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      setLiveData(json);
      setActiveTab('json');
    } catch (err: any) {
      setLiveError(err.message || 'Erro ao consultar a API.');
    } finally {
      setLoadingLive(false);
    }
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" role="document">
        <div className="modal-content border-0 shadow-lg rounded-3">
          {/* Header */}
          <div className="modal-header bg-dark text-white border-bottom border-secondary py-3">
            <div className="d-flex align-items-center gap-2">
              <div className="bg-primary text-white p-2 rounded-2 d-flex align-items-center justify-content-center">
                <Code size={18} />
              </div>
              <div>
                <h5 className="modal-title fs-6 fw-bold mb-0">Integração API REST: {title}</h5>
                <span className="text-white-50" style={{ fontSize: '0.78rem' }}>
                  {category} · Endpoint Oficial
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              aria-label="Fechar"
              onClick={onClose}
            />
          </div>

          {/* Body */}
          <div className="modal-body p-4 bg-light">
            {/* Endpoint Path Banner */}
            <div className="bg-white p-3 rounded-2 border shadow-sm mb-3">
              <div className="small text-muted mb-1 fw-semibold text-uppercase" style={{ fontSize: '0.72rem' }}>
                Rota Canônica da API (sem a chave no corpo do endpoint)
              </div>
              <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap font-monospace bg-light p-2 rounded border">
                <span className="text-primary fw-bold">{cleanPath}</span>
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                  GET · 200 OK
                </span>
              </div>
            </div>

            {/* Alternador de Método de Autenticação */}
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="small fw-semibold text-dark">Autenticação:</span>
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className={`btn ${authMethod === 'query' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setAuthMethod('query')}
                  >
                    Query String (?API_KEYS=)
                  </button>
                  <button
                    type="button"
                    className={`btn ${authMethod === 'header' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setAuthMethod('header')}
                  >
                    Cabeçalho (x-api-key)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestLive}
                disabled={loadingLive}
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1.5 fw-medium"
              >
                <Play size={14} />
                <span>{loadingLive ? 'Consultando...' : 'Testar Resposta ao Vivo'}</span>
              </button>
            </div>

            {/* Tabs de Código / JSON */}
            <div className="card border shadow-sm">
              <div className="card-header bg-white border-bottom p-2 d-flex align-items-center justify-content-between">
                <ul className="nav nav-pills gap-1">
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${activeTab === 'curl' ? 'active' : 'text-dark'}`}
                      onClick={() => setActiveTab('curl')}
                    >
                      cURL
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${activeTab === 'js' ? 'active' : 'text-dark'}`}
                      onClick={() => setActiveTab('js')}
                    >
                      JavaScript / Node
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 ${activeTab === 'python' ? 'active' : 'text-dark'}`}
                      onClick={() => setActiveTab('python')}
                    >
                      Python
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      className={`nav-link py-1 px-3 fs-7 fw-medium rounded-2 d-flex align-items-center gap-1 ${activeTab === 'json' ? 'active' : 'text-dark'}`}
                      onClick={() => {
                        if (!liveData) handleTestLive();
                        else setActiveTab('json');
                      }}
                    >
                      <FileJson size={13} />
                      <span>JSON Resposta</span>
                    </button>
                  </li>
                </ul>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-1 px-2.5"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="card-body p-0">
                {liveError && activeTab === 'json' && (
                  <div className="alert alert-danger m-3 py-2 small">{liveError}</div>
                )}

                {activeTab === 'json' ? (
                  <pre
                    className="p-3 mb-0 bg-dark text-light font-monospace small"
                    style={{ maxHeight: 320, overflowY: 'auto', fontSize: '0.8rem' }}
                  >
                    <code>
                      {liveData
                        ? JSON.stringify(liveData, null, 2)
                        : '// Clique em "Testar Resposta ao Vivo" para inspecionar os dados em tempo real.'}
                    </code>
                  </pre>
                ) : (
                  <pre
                    className="p-3 mb-0 bg-dark text-light font-monospace small"
                    style={{ maxHeight: 320, overflowY: 'auto', fontSize: '0.8rem' }}
                  >
                    <code>{currentCode}</code>
                  </pre>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mt-3 text-muted small">
              <span className="d-flex align-items-center gap-1">
                <Key size={13} />
                <span>Chave ativa: <code>{apiKey.slice(0, 6)}...{apiKey.slice(-4)}</code></span>
              </span>
              <a
                href={fullQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-decoration-none d-flex align-items-center gap-1"
              >
                <span>Abrir endpoint bruto no navegador</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer bg-white border-top py-2">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
