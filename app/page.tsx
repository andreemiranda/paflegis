'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  FileText,
  BookOpen,
  Video,
  BarChart3,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Building,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { EstatisticasLegislativas, MateriaLegislativa, SessaoPlenaria } from '@/types';
import MateriaCard from '@/components/MateriaCard';
import SessaoCard from '@/components/SessaoCard';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';
import YouTubeModal from '@/components/YouTubeModal';

export default function HomePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<EstatisticasLegislativas | null>(null);
  const [recentMaterias, setRecentMaterias] = useState<MateriaLegislativa[]>([]);
  const [recentSessoes, setRecentSessoes] = useState<SessaoPlenaria[]>([]);
  const [loading, setLoading] = useState(true);

  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, matData, sesData] = await Promise.all([
          api.getEstatisticas().catch(() => null),
          api.getMaterias({ limite: 4 }).catch(() => ({ items: [] })),
          api.getSessoes({ limite: 3 }).catch(() => ({ items: [] })),
        ]);

        if (statsData) setStats(statsData);
        if (matData?.items) setRecentMaterias(matData.items);
        if (sesData?.items) setRecentSessoes(sesData.items);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/busca?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-paflegis-hero py-5 text-white shadow-sm">
        <div className="container py-3">
          <div className="row align-items-center g-4">
            <div className="col-lg-8 mx-auto text-center">
              <div className="d-inline-flex align-items-center bg-white text-dark px-3.5 py-1.5 rounded-pill shadow-sm mb-3 border border-light">
                <span className="fw-bold text-dark" style={{ fontSize: '0.86rem' }}>
                  Portal Cívico de Consulta & Transparência Legislativa
                </span>
              </div>
              <h1 className="display-5 fw-bold mb-3">
                Transparência e Consulta Legislativa Descomplicada
              </h1>
              <p className="lead text-white-50 mb-4">
                Acesse projetos de lei, normas municipais, pautas, vereadores e gravações das sessões plenárias com rapidez e clareza.
              </p>

              {/* Quick Search Box */}
              <form onSubmit={handleSearch} className="card p-2 bg-white shadow-lg border-0 mx-auto" style={{ maxWidth: 640 }}>
                <div className="input-group">
                  <span className="input-group-text bg-white border-0 text-muted ps-3">
                    <Search size={20} />
                  </span>
                  <input
                    type="text"
                    className="form-control form-control-lg border-0 shadow-none text-dark"
                    placeholder="Pesquise por palavras-chave, assunto, número ou autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-lg px-4 rounded-2">
                    Buscar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container py-5">
        {/* Metric Stats Cards */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="fw-bold text-dark mb-0 fs-6">Estatísticas Consolidadas do Município</h4>
          {stats?.atualizado_em && (
            <span className="text-muted small">
              Atualizado em: {new Date(stats.atualizado_em).toLocaleDateString('pt-BR')} ({stats.fonte === 'upstream-live' ? 'Ao vivo' : stats.fonte === 'mirror-storage' ? 'Espelho local' : 'Em sincronização'})
            </span>
          )}
        </div>

        <div className="row g-3 mb-5">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 card-hover">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                  <FileText size={28} />
                </div>
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Matérias Legislativas</span>
                  <h3 className="fw-bold text-dark mb-0">
                    {loading ? '...' : (stats?.total_materias || 0).toLocaleString('pt-BR')}
                  </h3>
                  <small className="text-muted">
                    {stats?.materias_ano_atual ? `${stats.materias_ano_atual} neste ano` : 'Projetos e requerimentos'}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 card-hover">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-success bg-opacity-10 text-success p-3 rounded-3">
                  <BookOpen size={28} />
                </div>
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Normas Jurídicas</span>
                  <h3 className="fw-bold text-dark mb-0">
                    {loading ? '...' : (stats?.total_normas || 0).toLocaleString('pt-BR')}
                  </h3>
                  <small className="text-muted">
                    {stats?.normas_ano_atual ? `${stats.normas_ano_atual} neste ano` : 'Leis e decretos'}
                  </small>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 h-100 card-hover">
              <div className="d-flex align-items-center gap-3">
                <div className="bg-danger bg-opacity-10 text-danger p-3 rounded-3">
                  <Video size={28} />
                </div>
                <div>
                  <span className="text-muted small fw-semibold text-uppercase">Sessões Plenárias</span>
                  <h3 className="fw-bold text-dark mb-0">
                    {loading ? '...' : (stats?.total_sessoes || 0).toLocaleString('pt-BR')}
                  </h3>
                  <small className="text-muted">
                    {stats?.sessoes_ano_atual ? `${stats.sessoes_ano_atual} neste ano` : 'Pautas e atas gravadas'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Nav Modules */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-primary text-white p-2 rounded-3">
                  <FileText size={24} />
                </div>
                <Link href="/materias" className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1">
                  Ver Todas <ArrowRight size={14} />
                </Link>
              </div>
              <h5 className="fw-bold text-dark mb-2">Matérias Legislativas</h5>
              <p className="text-muted small mb-0">
                Acompanhe projetos de lei, indicações, requerimentos e emendas que tramitam no Legislativo Municipal.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-success text-white p-2 rounded-3">
                  <BookOpen size={24} />
                </div>
                <Link href="/normas" className="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
                  Ver Todas <ArrowRight size={14} />
                </Link>
              </div>
              <h5 className="fw-bold text-dark mb-2">Legislação Municipal</h5>
              <p className="text-muted small mb-0">
                Consulte leis ordinárias, leis complementares, decretos e resoluções promulgadas em Pedro Afonso.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100 p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="bg-danger text-white p-2 rounded-3">
                  <Video size={24} />
                </div>
                <Link href="/sessoes" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
                  Ver Todas <ArrowRight size={14} />
                </Link>
              </div>
              <h5 className="fw-bold text-dark mb-2">Sessões da Câmara</h5>
              <p className="text-muted small mb-0">
                Acesse as transmissões ao vivo e gravações das sessões ordinárias e extraordinárias da Câmara.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Items Grid */}
        <div className="row g-4">
          {/* Matérias Recentes */}
          <div className="col-lg-7">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold text-dark fs-5 mb-0 d-flex align-items-center gap-2">
                <FileText size={20} className="text-primary" /> Matérias Legislativas Recentes
              </h4>
              <Link href="/materias" className="btn btn-sm btn-link text-primary text-decoration-none p-0">
                Ver mais matérias &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="card p-5 text-center text-muted border-0 shadow-sm">
                <RefreshCw size={24} className="spinner-border spinner-border-sm mx-auto mb-2 text-primary" />
                <span>Carregando matérias recentes do SAPL...</span>
              </div>
            ) : recentMaterias.length > 0 ? (
              <div>
                {recentMaterias.map((mat) => (
                  <MateriaCard
                    key={mat.id}
                    materia={mat}
                    onPreview={(url, title) => setPreviewDoc({ url, title })}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-4 text-center text-muted border-0 shadow-sm">
                Nenhuma matéria legislativa recente encontrada.
              </div>
            )}
          </div>

          {/* Sessões Recentes */}
          <div className="col-lg-5">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold text-dark fs-5 mb-0 d-flex align-items-center gap-2">
                <Video size={20} className="text-danger" /> Últimas Sessões
              </h4>
              <Link href="/sessoes" className="btn btn-sm btn-link text-danger text-decoration-none p-0">
                Ver todas &rarr;
              </Link>
            </div>

            {loading ? (
              <div className="card p-5 text-center text-muted border-0 shadow-sm">
                <RefreshCw size={24} className="spinner-border spinner-border-sm mx-auto mb-2 text-danger" />
                <span>Carregando sessões recentes...</span>
              </div>
            ) : recentSessoes.length > 0 ? (
              <div>
                {recentSessoes.map((ses) => (
                  <SessaoCard
                    key={ses.id}
                    sessao={ses}
                    onPreview={(url, title) => setPreviewDoc({ url, title })}
                    onWatchVideo={(url, title) => setVideoModal({ url, title })}
                  />
                ))}
              </div>
            ) : (
              <div className="card p-4 text-center text-muted border-0 shadow-sm">
                Nenhuma sessão plenária recente encontrada.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
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
