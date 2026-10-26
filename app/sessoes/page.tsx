'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Video, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { SessaoPlenaria } from '@/types';
import SessaoCard from '@/components/SessaoCard';
import Pagination from '@/components/Pagination';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';
import YouTubeModal from '@/components/YouTubeModal';

function SessoesContent() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<SessaoPlenaria[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(Number(searchParams.get('pagina') || 1));
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [ano, setAno] = useState(searchParams.get('ano') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  const loadSessoes = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getSessoes({
        busca: busca.trim() || undefined,
        ano: ano || undefined,
        pagina: page,
        limite: 10,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar sessões plenárias.');
    } finally {
      setLoading(false);
    }
  }, [busca, ano, page]);

  useEffect(() => {
    loadSessoes();
  }, [loadSessoes]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setBusca('');
    setAno('');
    setPage(1);
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><a href="/" className="text-decoration-none">Início</a></li>
          <li className="breadcrumb-item active" aria-current="page">Sessões Plenárias</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Video className="text-danger" /> Sessões Plenárias
          </h1>
          <p className="text-muted small mb-0">
            Acompanhe pautas, atas e gravações das sessões ordinárias, extraordinárias e solenes da Câmara de Pedro Afonso.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => loadSessoes()}
            className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1.5"
            title="Atualizar dados da API"
          >
            <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm' : ''} />
            <span>Atualizar</span>
          </button>
          <div className="badge bg-danger bg-opacity-10 text-danger fs-6 px-3 py-2 border border-danger border-opacity-25">
            {total} {total === 1 ? 'sessão encontrada' : 'sessões encontradas'}
          </div>
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleFilterSubmit} className="row g-3">
            <div className="col-md-7">
              <label className="form-label small fw-semibold text-muted">Pesquisa por termo</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar por pauta, número..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Ano</label>
              <input
                type="number"
                className="form-control"
                placeholder="Ex: 2024"
                value={ano}
                onChange={(e) => {
                  setAno(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end gap-2">
              <button type="submit" className="btn btn-danger w-100">
                Filtrar
              </button>
              {(busca || ano) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline-secondary"
                  title="Limpar filtros"
                >
                  Limpar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} className="text-warning flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* List / Loading */}
      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-danger" />
          <span className="fs-6">Carregando sessões plenárias do SAPL...</span>
        </div>
      ) : items.length > 0 ? (
        <div>
          {items.map((sessao) => (
            <SessaoCard
              key={sessao.id}
              sessao={sessao}
              onPreview={(url, title) => setPreviewDoc({ url, title })}
              onWatchVideo={(url, title) => setVideoModal({ url, title })}
            />
          ))}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <Video size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhuma sessão encontrada</h5>
          <p className="small mb-3">Tente alterar o ano ou o termo de pesquisa.</p>
          {(busca || ano) && (
            <button onClick={handleClearFilters} className="btn btn-sm btn-outline-danger mx-auto">
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Preview Modals */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {videoModal && (
        <YouTubeModal
          url={videoModal.url}
          title={videoModal.title}
          onClose={() => setVideoModal(null)}
        />
      )}
    </div>
  );
}

export default function SessoesPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center text-muted">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-danger" />
          <p>Carregando sessões plenárias...</p>
        </div>
      }
    >
      <SessoesContent />
    </Suspense>
  );
}
