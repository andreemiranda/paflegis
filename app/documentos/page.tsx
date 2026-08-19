'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { Search, Layers, ChevronRight } from 'lucide-react';
import { ALL_38_DOCUMENT_TYPES } from '@/lib/sapl/documentTypes';
import Pagination from '@/components/Pagination';

function DocumentosIndexContent() {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const categorias = [
    'todos',
    'Matérias e Projetos',
    'Requerimentos por Vereador',
    'Normas e Legislação',
    'Atos e Comissões',
  ];

  const filtered = ALL_38_DOCUMENT_TYPES.filter((doc) => {
    const matchesSearch =
      busca === '' ||
      doc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      doc.sigla.toLowerCase().includes(busca.toLowerCase()) ||
      doc.descricao.toLowerCase().includes(busca.toLowerCase());

    const matchesCat = categoria === 'todos' || doc.categoria === categoria;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedItems = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
          <li className="breadcrumb-item active" aria-current="page">38 Tipos de Documentos Oficiais</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <Layers className="text-primary" /> Catálogo dos 38 Tipos Oficiais de Documentos
          </h1>
          <p className="text-muted small mb-0">
            Acesse páginas exclusivas, filtros e paginação dedicada para os 31 tipos de matérias e 7 tipos de normas jurídicas da Câmara de Pedro Afonso.
          </p>
        </div>
        <div className="badge bg-primary bg-opacity-10 text-primary fs-6 px-3 py-2 border border-primary border-opacity-25">
          {filtered.length} tipos disponíveis
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar por nome ou sigla (ex: IND, REQ, PLL, LO)..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-7">
              <div className="d-flex flex-wrap gap-1">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategoria(cat);
                      setPage(1);
                    }}
                    className={`btn btn-sm ${
                      categoria === cat ? 'btn-primary' : 'btn-outline-secondary'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos os 38 Tipos' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de 38 Tipos de Documentos */}
      <div className="row g-3 mb-4">
        {paginatedItems.map((doc) => (
          <div key={doc.id} className="col-lg-4 col-md-6">
            <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
              <div className="card-body p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 fs-6 border border-primary border-opacity-25">
                      {doc.sigla}
                    </span>
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                      ID #{doc.saplTipoId} · {doc.categoria}
                    </small>
                  </div>
                  <h5 className="fw-bold text-dark mb-2 fs-6">
                    <Link href={`/documentos/${doc.slug}`} className="text-decoration-none text-dark hover-primary">
                      {doc.nome}
                    </Link>
                  </h5>
                  <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.45' }}>
                    {doc.descricao}
                  </p>
                </div>

                <div className="pt-3 border-top d-flex align-items-center justify-content-between">
                  <span className="badge bg-light text-muted border">
                    {doc.tipoApi === 'norma' ? 'Norma Jurídica' : 'Matéria Legislativa'}
                  </span>
                  <Link
                    href={`/documentos/${doc.slug}`}
                    className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                  >
                    <span>Ver Documentos</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação do Catálogo */}
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

export default function DocumentosIndexPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-center text-muted">Carregando catálogo de documentos...</div>}>
      <DocumentosIndexContent />
    </Suspense>
  );
}
