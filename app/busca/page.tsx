'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, FileText, BookOpen, Video, Users, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import MateriaCard from '@/components/MateriaCard';
import NormaCard from '@/components/NormaCard';
import SessaoCard from '@/components/SessaoCard';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

function BuscaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') || '';

  const [termo, setTermo] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState<any[]>([]);
  const [normas, setNormas] = useState<any[]>([]);
  const [sessoes, setSessoes] = useState<any[]>([]);
  const [parlamentares, setParlamentares] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!qParam.trim()) return;

    async function doSearch() {
      setLoading(true);
      try {
        const [resM, resN, resS, resP] = await Promise.allSettled([
          api.getMaterias({ busca: qParam, limite: 4 }),
          api.getNormas({ busca: qParam, limite: 4 }),
          api.getSessoes({ busca: qParam, limite: 4 }),
          api.getParlamentares({ search: qParam }),
        ]);

        if (resM.status === 'fulfilled') setMaterias(resM.value.items || []);
        if (resN.status === 'fulfilled') setNormas(resN.value.items || []);
        if (resS.status === 'fulfilled') setSessoes(resS.value.items || []);
        if (resP.status === 'fulfilled') setParlamentares(resP.value.results || []);
      } finally {
        setLoading(false);
      }
    }

    doSearch();
  }, [qParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (termo.trim()) {
      router.push(`/busca?q=${encodeURIComponent(termo.trim())}`);
    }
  };

  const totalResults = materias.length + normas.length + sessoes.length + parlamentares.length;

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="h3 fw-bold text-dark mb-2">Busca Cívica Global</h1>
        <p className="text-muted small mx-auto" style={{ maxWidth: 600 }}>
          Pesquise simultaneamente em matérias legislativas, legislação municipal, sessões plenárias e parlamentares.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mx-auto mt-3" style={{ maxWidth: 640 }}>
          <div className="input-group input-group-lg shadow-sm">
            <span className="input-group-text bg-white border-end-0 text-muted">
              <Search size={20} />
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Digite um tema, assunto, número de lei ou nome..."
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
            />
            <button type="submit" className="btn btn-primary px-4">
              Buscar
            </button>
          </div>
        </form>
      </div>

      {qParam && (
        <div className="mb-4 d-flex justify-content-between align-items-center">
          <span className="text-muted small">
            Resultados para: <strong className="text-dark">"{qParam}"</strong>
          </span>
          <span className="badge bg-light text-muted border">
            {loading ? 'Buscando...' : `${totalResults} resultados encontrados`}
          </span>
        </div>
      )}

      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <span>Pesquisando em toda a base pública...</span>
        </div>
      ) : qParam ? (
        <div className="d-flex flex-column gap-4">
          {/* Parlamentares encontrados */}
          {parlamentares.length > 0 && (
            <div className="card border-0 shadow-sm p-4">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 fs-6">
                <Users size={18} className="text-primary" /> Vereadores & Parlamentares ({parlamentares.length})
              </h5>
              <div className="row g-3">
                {parlamentares.slice(0, 4).map((p: any) => (
                  <div key={p.id} className="col-md-6 col-lg-3">
                    <div className="p-3 bg-light rounded-3 h-100">
                      <strong className="d-block text-dark">{p.nome_parlamentar || p.nome_completo}</strong>
                      <span className="badge bg-secondary bg-opacity-10 text-secondary border mt-1">
                        {p.partido || 'Sem partido'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matérias Legislativas */}
          {materias.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-dark mb-0 fs-6 d-flex align-items-center gap-2">
                  <FileText size={18} className="text-primary" /> Matérias Legislativas ({materias.length})
                </h5>
                <Link href={`/materias?busca=${encodeURIComponent(qParam)}`} className="btn btn-sm btn-link text-decoration-none">
                  Ver todas as matérias &rarr;
                </Link>
              </div>
              <div className="d-flex flex-column gap-3">
                {materias.map((m) => (
                  <MateriaCard key={m.id} materia={m} onPreview={(url, title) => setPreviewDoc({ url, title })} />
                ))}
              </div>
            </div>
          )}

          {/* Normas Jurídicas */}
          {normas.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-dark mb-0 fs-6 d-flex align-items-center gap-2">
                  <BookOpen size={18} className="text-success" /> Legislação & Normas ({normas.length})
                </h5>
                <Link href={`/normas?busca=${encodeURIComponent(qParam)}`} className="btn btn-sm btn-link text-decoration-none text-success">
                  Ver todas as normas &rarr;
                </Link>
              </div>
              <div className="d-flex flex-column gap-3">
                {normas.map((n) => (
                  <NormaCard key={n.id} norma={n} onPreview={(url, title) => setPreviewDoc({ url, title })} />
                ))}
              </div>
            </div>
          )}

          {/* Sessões Plenárias */}
          {sessoes.length > 0 && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="fw-bold text-dark mb-0 fs-6 d-flex align-items-center gap-2">
                  <Video size={18} className="text-danger" /> Sessões Plenárias ({sessoes.length})
                </h5>
                <Link href={`/sessoes?busca=${encodeURIComponent(qParam)}`} className="btn btn-sm btn-link text-decoration-none text-danger">
                  Ver todas as sessões &rarr;
                </Link>
              </div>
              <div className="d-flex flex-column gap-3">
                {sessoes.map((s) => (
                  <SessaoCard key={s.id} sessao={s} onPreview={(url, title) => setPreviewDoc({ url, title })} />
                ))}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
              <Search size={36} className="mx-auto mb-2 text-muted" />
              <h5 className="fw-semibold text-dark">Nenhum resultado encontrado</h5>
              <p className="small mb-0">Tente buscar por palavras mais gerais ou consulte o catálogo completo de dados públicos.</p>
            </div>
          )}
        </div>
      ) : null}

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

export default function BuscaPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-center text-muted">Carregando pesquisa...</div>}>
      <BuscaContent />
    </Suspense>
  );
}
