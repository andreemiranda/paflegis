'use client';

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Download,
  FileText,
  Copy,
  Check,
  Code,
  Eye,
  Info,
  Calendar,
  User,
  Tag,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { getStoredApiKey } from '@/lib/sapl/client';

interface Props {
  url: string;
  title: string;
  materia?: any;
  norma?: any;
  onClose: () => void;
}

export default function DocumentPreviewModal({ url, title, materia, norma, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'documento' | 'api_json' | 'integracao'>('documento');
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const apiKey = getStoredApiKey();

  // Objeto estruturado do documento (se fornecido via materia ou norma, ou montado)
  const docData = materia || norma || {
    titulo: title,
    url,
    ementa: title,
  };

  const isNorma = !!norma || (materia?.tipo_norma !== undefined);
  const docNumero = docData.numero || '';
  const docAno = docData.ano || '';
  const docTipo = docData.tipo || (isNorma ? 'Norma Jurídica' : 'Matéria Legislativa');
  const docEmenta = docData.ementa || title;
  const docAutor = docData.autor || (isNorma ? 'Poder Legislativo / Executivo Municipal' : 'Vereador / Mesa Diretora');
  const docDataApresentacao = docData.data_apresentacao || docData.data_publicacao || docData.data || '';
  const docSituacao = docData.situacao || 'Publicado / Em Vigor';

  // Endpoint estimado para a inspeção da API
  const apiEndpoint = materia?.id
    ? `/api/v1/materias/${materia.id}`
    : norma?.id
    ? `/api/v1/normas/${norma.id}`
    : `/api/v1/materias?busca=${encodeURIComponent(title.slice(0, 30))}`;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(docData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlExample = `curl -X GET "https://paflegis.vercel.app${apiEndpoint}" \\
  -H "x-api-key: ${apiKey}" \\
  -H "Accept: application/json"`;

  const fetchExample = `const res = await fetch("https://paflegis.vercel.app${apiEndpoint}", {
  headers: {
    "x-api-key": "${apiKey}",
    "Accept": "application/json"
  }
});
const data = await res.json();
console.log(data);`;

  const pythonExample = `import requests

url = "https://paflegis.vercel.app${apiEndpoint}"
headers = {
    "x-api-key": "${apiKey}",
    "Accept": "application/json"
}

response = requests.get(url, headers=headers)
print(response.json())`;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', zIndex: 1060, backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl py-3"
        style={{ maxWidth: '960px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-3 overflow-hidden d-flex flex-column" style={{ maxHeight: '90vh' }}>
          {/* Header */}
          <div className="modal-header bg-dark text-white py-2.5 px-4 border-0 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2 overflow-hidden me-3">
              <div className="bg-primary text-white p-1.5 rounded-2 d-flex align-items-center justify-content-center">
                <FileText size={18} />
              </div>
              <div className="overflow-hidden">
                <h5 className="modal-title fs-6 fw-bold mb-0 text-truncate text-white">
                  {title || 'Visualizador Oficial de Documentos'}
                </h5>
                <small className="text-white-50" style={{ fontSize: '0.72rem' }}>
                  Câmara Municipal de Pedro Afonso · Sistema de Transparência Pública
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
              {url && (
                <>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-light d-inline-flex align-items-center gap-1.5 px-3 py-1"
                    title="Abrir arquivo PDF oficial diretamente em nova aba do navegador"
                  >
                    <ExternalLink size={14} />
                    <span className="d-none d-sm-inline">Abrir Oficial (Nova Aba)</span>
                  </a>

                  <a
                    href={url}
                    download
                    className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 px-3 py-1"
                    title="Baixar arquivo oficial"
                  >
                    <Download size={14} />
                    <span className="d-none d-sm-inline">Baixar</span>
                  </a>
                </>
              )}

              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Fechar"
              />
            </div>
          </div>

          {/* Abas de Navegação (Elimina o iframe!) */}
          <div className="bg-light border-bottom px-4 pt-2">
            <ul className="nav nav-tabs border-0 gap-2">
              <li className="nav-item">
                <button
                  type="button"
                  onClick={() => setActiveTab('documento')}
                  className={`nav-link py-2 px-3 fw-semibold border-0 d-flex align-items-center gap-1.5 ${
                    activeTab === 'documento'
                      ? 'active bg-white text-primary border-bottom border-primary border-2'
                      : 'text-muted bg-transparent'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <Eye size={15} />
                  <span>Visualização Documental</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  onClick={() => setActiveTab('api_json')}
                  className={`nav-link py-2 px-3 fw-semibold border-0 d-flex align-items-center gap-1.5 ${
                    activeTab === 'api_json'
                      ? 'active bg-white text-primary border-bottom border-primary border-2'
                      : 'text-muted bg-transparent'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <Code size={15} />
                  <span>Inspetor de Dados API (JSON)</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  onClick={() => setActiveTab('integracao')}
                  className={`nav-link py-2 px-3 fw-semibold border-0 d-flex align-items-center gap-1.5 ${
                    activeTab === 'integracao'
                      ? 'active bg-white text-primary border-bottom border-primary border-2'
                      : 'text-muted bg-transparent'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <ShieldCheck size={15} />
                  <span>Snippets de Integração</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Corpo do Modal */}
          <div className="modal-body p-4 overflow-auto flex-grow-1 bg-white">
            {/* Aba 1: Visualização Documental Nativa (Moderna, sem iframe) */}
            {activeTab === 'documento' && (
              <div className="d-flex flex-column gap-3">
                {/* Banner de Metadados Principais */}
                <div className="card border-0 bg-light p-3 rounded-3">
                  <div className="row g-3">
                    <div className="col-md-3 col-sm-6">
                      <span className="text-muted small d-block">Tipo de Proposição</span>
                      <strong className="text-dark d-flex align-items-center gap-1 mt-0.5">
                        <Tag size={14} className="text-primary" /> {docTipo}
                      </strong>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="text-muted small d-block">Número / Ano</span>
                      <strong className="text-dark d-flex align-items-center gap-1 mt-0.5">
                        <FileCheck size={14} className="text-success" />
                        {docNumero ? `Nº ${docNumero}/${docAno}` : docAno ? `Ano ${docAno}` : 'Identificado'}
                      </strong>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="text-muted small d-block">Autoria / Origem</span>
                      <strong className="text-dark d-flex align-items-center gap-1 mt-0.5 text-truncate" title={docAutor}>
                        <User size={14} className="text-info" /> {docAutor}
                      </strong>
                    </div>

                    <div className="col-md-3 col-sm-6">
                      <span className="text-muted small d-block">Data do Registro</span>
                      <strong className="text-dark d-flex align-items-center gap-1 mt-0.5">
                        <Calendar size={14} className="text-warning" /> {docDataApresentacao || 'Registrado'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Ementa e Teor do Documento */}
                <div className="card border-0 shadow-sm p-4 rounded-3">
                  <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                    <Info size={18} className="text-primary" />
                    Ementa / Descrição Oficial do Documento
                  </h6>
                  <p className="lead fs-6 text-dark mb-0 lh-lg" style={{ whiteSpace: 'pre-wrap' }}>
                    {docEmenta}
                  </p>

                  <div className="d-flex flex-wrap gap-2 mt-3 pt-3 border-top align-items-center">
                    <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1.5 fw-semibold border border-primary border-opacity-25">
                      Situação: {docSituacao}
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-secondary px-3 py-1.5 fw-medium">
                      Origem: Câmara Municipal de Pedro Afonso - TO
                    </span>
                  </div>
                </div>

                {/* Acessibilidade ao Arquivo Original (Sem iframe quebrado) */}
                <div className="card border-primary border-opacity-25 bg-primary bg-opacity-10 p-3 rounded-3">
                  <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div>
                      <h6 className="fw-bold text-primary mb-1 d-flex align-items-center gap-2">
                        <FileText size={18} />
                        Arquivo Oficial Digitalizado
                      </h6>
                      <p className="small text-muted mb-0">
                        {url
                          ? 'O documento completo está disponível no repositório oficial da Câmara. Visualize em nova aba ou baixe o arquivo original com assinatura e fé pública.'
                          : 'Este registro legislativo foi extraído diretamente da base de dados da API do SAPL.'}
                      </p>
                    </div>

                    {url && (
                      <div className="d-flex align-items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold"
                        >
                          <ExternalLink size={16} />
                          Visualizar Documento Completo
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documentos Acessórios / Anexos se houver */}
                {((docData.documentos_acessorios && docData.documentos_acessorios.length > 0) ||
                  (docData.anexos && docData.anexos.length > 0)) && (
                  <div className="card border-0 shadow-sm p-3 rounded-3">
                    <h6 className="fw-bold text-dark mb-2">Documentos Acessórios & Anexos</h6>
                    <div className="list-group list-group-flush">
                      {(docData.documentos_acessorios || docData.anexos).map((anexo: any, idx: number) => (
                        <div key={idx} className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                          <span className="small text-dark fw-medium">{anexo.nome || `Anexo #${idx + 1}`}</span>
                          {anexo.url && (
                            <a
                              href={anexo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                            >
                              <ExternalLink size={12} /> Abrir
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba 2: Inspetor de Dados API (JSON formatado ao vivo) */}
            {activeTab === 'api_json' && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-muted fw-semibold">
                    Dados estruturados retornados pela API (formato padronizado JSON):
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                  </button>
                </div>

                <pre
                  className="bg-dark text-light p-3 rounded-3 small mb-0 overflow-auto"
                  style={{ maxHeight: '420px', fontSize: '0.82rem', fontFamily: 'monospace' }}
                >
                  {JSON.stringify(docData, null, 2)}
                </pre>
              </div>
            )}

            {/* Aba 3: Snippets de Integração Técnica */}
            {activeTab === 'integracao' && (
              <div className="d-flex flex-column gap-3">
                <div className="card bg-light border-0 p-3 rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-dark small d-flex align-items-center gap-1.5">
                      <Code size={16} className="text-primary" /> cURL (Terminal / Shell)
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(curlExample)}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-0.5 px-2"
                    >
                      {codeCopied ? <Check size={12} /> : <Copy size={12} />} Copiar
                    </button>
                  </div>
                  <pre className="bg-dark text-light p-2.5 rounded-2 small mb-0 overflow-auto font-monospace" style={{ fontSize: '0.8rem' }}>
                    {curlExample}
                  </pre>
                </div>

                <div className="card bg-light border-0 p-3 rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-dark small d-flex align-items-center gap-1.5">
                      <Code size={16} className="text-warning" /> JavaScript / TypeScript (Fetch)
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(fetchExample)}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-0.5 px-2"
                    >
                      {codeCopied ? <Check size={12} /> : <Copy size={12} />} Copiar
                    </button>
                  </div>
                  <pre className="bg-dark text-light p-2.5 rounded-2 small mb-0 overflow-auto font-monospace" style={{ fontSize: '0.8rem' }}>
                    {fetchExample}
                  </pre>
                </div>

                <div className="card bg-light border-0 p-3 rounded-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <strong className="text-dark small d-flex align-items-center gap-1.5">
                      <Code size={16} className="text-success" /> Python (Requests)
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(pythonExample)}
                      className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 py-0.5 px-2"
                    >
                      {codeCopied ? <Check size={12} /> : <Copy size={12} />} Copiar
                    </button>
                  </div>
                  <pre className="bg-dark text-light p-2.5 rounded-2 small mb-0 overflow-auto font-monospace" style={{ fontSize: '0.8rem' }}>
                    {pythonExample}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Footer do Modal */}
          <div className="modal-footer bg-light py-2 px-4 border-top d-flex justify-content-between align-items-center">
            <span className="small text-muted">
              Identificador Regimental: #{docData.id || 'N/A'} · Integração RESTful
            </span>
            <button type="button" className="btn btn-secondary btn-sm px-4" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
