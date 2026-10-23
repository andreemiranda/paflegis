'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, Search, RefreshCw, AlertCircle, ExternalLink, Calendar } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import Pagination from '@/components/Pagination';

export default function ComissoesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getComissoes({ page, search: busca || undefined });
        setItems(res.results || []);
        setTotal(res.count || (res.results ? res.results.length : 0));
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar as comissões parlamentares.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [page, busca]);

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Comissões</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Layers className="text-primary" /> Comissões Parlamentares
          </h1>
          <p className="text-muted small mb-0">
            Acompanhe a atuação, composição e pareceres das comissões permanentes e temporárias da Câmara.
          </p>
        </div>
        <div className="badge bg-primary bg-opacity-10 text-primary fs-6 px-3 py-2 border border-primary border-opacity-25">
          {total} comissões registradas
        </div>
      </div>

      {/* Busca */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white text-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Pesquisar comissão por nome ou finalidade..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
            />
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
          <span>Carregando dados das comissões...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="row g-4 mb-4">
          {items.map((c: any) => (
            <div key={c.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 card-hover">
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">
                        {c.sigla || 'COMISSÃO'}
                      </span>
                      <small className="text-muted">ID #{c.id}</small>
                    </div>
                    <h5 className="fw-bold text-dark mb-2 fs-6">
                      {c.nome || c.__str__ || 'Comissão Parlamentar'}
                    </h5>
                    {c.finalidade && (
                      <p className="text-muted small mb-3 text-truncate-3" style={{ fontSize: '0.84rem' }}>
                        {c.finalidade}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <span className="badge bg-light text-muted border">
                      {c.tipo || 'Permanente'}
                    </span>
                    <Link
                      href={`/dados-publicos/comissoes/comissao`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      Ver no Catálogo &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <Layers size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhuma comissão encontrada</h5>
          <p className="small mb-0">Tente ajustar o termo de pesquisa.</p>
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
  );
}
