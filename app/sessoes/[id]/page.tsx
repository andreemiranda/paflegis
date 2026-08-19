'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video,
  Calendar,
  Clock,
  Eye,
  Share2,
  Check,
  ArrowLeft,
  FileText,
  Users,
  ListOrdered,
  ExternalLink,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { SessaoPlenaria } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';
import YouTubeModal from '@/components/YouTubeModal';

export default function SessaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [sessao, setSessao] = useState<SessaoPlenaria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [videoModal, setVideoModal] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadSessao() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getSessaoById(id);
        setSessao(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes da sessão.');
      } finally {
        setLoading(false);
      }
    }
    loadSessao();
  }, [id]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        <RefreshCw size={32} className="spinner-border spinner-border-sm mx-auto mb-3 text-danger" />
        <p>Carregando dados da sessão plenária...</p>
      </div>
    );
  }

  if (error || !sessao) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning border-0 shadow-sm p-4 text-center">
          <AlertCircle size={32} className="text-warning mx-auto mb-2" />
          <h5>Sessão Não Encontrada</h5>
          <p className="text-muted small mb-3">{error || 'Não foi possível localizar esta sessão plenária.'}</p>
          <Link href="/sessoes" className="btn btn-danger">
            Voltar para Sessões
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Back button & Breadcrumb */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb small mb-0">
            <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
            <li className="breadcrumb-item"><Link href="/sessoes" className="text-decoration-none">Sessões</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{sessao.tipo} {sessao.numero}/{sessao.ano}</li>
          </ol>
        </nav>
        <button onClick={() => router.back()} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      {/* Main Detail Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="badge bg-danger text-white fs-6 px-3 py-2">
                {sessao.tipo} Nº {sessao.numero}/{sessao.ano}
              </span>
              <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2">
                {sessao.situacao || 'Realizada'}
              </span>
            </div>

            <button
              onClick={handleShare}
              className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'} d-flex align-items-center gap-1`}
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>

          <h1 className="h4 fw-bold text-dark mb-4 lh-base">
            {sessao.tipo} Nº {sessao.numero}/{sessao.ano} · Câmara Municipal de Pedro Afonso
          </h1>

          {/* Info grid */}
          <div className="row g-3 bg-light p-3 rounded-3 mb-4">
            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Data da Sessão</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Calendar size={16} className="text-danger" /> {sessao.data || 'Não informada'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Horário de Início</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Clock size={16} className="text-danger" /> {sessao.horario || 'Não informado'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Situação</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Video size={16} className="text-danger" /> {sessao.situacao || 'Realizada'}
              </span>
            </div>
          </div>

          {/* Document & Video Actions */}
          <div className="d-flex flex-wrap gap-2">
            {sessao.youtube_url && (
              <button
                onClick={() => setVideoModal({ url: sessao.youtube_url!, title: `${sessao.tipo} Nº ${sessao.numero}/${sessao.ano}` })}
                className="btn btn-danger d-flex align-items-center gap-2"
              >
                <Video size={16} /> Assistir Vídeo da Sessão
              </button>
            )}

            {sessao.pauta_url && (
              <button
                onClick={() => setPreviewDoc({ url: sessao.pauta_url!, title: `Pauta - ${sessao.tipo} ${sessao.numero}/${sessao.ano}` })}
                className="btn btn-outline-primary d-flex align-items-center gap-2"
              >
                <Eye size={16} /> Ver Pauta
              </button>
            )}

            {sessao.ata_url && (
              <button
                onClick={() => setPreviewDoc({ url: sessao.ata_url!, title: `Ata - ${sessao.tipo} ${sessao.numero}/${sessao.ano}` })}
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
              >
                <FileText size={16} /> Ver Ata
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ordem do Dia */}
      {sessao.ordem_dia && sessao.ordem_dia.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
              <ListOrdered size={18} className="text-primary" /> Matérias na Ordem do Dia ({sessao.ordem_dia.length})
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="d-flex flex-column gap-3">
              {sessao.ordem_dia.map((item, idx) => (
                <div key={idx} className="p-3 bg-light rounded-3 border-start border-danger border-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">
                      {item.ordem ? `Item ${item.ordem}: ` : ''}{item.materia_titulo}
                    </span>
                    {item.resultado && (
                      <span className="badge bg-primary text-white">{item.resultado}</span>
                    )}
                  </div>
                  {item.materia_ementa && (
                    <p className="small text-muted mb-2">{item.materia_ementa}</p>
                  )}
                  {item.materia_id && (
                    <Link
                      href={`/materias/${item.materia_id}`}
                      className="btn btn-sm btn-link text-primary text-decoration-none p-0 d-inline-flex align-items-center gap-1"
                    >
                      <span>Ver matéria legislativa</span> &rarr;
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Presenças */}
      {sessao.presencas && sessao.presencas.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
              <Users size={18} className="text-primary" /> Registro de Presença dos Parlamentares
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-2">
              {sessao.presencas.map((p, idx) => (
                <div key={idx} className="col-md-6 col-lg-4">
                  <div className="p-2 border rounded-2 d-flex justify-content-between align-items-center bg-light">
                    <div>
                      <span className="fw-semibold text-dark small d-block">{p.nome}</span>
                      {p.partido && <small className="text-muted">{p.partido}</small>}
                    </div>
                    <span className={`badge ${p.presenca ? 'bg-success' : 'bg-secondary'}`}>
                      {p.presenca ? 'Presente' : 'Ausente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
