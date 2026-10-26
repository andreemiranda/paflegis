'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, RefreshCw, AlertCircle, ExternalLink, Mail, Phone, Award } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import Pagination from '@/components/Pagination';

export default function ParlamentaresPage() {
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
        const res = await api.getParlamentares({ page, search: busca || undefined });
        setItems(res.results || []);
        setTotal(res.count || (res.results ? res.results.length : 0));
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar os parlamentares.');
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
          <li className="breadcrumb-item active" aria-current="page">Parlamentares</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Users className="text-primary" /> Vereadores & Mesa Diretora
          </h1>
          <p className="text-muted small mb-0">
            Conheça os representantes eleitos, partidos e composições das legislaturas municipais.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              api.getParlamentares({ page, search: busca || undefined })
                .then((res) => {
                  setItems(res.results || []);
                  setTotal(res.count || (res.results ? res.results.length : 0));
                })
                .catch(() => {})
                .finally(() => setLoading(false));
            }}
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
            title="Atualizar dados da API"
          >
            <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm' : ''} />
            <span>Atualizar</span>
          </button>
          <div className="badge bg-primary bg-opacity-10 text-primary fs-6 px-3 py-2 border border-primary border-opacity-25">
            {total} parlamentares registrados
          </div>
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
              placeholder="Pesquisar vereador por nome ou partido..."
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
          <span>Carregando dados dos parlamentares...</span>
        </div>
      ) : items.length > 0 ? (
        <div className="row g-4 mb-4">
          {items.map((p: any) => (
            <div key={p.id} className="col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm h-100 card-hover">
                <div className="card-body p-4">
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-circle d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                      <Award size={28} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark mb-0 fs-6">
                        {p.nome_parlamentar || p.nome_completo || p.__str__ || 'Vereador'}
                      </h5>
                      <span className="badge bg-light text-muted border mt-1">
                        {p.partido || p.sigla_partido || 'Sem partido informado'}
                      </span>
                    </div>
                  </div>

                  <div className="small text-muted d-flex flex-column gap-1 mb-3">
                    {p.nome_completo && p.nome_completo !== p.nome_parlamentar && (
                      <div><strong>Nome civil:</strong> {p.nome_completo}</div>
                    )}
                    {p.ativo !== undefined && (
                      <div><strong>Mandato:</strong> <span className={p.ativo ? 'text-success fw-bold' : 'text-muted'}>{p.ativo ? 'Em exercício' : 'Inativo/Anterior'}</span></div>
                    )}
                  </div>

                  <div className="pt-3 border-top d-flex flex-wrap gap-2 justify-content-between align-items-center">
                    <Link
                      href={`/parlamentares/${p.id}`}
                      className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    >
                      <span>Ver Perfil</span> &rarr;
                    </Link>
                    <Link
                      href={`/materias?busca=${encodeURIComponent(p.nome_parlamentar || p.nome_completo || '')}`}
                      className="btn btn-sm btn-outline-secondary"
                    >
                      Matérias
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <Users size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhum parlamentar encontrado</h5>
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
