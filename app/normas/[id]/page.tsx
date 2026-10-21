'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Calendar,
  Eye,
  Share2,
  Check,
  ArrowLeft,
  Tag,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { NormaJuridica } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';

export default function NormaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [norma, setNorma] = useState<NormaJuridica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    async function loadNorma() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getNormaById(id);
        setNorma(data);
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar detalhes da norma.');
      } finally {
        setLoading(false);
      }
    }
    loadNorma();
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
        <RefreshCw size={32} className="spinner-border spinner-border-sm mx-auto mb-3 text-success" />
        <p>Carregando dados da norma jurídica...</p>
      </div>
    );
  }

  if (error || !norma) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning border-0 shadow-sm p-4 text-center">
          <AlertCircle size={32} className="text-warning mx-auto mb-2" />
          <h5>Norma Não Encontrada</h5>
          <p className="text-muted small mb-3">{error || 'Não foi possível localizar esta norma jurídica.'}</p>
          <Link href="/normas" className="btn btn-success">
            Voltar para Legislação
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
            <li className="breadcrumb-item"><Link href="/normas" className="text-decoration-none">Normas</Link></li>
            <li className="breadcrumb-item active" aria-current="page">{norma.tipo} {norma.numero}/{norma.ano}</li>
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
              <span className="badge bg-success text-white fs-6 px-3 py-2">
                {norma.tipo} Nº {norma.numero}/{norma.ano}
              </span>
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2">
                {norma.situacao || 'Vigente'}
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
            {norma.ementa || 'Sem ementa cadastrada.'}
          </h1>

          {/* Info grid */}
          <div className="row g-3 bg-light p-3 rounded-3 mb-4">
            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Data de Publicação</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Calendar size={16} className="text-success" /> {norma.data_publicacao || 'Não informada'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Assunto</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Tag size={16} className="text-success" /> {norma.assunto || 'Legislação Geral'}
              </span>
            </div>

            <div className="col-md-4">
              <span className="text-muted small fw-semibold d-block">Situação</span>
              <span className="fw-bold text-dark d-flex align-items-center gap-1 mt-1">
                <Clock size={16} className="text-success" /> {norma.situacao || 'Vigente'}
              </span>
            </div>
          </div>

          {/* Document Access Buttons */}
          <div className="d-flex flex-wrap gap-2">
            {norma.texto_integral_url && (
              <button
                onClick={() => setPreviewDoc({ url: norma.texto_integral_url!, title: `${norma.tipo} ${norma.numero}/${norma.ano}` })}
                className="btn btn-success d-flex align-items-center gap-2"
              >
                <Eye size={16} /> Visualizar Texto Integral
              </button>
            )}

            {norma.texto_integral_url && (
              <a
                href={norma.texto_integral_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-success d-flex align-items-center gap-2"
              >
                <ExternalLink size={16} /> Abrir em Nova Guia
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Anexos da Norma */}
      {norma.anexos && norma.anexos.length > 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="mb-0 fs-6 fw-bold text-dark d-flex align-items-center gap-2">
              <FileText size={18} className="text-success" /> Anexos da Norma ({norma.anexos.length})
            </h5>
          </div>
          <div className="card-body p-4">
            <ul className="list-group list-group-flush">
              {norma.anexos.map((anexo) => (
                <li key={anexo.id} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-dark fw-medium">{anexo.nome}</span>
                  {anexo.url && (
                    <button
                      onClick={() => setPreviewDoc({ url: anexo.url, title: anexo.nome })}
                      className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
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
