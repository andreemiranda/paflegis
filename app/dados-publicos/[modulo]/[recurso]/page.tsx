'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Database,
  Search,
  RefreshCw,
  AlertCircle,
  Code,
  Table as TableIcon,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import Pagination from '@/components/Pagination';

interface PageProps {
  params: Promise<{ modulo: string; recurso: string }>;
}

function GenericExplorerContent({ paramsPromise }: { paramsPromise: Promise<{ modulo: string; recurso: string }> }) {
  const { modulo, recurso } = use(paramsPromise);
  const searchParams = useSearchParams();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [busca, setBusca] = useState(searchParams.get('search') || '');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  useEffect(() => {
    async function loadResource() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getGenericResource(modulo, recurso, {
          page,
          search: busca || undefined,
          page_size: 20,
        });
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Erro ao consultar recurso na API.');
      } finally {
        setLoading(false);
      }
    }
    loadResource();
  }, [modulo, recurso, page, busca]);

  const items: any[] = Array.isArray(data) ? data : data?.results || [];
  const total = data?.count ?? items.length;
  const totalPages = Math.ceil(total / 20) || 1;

  // Extrai colunas relevantes do primeiro registro
  const sample = items[0] || {};
  const columns = Object.keys(sample).filter(
    (k) => typeof sample[k] !== 'object' && k !== 'texto_articulado'
  ).slice(0, 6);

  const nativeApiUrl = `/api/${modulo}/${recurso}/`;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
          <li className="breadcrumb-item"><Link href="/dados-publicos" className="text-decoration-none">Dados Públicos</Link></li>
          <li className="breadcrumb-item text-muted">{modulo}</li>
          <li className="breadcrumb-item active" aria-current="page">{recurso}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-primary bg-opacity-10 text-primary fs-6 px-2.5 py-1 text-uppercase">
                  {modulo}
                </span>
                <h1 className="h4 fw-bold text-dark mb-0">{recurso}</h1>
              </div>
              <p className="text-muted small mb-0">
                Explorador universal de dados públicos abertos do SAPL.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2">
              <a
                href={nativeApiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
              >
                <Code size={14} /> <span>Abrir Endpoint na API Nativa</span> <ExternalLink size={12} />
              </a>
              <span className="badge bg-light text-dark border fs-6 px-3 py-2">
                {total} registros
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Alternância de Visualização */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="row g-3 align-items-center justify-content-between">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Pesquisar em ${recurso}...`}
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-4 d-flex justify-content-md-end gap-2">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
              >
                <TableIcon size={14} /> Tabela
              </button>
              <button
                type="button"
                onClick={() => setViewMode('json')}
                className={`btn btn-sm ${viewMode === 'json' ? 'btn-primary' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
              >
                <Code size={14} /> JSON Bruto
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-warning flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <span>Carregando dados da coleção {modulo}/{recurso}...</span>
        </div>
      ) : items.length > 0 ? (
        <div>
          {viewMode === 'table' ? (
            <div className="card border-0 shadow-sm mb-4 overflow-hidden">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      {columns.map((col) => (
                        <th key={col} className="text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx}>
                        {columns.map((col) => {
                          const val = row[col];
                          const str = val !== null && val !== undefined ? String(val) : '-';
                          return (
                            <td key={col} className="text-truncate" style={{ maxWidth: 220 }}>
                              {col === 'url' && val ? (
                                <a href={val} target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">
                                  Link <ExternalLink size={12} />
                                </a>
                              ) : (
                                str
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-0">
                <pre className="bg-dark text-white p-4 rounded-3 small mb-0 font-monospace overflow-auto" style={{ maxHeight: 520 }}>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <Database size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhum registro encontrado</h5>
          <p className="small mb-0">Esta coleção não retornou itens para os parâmetros atuais.</p>
        </div>
      )}
    </div>
  );
}

export default function GenericExplorerPage({ params }: PageProps) {
  return (
    <Suspense fallback={<div className="container py-5 text-center text-muted">Carregando explorador...</div>}>
      <GenericExplorerContent paramsPromise={params} />
    </Suspense>
  );
}
