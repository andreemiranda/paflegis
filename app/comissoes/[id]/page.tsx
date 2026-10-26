'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Layers,
  Calendar,
  Users,
  Code,
  Share2,
  Check,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  FolderKanban,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { copyToClipboard } from '@/lib/urlUtils';
import ApiIntegrationModal from '@/components/ApiIntegrationModal';

export default function ComissaoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [comissao, setComissao] = useState<any>(null);
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
        const data = await api.getComissaoById(id);
        setComissao(data);
      } catch (err: any) {
        setError(err.message || 'Não foi possível carregar os dados da comissão.');
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
          <p className="text-muted mb-0">Carregando detalhes da comissão...</p>
        </div>
      </div>
    );
  }

  if (error || !comissao) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3">
          <AlertCircle size={28} className="text-warning flex-shrink-0" />
          <div>
            <h5 className="alert-heading mb-1">Comissão não encontrada</h5>
            <p className="mb-2 text-muted small">{error || 'O registro solicitado não está disponível.'}</p>
            <Link href="/comissoes" className="btn btn-sm btn-outline-primary">
              &larr; Voltar para lista de comissões
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const nomeComissao = comissao.nome || comissao.__str__ || 'Comissão Parlamentar';
  const cleanApiPath = `/api/comissoes/comissao/${id}/`;

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link href="/" className="text-decoration-none">Início</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/comissoes" className="text-decoration-none">Comissões</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {comissao.sigla || 'Detalhe'}
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
        <div className="bg-dark text-white p-4 p-md-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                {comissao.sigla && (
                  <span className="badge bg-primary fs-6 px-2.5 py-1">
                    {comissao.sigla}
                  </span>
                )}
                <span className="badge bg-secondary fs-7">
                  {comissao.data_extincao ? 'Extinta' : 'Comissão Ativa'}
                </span>
              </div>
              <h1 className="h2 fw-bold mb-1">{nomeComissao}</h1>
              {comissao.finalidade && (
                <p className="text-white-50 mb-0 small mt-2 max-w-2xl">{comissao.finalidade}</p>
              )}
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
            {/* Metadados da Comissão */}
            <div className="col-lg-4">
              <div className="bg-light p-3.5 rounded-3 border">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <FolderKanban size={16} className="text-primary" /> Dados Institucionais
                </h6>
                <dl className="row mb-0 small">
                  <dt className="col-5 text-muted">Sigla:</dt>
                  <dd className="col-7 fw-semibold">{comissao.sigla || 'N/A'}</dd>

                  <dt className="col-5 text-muted">Criação:</dt>
                  <dd className="col-7">{comissao.data_criacao || 'Não informada'}</dd>

                  <dt className="col-5 text-muted">Instalação:</dt>
                  <dd className="col-7">{comissao.data_instalacao_temp || comissao.data_criacao || 'Ativa'}</dd>

                  <dt className="col-5 text-muted">ID Sistema:</dt>
                  <dd className="col-7 font-monospace">#{comissao.id}</dd>
                </dl>

                <div className="mt-3 pt-3 border-top">
                  <Link
                    href={`/materias?busca=${encodeURIComponent(comissao.sigla || nomeComissao)}`}
                    className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <FileText size={15} /> Matérias em Tramitação
                  </Link>
                </div>
              </div>
            </div>

            {/* Atribuições e Composição */}
            <div className="col-lg-8">
              <h5 className="fw-bold text-dark mb-3">Atribuições & Competência</h5>
              <p className="text-secondary lh-base mb-4">
                {comissao.finalidade ||
                  'Esta comissão atua no exame, emissão de pareceres e acompanhamento legislativo de projetos, requerimentos e matérias submetidas à apreciação plenária da Câmara Municipal.'}
              </p>

              {/* Ações e Links */}
              <div className="pt-4 border-top d-flex flex-wrap gap-2 align-items-center justify-content-between">
                <span className="small text-muted">
                  Câmara Municipal de Pedro Afonso · Portal Cívico de Dados Abertos
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Integração API */}
      <ApiIntegrationModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={`Comissão: ${comissao.sigla || nomeComissao}`}
        cleanPath={cleanApiPath}
        category="Comissões Parlamentares"
        defaultData={comissao}
      />
    </div>
  );
}
