'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { ALL_38_DOCUMENT_TYPES, getDocumentTypeBySlug } from '@/lib/sapl/documentTypes';
import MateriaCard from '@/components/MateriaCard';
import NormaCard from '@/components/NormaCard';
import Pagination from '@/components/Pagination';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

interface PageProps {
  params: Promise<{ slug: string }>;
}

function DocumentTypeView({ paramsPromise }: { paramsPromise: Promise<{ slug: string }> }) {
  const { slug } = use(paramsPromise);
  const searchParams = useSearchParams();

  const docType = getDocumentTypeBySlug(slug);

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(Number(searchParams.get('pagina') || 1));
  const [busca, setBusca] = useState(searchParams.get('busca') || '');
  const [ano, setAno] = useState(searchParams.get('ano') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  // Fetch document items matching this specific type from the real SAPL API
  useEffect(() => {
    if (!docType) return;

    async function loadDocuments() {
      setLoading(true);
      setError('');
      try {
        if (docType?.tipoApi === 'materia') {
          const res = await api.getMaterias({
            busca: busca.trim() || undefined,
            tipo: docType.saplTipoId ? String(docType.saplTipoId) : undefined,
            ano: ano || undefined,
            pagina: page,
            limite: 10,
          });
          setItems(res.items || []);
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
        } else {
          const res = await api.getNormas({
            busca: busca.trim() || undefined,
            tipo: docType?.saplTipoId ? String(docType.saplTipoId) : undefined,
            ano: ano || undefined,
            pagina: page,
            limite: 10,
          });
          setItems(res.items || []);
          setTotal(res.total || 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar documentos deste tipo.');
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [docType, busca, ano, page]);

  if (!docType) {
    return (
      <div className="container py-5 text-center">
        <div className="card p-5 border-0 shadow-sm mx-auto" style={{ maxWidth: 600 }}>
          <AlertCircle size={48} className="text-warning mx-auto mb-3" />
          <h2 className="h4 fw-bold text-dark mb-2">Tipo de Documento Não Encontrado</h2>
          <p className="text-muted small mb-4">
            O tipo de documento solicitado não consta na lista dos 38 tipos cadastrados na API do SAPL.
          </p>
          <Link href="/documentos" className="btn btn-primary">
            Ver Todos os 38 Tipos de Documentos
          </Link>
        </div>
      </div>
    );
  }

  const relatedTypes = ALL_38_DOCUMENT_TYPES.filter(
    (t) => t.categoria === docType.categoria && t.slug !== docType.slug
  ).slice(0, 6);

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
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
          <li className="breadcrumb-item"><Link href="/documentos" className="text-decoration-none">38 Tipos de Documentos</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{docType.nome}</li>
        </ol>
      </nav>

      {/* Header do Tipo de Documento */}
      <div className="card border-0 shadow-sm mb-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary bg-opacity-10 text-primary fw-bold rounded-3 p-3 d-flex flex-column align-items-center justify-content-center border border-primary border-opacity-25"
                style={{ minWidth: 70, minHeight: 70 }}
              >
                <span className="fs-5 lh-1">{docType.sigla}</span>
                <small style={{ fontSize: '0.65rem' }}>ID #{docType.saplTipoId}</small>
              </div>
              <div>
                <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                  <h1 className="h3 fw-bold text-dark mb-0">{docType.nome}</h1>
                  <span className="badge bg-secondary bg-opacity-10 text-secondary border">
                    {docType.categoria}
                  </span>
                </div>
                <p className="text-muted small mb-0 mt-1" style={{ maxWidth: 750 }}>
                  {docType.descricao}
                </p>
              </div>
            </div>

            <div className="badge bg-primary text-white fs-6 px-3 py-2">
              {total} {total === 1 ? 'documento encontrado' : 'documentos encontrados'}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3 p-md-4">
          <form onSubmit={handleFilterSubmit} className="row g-3">
            <div className="col-md-7">
              <label className="form-label small fw-semibold text-muted">Pesquisar por termo na ementa ou texto</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Buscar em ${docType.nome}...`}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-3">
              <label className="form-label small fw-semibold text-muted">Ano do Documento</label>
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
              <button type="submit" className="btn btn-primary w-100">
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

      {/* Listagem e Paginação */}
      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <span className="fs-6">Carregando {docType.nome} da API do SAPL...</span>
        </div>
      ) : items.length > 0 ? (
        <div>
          {items.map((item) => {
            if (docType.tipoApi === 'norma') {
              return (
                <NormaCard
                  key={item.id}
                  norma={item}
                  onPreview={(url, title) => setPreviewDoc({ url, title })}
                />
              );
            }
            return (
              <MateriaCard
                key={item.id}
                materia={item}
                onPreview={(url, title) => setPreviewDoc({ url, title })}
              />
            );
          })}

          {/* Paginação Obrigatória */}
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <FileText size={40} className="mx-auto mb-2 text-muted opacity-50" />
          <h5 className="fw-semibold text-dark">Nenhum documento encontrado para este tipo</h5>
          <p className="small mb-3">Tente remover os filtros ou consultar outro ano legislativo.</p>
          {(busca || ano) && (
            <button onClick={handleClearFilters} className="btn btn-sm btn-outline-primary mx-auto">
              Limpar Filtros
            </button>
          )}
        </div>
      )}

      {/* Outros Tipos Relacionados na Categoria */}
      {relatedTypes.length > 0 && (
        <div className="mt-5 pt-4 border-top">
          <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <Layers size={16} className="text-primary" />
            Outros tipos em {docType.categoria}
          </h6>
          <div className="d-flex flex-wrap gap-2">
            {relatedTypes.map((rel) => (
              <Link
                key={rel.slug}
                href={`/documentos/${rel.slug}`}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 text-decoration-none"
              >
                <span className="badge bg-primary bg-opacity-10 text-primary">{rel.sigla}</span>
                <span>{rel.nome}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Modais de Pré-visualização */}
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

export default function DocumentTypePage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center text-muted">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <p>Carregando documento legislativo...</p>
        </div>
      }
    >
      <DocumentTypeView paramsPromise={params} />
    </Suspense>
  );
}
