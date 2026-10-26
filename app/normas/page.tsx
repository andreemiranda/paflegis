'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { NormaJuridica, TipoFiltro } from '@/types';
import NormaCard from '@/components/NormaCard';
import Pagination from '@/components/Pagination';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

function NormasContent() {
  const searchParams = useSearchParams();

  const [items, setItems] = useState<NormaJuridica[]>([]);
  const [tipos, setTipos] = useState<TipoFiltro[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(Number(searchParams.get('pagina') || 1));
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [tipo, setTipo] = useState(searchParams.get('tipo') || '');
  const [ano, setAno] = useState(searchParams.get('ano') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    api.getTiposNormas().then(setTipos).catch(() => {});
  }, []);

  const loadNormas = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getNormas({
        busca: busca.trim() || undefined,
        tipo: tipo || undefined,
        ano: ano || undefined,
        pagina: page,
        limite: 10,
      });
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar normas jurídicas.');
    } finally {
      setLoading(false);
    }
  }, [busca, tipo, ano, page]);

  useEffect(() => {
    loadNormas();
  }, [loadNormas]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleClearFilters = () => {
    setBusca('');
    setTipo('');
    setAno('');
    setPage(1);
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><a href="/" className="text-decoration-none">Início</a></li>
          <li className="breadcrumb-item active" aria-current="page">Normas Jurídicas</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <BookOpen className="text-success" /> Legislação Municipal
          </h1>
          <p className="text-muted small mb-0">
            Consulte leis ordinárias, leis complementares, decretos e resoluções promulgadas em Pedro Afonso - TO.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => loadNormas()}
            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5"
            title="Atualizar dados da API"
          >
            <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm' : ''} />
            <span>Atualizar</span>
          </button>
          <div className="badge bg-success bg-opacity-10 text-success fs-6 px-3 py-2 border border-success border-opacity-25">
            {total} {total === 1 ? 'norma encontrada' : 'normas encontradas'}
          </div>
        </div>
      </div>

      {/* Search & Filter Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleFilterSubmit} className="row g-3">
            <div className="col-md-5">
              <label className="form-label small fw-semibold text-muted">Pesquisa por termo</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar ementa, assunto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Tipo de Norma</label>
              <select
                className="form-select"
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos os tipos</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome || t.descricao || t.sigla}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
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
              <button type="submit" className="btn btn-success w-100">
                Filtrar
              </button>
              {(busca || tipo || ano) && (
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
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-success" />
          <span className="fs-6">Carregando legislação municipal do SAPL...</span>
        </div>
      ) : items.length > 0 ? (
        <div>
          {items.map((norma) => (
            <NormaCard
              key={norma.id}
              norma={norma}
              onPreview={(url, title) => setPreviewDoc({ url, title })}
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
          <BookOpen size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhuma norma jurídica encontrada</h5>
          <p className="small mb-3">Tente ajustar os filtros ou pesquisar com termos mais amplos.</p>
          {(busca || tipo || ano) && (
            <button onClick={handleClearFilters} className="btn btn-sm btn-outline-success mx-auto">
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

export default function NormasPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center text-muted">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-success" />
          <p>Carregando legislação municipal...</p>
        </div>
      }
    >
      <NormasContent />
    </Suspense>
  );
}
