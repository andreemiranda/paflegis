'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  User,
  Eye,
  Share2,
  Check,
  ArrowLeft,
  Download,
  Clock,
  Layers,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Code,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { MateriaLegislativa } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';
import ApiIntegrationModal from '@/components/ApiIntegrationModal';
import AdSenseBanner from '@/components/AdSenseBanner';

export default function MateriaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [materia, setMateria] = useState<MateriaLegislativa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadMateria() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getMateriaById(id);
        setMateria(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes da matéria.');
      } finally {
        setLoading(false);
      }
    }
    loadMateria();
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
        <RefreshCw size={32} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
        <p>Carregando dados da matéria legislativa...</p>
      </div>
    );
  }

  if (error || !materia) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning border-0 shadow-sm p-4 text-center">
          <AlertCircle size={32} className="text-warning mx-auto mb-2" />
          <h5>Matéria Não Encontrada</h5>
          <p className="text-muted small mb-3">{error || 'Não foi possível localizar esta matéria legislativa.'}</p>
          <Link href="/materias" className="btn btn-primary">
            Voltar para Matérias
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
            <li className="breadcrumb-item"><Link href="/materias" className="text-decoration-none">Matérias</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{materia.tipo} {materia.numero}/{materia.ano}</li>
          </ol>
        </nav>
        <button onClick={() => router.back()} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      <AdSenseBanner slotType="article_top" />

      {/* Main Detail Card */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="badge bg-primary text-white fs-6 px-3 py-2">
                {materia.tipo} Nº {materia.numero}/{materia.ano}
              </span>
              <span className="badge bg-secondary bg-opacity-10 text-secondary border px-3 py-2">
                {materia.situacao || 'Em Tramitação'}
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
            {materia.ementa || 'Sem ementa cadastrada.'}
          </h1>

          {/* Info grid */}
          <div className="row g-3 bg-light p-3 rounded-3 mb-4">
            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Autor / Proponente</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <User size={16} className="text-primary" /> {materia.autor || 'Não informado'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Data de Apresentação</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Calendar size={16} className="text-primary" /> {materia.data_apresentacao || 'Não informada'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Situação Atual</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Clock size={16} className="text-primary" /> {materia.situacao || 'Em Tramitação'}
              </span>
            </div>
          </div>

          {/* Document Access Buttons */}
          <div className="d-flex flex-wrap gap-2 mb-2">
            {materia.texto_original_url && (
              <button
                onClick={() => setPreviewDoc({ url: materia.texto_original_url!, title: `${materia.tipo} ${materia.numero}/${materia.ano}` })}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                <Eye size={16} /> Visualizar Texto Original
              </button>
            )}

            {materia.texto_original_url && (
              <a
                href={materia.texto_original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-primary d-flex align-items-center gap-2"
              >
                <ExternalLink size={16} /> Abrir em Nova Guia
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className="btn btn-outline-secondary d-flex align-items-center gap-1.5"
            >
              <Code size={15} /> <span>API de Integração</span>
            </button>
          </div>

          <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center small text-muted">
            <span>Fonte de dados: SAPL Oficial</span>
            <a
              href={`https://sapl.pedroafonso.to.leg.br/materia/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary text-decoration-none d-flex align-items-center gap-1"
            >
              <span>Ver no portal oficial do SAPL</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Tramitações */}
      {materia.tramitacoes && materia.tramitacoes.length > 0 && (
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
              <Layers size={18} className="text-primary" /> Histórico de Tramitações ({materia.tramitacoes.length})
            </h5>
          </div>
          <div className="card-body p-4">
            <div className="timeline d-flex flex-column gap-3">
              {materia.tramitacoes.map((t, idx) => (
                <div key={idx} className="p-3 bg-light rounded-3 border-start border-primary border-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-bold text-dark">{t.status || 'Andamento'}</span>
                    <span className="badge bg-secondary text-white">{t.data}</span>
                  </div>
                  {t.unidade_origem && (
                    <small className="text-muted d-block">
                      <strong>De:</strong> {t.unidade_origem} {t.unidade_destino ? `➔ ${t.unidade_destino}` : ''}
                    </small>
                  )}
                  {t.texto && <p className="small text-dark mt-2 mb-0">{t.texto}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documentos Acessórios */}
      {materia.documentos_acessorios && materia.documentos_acessorios.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
              <FileText size={18} className="text-primary" /> Documentos Acessórios
            </h5>
          </div>
          <div className="card-body p-4">
            <ul className="list-group list-group-flush">
              {materia.documentos_acessorios.map((doc) => (
                <li key={doc.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-dark fw-medium">{doc.nome}</span>
                  {doc.url && (
                    <button
                      onClick={() => setPreviewDoc({ url: doc.url, title: doc.nome })}
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                    >
                      <Eye size={14} /> Visualizar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AdSense Article Bottom */}
      <AdSenseBanner slotType="article_bottom" />

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          title={previewDoc.title}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Modal de Integração API */}
      <ApiIntegrationModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={`${materia?.tipo || 'Matéria'} ${materia?.numero}/${materia?.ano}`}
        cleanPath={`/api/v1/materias/${id}`}
        category="Matéria Legislativa"
        defaultData={materia}
      />
    </div>
  );
}
