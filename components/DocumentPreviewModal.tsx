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
  ShieldCheck,
  Eye,
  AlertCircle,
  Maximize2
} from 'lucide-react';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
  metadata?: Record<string, any>;
  apiUrl?: string;
}

export default function DocumentPreviewModal({ url, title, onClose, metadata, apiUrl }: Props) {
  const [activeTab, setActiveTab] = useState<'visualizador' | 'metadados' | 'link'>('visualizador');
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().endsWith('.pdf');

  return (
    <div
      className="modal show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-xl h-100 py-3 my-0">
        <div className="modal-content border-0 shadow-lg h-100 d-flex flex-column rounded-3 overflow-hidden">
          {/* Header Superior */}
          <div className="modal-header bg-dark text-white py-2.5 px-3 border-bottom border-secondary border-opacity-25">
            <div className="d-flex align-items-center gap-2 text-truncate me-3">
              <span className="p-1.5 rounded-2 bg-primary bg-opacity-25 text-primary-light d-flex align-items-center">
                <FileText size={18} />
              </span>
              <div>
                <h5 className="modal-title fs-6 fw-semibold text-truncate mb-0 text-white" title={title}>
                  {title}
                </h5>
                <small className="text-secondary small d-none d-sm-inline">
                  Visualizador de Documento Oficial · SAPL
                </small>
              </div>
            </div>

            <div className="d-flex align-items-center gap-1.5 ms-auto">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1.5 py-1 px-2.5"
                title="Abrir arquivo em nova guia do navegador"
              >
                <ExternalLink size={14} />
                <span className="d-none d-md-inline">Nova Guia</span>
              </a>
              <a
                href={url}
                download
                className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 py-1 px-2.5"
                title="Baixar arquivo oficial para o dispositivo"
              >
                <Download size={14} />
                <span className="d-none d-md-inline">Baixar</span>
              </a>
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Fechar"
              ></button>
            </div>
          </div>

          {/* Barra de Abas / Modos de Inspeção */}
          <div className="bg-light px-3 py-1.5 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <ul className="nav nav-pills nav-fill gap-1" style={{ fontSize: '0.82rem' }}>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-1 px-3 d-flex align-items-center gap-1.5 fw-medium ${
                    activeTab === 'visualizador' ? 'active shadow-sm' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('visualizador')}
                >
                  <Eye size={14} />
                  <span>Documento</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-1 px-3 d-flex align-items-center gap-1.5 fw-medium ${
                    activeTab === 'metadados' ? 'active shadow-sm' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('metadados')}
                >
                  <Code size={14} />
                  <span>Dados da API</span>
                </button>
              </li>
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link py-1 px-3 d-flex align-items-center gap-1.5 fw-medium ${
                    activeTab === 'link' ? 'active shadow-sm' : 'text-secondary'
                  }`}
                  onClick={() => setActiveTab('link')}
                >
                  <Copy size={14} />
                  <span>Link & Compartilhar</span>
                </button>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2 small text-muted">
              <ShieldCheck size={14} className="text-success" />
              <span className="d-none d-sm-inline">Documento Autêntico e Transparente</span>
            </div>
          </div>

          {/* Corpo do Modal */}
          <div className="modal-body p-0 flex-grow-1 bg-white position-relative d-flex flex-column overflow-hidden">
            {/* Aba 1: Visualizador Moderno (Object Embed com Fallback Interativo) */}
            {activeTab === 'visualizador' && (
              <div className="w-100 h-100 d-flex flex-column">
                {!loadError ? (
                  <div className="flex-grow-1 position-relative w-100 h-100 bg-secondary bg-opacity-10 d-flex flex-column">
                    <object
                      data={url}
                      type="application/pdf"
                      className="w-100 h-100 flex-grow-1 border-0"
                      onError={() => setLoadError(true)}
                    >
                      {/* Fallback rico se o navegador não puder renderizar o PDF inline */}
                      <div className="d-flex align-items-center justify-content-center h-100 p-4">
                        <div className="card border-0 shadow-sm p-4 text-center" style={{ maxWidth: 480 }}>
                          <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex mx-auto mb-3">
                            <FileText size={36} />
                          </div>
                          <h6 className="fw-bold text-dark mb-2">{title}</h6>
                          <p className="text-muted small mb-4">
                            O documento oficial está pronto para visualização. Clique abaixo para abrir diretamente ou fazer o download seguro.
                          </p>
                          <div className="d-flex justify-content-center gap-2">
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary d-flex align-items-center gap-2"
                            >
                              <ExternalLink size={16} />
                              <span>Abrir Documento</span>
                            </a>
                            <a
                              href={url}
                              download
                              className="btn btn-outline-secondary d-flex align-items-center gap-2"
                            >
                              <Download size={16} />
                              <span>Baixar PDF</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </object>

                    {/* Barra de controle inferior */}
                    <div className="bg-white border-top py-2 px-3 d-flex align-items-center justify-content-between text-muted small">
                      <span className="text-truncate me-2">
                        Origem: <code className="text-primary">{url}</code>
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5 flex-shrink-0"
                      >
                        <Maximize2 size={13} />
                        <span>Tela Cheia</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 p-4">
                    <div className="card border-0 shadow-sm p-4 text-center" style={{ maxWidth: 500 }}>
                      <AlertCircle size={40} className="text-warning mx-auto mb-3" />
                      <h5 className="fw-bold mb-2">Visualização Direta Indisponível</h5>
                      <p className="text-muted small mb-4">
                        A política de segurança da fonte original requer abertura direta na aba do navegador.
                      </p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary d-flex align-items-center justify-content-center gap-2 mx-auto"
                      >
                        <ExternalLink size={16} />
                        <span>Abrir Documento Oficial</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Aba 2: Inspeção de Metadados da API */}
            {activeTab === 'metadados' && (
              <div className="p-3 p-md-4 overflow-auto h-100">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div>
                    <h6 className="fw-bold text-dark mb-1">Metadados Técnicos da API (SAPL)</h6>
                    <small className="text-muted">
                      Dados estruturados em tempo real fornecidos pelos endpoints nativos do sistema.
                    </small>
                  </div>
                  {apiUrl && (
                    <a
                      href={apiUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <ExternalLink size={13} />
                      <span>Endpoint JSON</span>
                    </a>
                  )}
                </div>

                <div className="card border bg-light p-3 rounded-3 mb-3">
                  <div className="row g-2 small">
                    <div className="col-sm-4 text-muted">Título do Documento:</div>
                    <div className="col-sm-8 fw-semibold text-dark">{title}</div>
                    <div className="col-sm-4 text-muted">Formato / Tipo:</div>
                    <div className="col-sm-8"><span className="badge bg-secondary">{isPdf ? 'PDF Oficial' : 'Documento / Arquivo'}</span></div>
                    <div className="col-sm-4 text-muted">URL do Arquivo:</div>
                    <div className="col-sm-8 text-break"><code>{url}</code></div>
                    {apiUrl && (
                      <>
                        <div className="col-sm-4 text-muted">Endpoint da API:</div>
                        <div className="col-sm-8 text-break"><code className="text-success">{apiUrl}</code></div>
                      </>
                    )}
                  </div>
                </div>

                {metadata && Object.keys(metadata).length > 0 ? (
                  <div>
                    <label className="form-label small fw-semibold text-dark">JSON Estruturado da Entidade:</label>
                    <pre
                      className="p-3 bg-dark text-light rounded-3 small overflow-auto mb-0"
                      style={{ maxHeight: '320px', fontSize: '0.8rem' }}
                    >
                      {JSON.stringify(metadata, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="alert alert-info small mb-0">
                    Nenhum metadado adicional foi fornecido para este registro específico. Os dados completos podem ser consultados via <code>/api</code> nativa.
                  </div>
                )}
              </div>
            )}

            {/* Aba 3: Link & Compartilhar */}
            {activeTab === 'link' && (
              <div className="p-4 overflow-auto h-100 d-flex align-items-center justify-content-center">
                <div className="card border-0 shadow-sm p-4 w-100" style={{ maxWidth: 600 }}>
                  <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Copy size={18} className="text-primary" />
                    Link Direto do Documento
                  </h6>

                  <div className="input-group mb-3">
                    <input
                      type="text"
                      readOnly
                      value={url}
                      className="form-control bg-light font-monospace small"
                    />
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`btn ${copied ? 'btn-success' : 'btn-primary'} d-flex align-items-center gap-1.5`}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <p className="text-muted small mb-3">
                    Este link público aponta diretamente para o documento original nos servidores da Câmara Municipal, garantindo autenticidade e validade jurídica.
                  </p>

                  <div className="d-flex flex-wrap gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5"
                    >
                      <ExternalLink size={14} />
                      <span>Testar Link</span>
                    </a>
                    <a
                      href={url}
                      download
                      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                    >
                      <Download size={14} />
                      <span>Baixar Cópia</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
