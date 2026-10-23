'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Award,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  FileText,
  Code,
  Share2,
  Check,
  RefreshCw,
  AlertCircle,
  Building,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { copyToClipboard } from '@/lib/urlUtils';
import ApiIntegrationModal from '@/components/ApiIntegrationModal';

export default function ParlamentarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [parlamentar, setParlamentar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await api.getParlamentarById(id);
        setParlamentar(data);
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar os dados do parlamentar.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const ok = await copyToClipboard(url);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="card p-5 border-0 shadow-sm max-w-lg mx-auto">
          <RefreshCw size={36} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <p className="text-muted mb-0">Carregando perfil do parlamentar...</p>
        </div>
      </div>
    );
  }

  if (error || !parlamentar) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-warning flex-shrink-0" />
          <div>
            <h5 className="alert-heading mb-1">Parlamentar não encontrado</h5>
            <p className="mb-2 text-muted small">{error || 'O registro solicitado não está disponível.'}</p>
            <Link href="/parlamentares" className="btn btn-sm btn-outline-primary">
              &larr; Voltar para lista de parlamentares
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nomeExibicao = parlamentar.nome_parlamentar || parlamentar.nome_completo || parlamentar.__str__ || 'Vereador';
  const cleanApiPath = `/api/parlamentares/parlamentar/${id}/`;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link href="/" className="text-decoration-none">Início</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/parlamentares" className="text-decoration-none">Vereadores</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {nomeExibicao}
          </li>
        </ol>
      </nav>

      <button
        onClick={() => router.back()}
        className="btn btn-sm btn-link text-decoration-none text-muted p-0 mb-3 d-flex align-items-center gap-1"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      {/* Main Card */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        <div className="bg-primary text-white p-4 p-md-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              <div
                className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow"
                style={{ width: 84, height: 84, fontSize: '2rem', fontWeight: 'bold' }}
              >
                {nomeExibicao.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="badge bg-white bg-opacity-25 text-white mb-2 fs-7 px-2.5 py-1">
                  {parlamentar.ativo ? 'Vereador em Exercício' : 'Mandato Anterior'}
                </span>
                <h1 className="h2 fw-bold mb-1">{nomeExibicao}</h1>
                {parlamentar.nome_completo && parlamentar.nome_completo !== nomeExibicao && (
                  <p className="text-white-50 mb-0 small">Nome civil: {parlamentar.nome_completo}</p>
                )}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="btn btn-light btn-sm d-flex align-items-center gap-1.5 shadow-sm"
              >
                {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
                <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApiModal(true)}
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-1.5"
              >
                <Code size={14} />
                <span>API REST</span>
              </button>
            </div>
          </div>
        </div>

        <div className="card-body p-4">
          <div className="row g-4">
            {/* Informações de Contato e Gabinete */}
            <div className="col-lg-4">
              <div className="bg-light p-3.5 rounded-3 border">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Building size={16} className="text-primary" /> Informações do Mandato
                </h6>
                <dl className="row mb-0 small">
                  <dt className="col-5 text-muted">Partido:</dt>
                  <dd className="col-7 fw-semibold">{parlamentar.partido || 'Não informado'}</dd>

                  <dt className="col-5 text-muted">Telefone:</dt>
                  <dd className="col-7">{parlamentar.telefone || '(63) 3466-1884'}</dd>

                  <dt className="col-5 text-muted">Gabinete:</dt>
                  <dd className="col-7">{parlamentar.numero_gab_parlamentar || 'Gabinete Parlamentar'}</dd>

                  <dt className="col-5 text-muted">Município:</dt>
                  <dd className="col-7">Pedro Afonso - TO</dd>

                  <dt className="col-5 text-muted">ID Sistema:</dt>
                  <dd className="col-7 font-monospace">#{parlamentar.id}</dd>
                </dl>

                <div className="mt-3 pt-3 border-top">
                  <Link
                    href={`/materias?busca=${encodeURIComponent(nomeExibicao)}`}
                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <FileText size={15} /> Ver Matérias Apresentadas
                  </Link>
                </div>
              </div>
            </div>

            {/* Biografia e Atuação */}
            <div className="col-lg-8">
              <h5 className="fw-bold text-dark mb-3">Biografia & Trajetória</h5>
              {parlamentar.biografia ? (
                <div
                  className="prose text-secondary lh-base"
                  dangerouslySetInnerHTML={{ __html: parlamentar.biografia }}
                />
              ) : (
                <p className="text-muted small fst-italic">
                  Biografia parlamentar não cadastrada no sistema oficial do SAPL.
                </p>
              )}

              {/* Ações Rápidas */}
              <div className="mt-4 pt-4 border-top d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <div className="small text-muted">
                  Fonte: Portal de Dados Abertos da Câmara Municipal de Pedro Afonso
                </div>

                <button
                  type="button"
                  onClick={() => setShowApiModal(true)}
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1.5"
                >
                  <Code size={14} /> <span>Integrar via API: <code>{cleanApiPath}</code></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Integração API */}
      <ApiIntegrationModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={`Vereador: ${nomeExibicao}`}
        cleanPath={cleanApiPath}
        category="Parlamentares"
        defaultData={parlamentar}
      />
    </div>
  );
}
