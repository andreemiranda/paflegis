'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Award,
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Code,
  Share2,
  Check,
  RefreshCw,
  AlertCircle,
  Building,
  Briefcase,
  Globe,
  MapPin,
  User,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { copyToClipboard, normalizePhotoUrl } from '@/lib/urlUtils';
import ApiIntegrationModal from '@/components/ApiIntegrationModal';
import { ApiParlamentar } from '@/lib/sapl/parlamentaresData';

export default function ParlamentarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [parlamentar, setParlamentar] = useState<ApiParlamentar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const data = await api.getParlamentarById(id);
      setParlamentar(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados oficiais do parlamentar.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
          <p className="text-muted mb-0">Carregando perfil e biografia oficial do parlamentar via API...</p>
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
            <h5 className="alert-heading mb-1">Parlamentar não encontrado na API</h5>
            <p className="mb-2 text-muted small">{error || 'O registro oficial solicitado não está disponível no SAPL.'}</p>
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
  const photoSrc = normalizePhotoUrl(parlamentar.fotografia);

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

      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          onClick={() => router.back()}
          className="btn btn-sm btn-link text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
        >
          <ArrowLeft size={16} /> Voltar à lista
        </button>

        <button
          type="button"
          onClick={loadData}
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5"
          title="Recarregar dados oficiais da API"
        >
          <RefreshCw size={13} />
          <span>Atualizar da API</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="card border-0 shadow-sm mb-4 overflow-hidden">
        {/* Banner de Topo com Foto e Identificação */}
        <div className="bg-primary text-white p-4 p-md-5">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-4">
            <div className="d-flex align-items-center gap-4 flex-wrap">
              {/* Foto Otimizada com Next/Image */}
              <div
                className="position-relative rounded-circle overflow-hidden border border-3 border-white shadow-lg bg-dark flex-shrink-0"
                style={{ width: 110, height: 110 }}
              >
                {photoSrc ? (
                  <Image
                    src={photoSrc}
                    alt={nomeExibicao}
                    fill
                    sizes="110px"
                    className="object-fit-cover"
                    referrerPolicy="no-referrer"
                    priority
                  />
                ) : (
                  <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-10 text-white">
                    <User size={48} className="opacity-50" />
                  </div>
                )}
              </div>

              <div>
                <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                  <span className={`badge ${parlamentar.ativo ? 'bg-success' : 'bg-secondary'} text-white fs-7 px-2.5 py-1`}>
                    {parlamentar.ativo ? 'Vereador em Exercício' : 'Mandato Registrado'}
                  </span>
                  <span className="badge bg-white bg-opacity-25 text-white fs-7 px-2.5 py-1">
                    Câmara Municipal &bull; ID #{parlamentar.id}
                  </span>
                </div>

                <h1 className="h2 fw-bold mb-1 text-white">{nomeExibicao}</h1>
                {parlamentar.nome_completo && parlamentar.nome_completo !== nomeExibicao && (
                  <p className="text-white-50 mb-0 small">
                    Nome civil: <strong>{parlamentar.nome_completo}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="btn btn-light btn-sm d-flex align-items-center gap-1.5 shadow-sm text-nowrap"
              >
                {copied ? <Check size={14} className="text-success" /> : <Share2 size={14} />}
                <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowApiModal(true)}
                className="btn btn-outline-light btn-sm d-flex align-items-center gap-1.5 text-nowrap"
              >
                <Code size={14} />
                <span>API REST</span>
              </button>
            </div>
          </div>
        </div>

        {/* Corpo com Informações e Biografia Oficial */}
        <div className="card-body p-4 p-md-5">
          <div className="row g-4">
            {/* Informações Oficiais do Mandato e Gabinete */}
            <div className="col-lg-4">
              <div className="bg-light p-4 rounded-3 border">
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Building size={16} className="text-primary" /> Informações do Mandato (API)
                </h6>
                <dl className="row mb-0 small">
                  <dt className="col-5 text-muted">ID Sistema:</dt>
                  <dd className="col-7 font-monospace">#{parlamentar.id}</dd>

                  {parlamentar.profissao && (
                    <>
                      <dt className="col-5 text-muted">Profissão:</dt>
                      <dd className="col-7">{parlamentar.profissao}</dd>
                    </>
                  )}

                  {parlamentar.telefone && (
                    <>
                      <dt className="col-5 text-muted">Telefone:</dt>
                      <dd className="col-7">{parlamentar.telefone}</dd>
                    </>
                  )}

                  {parlamentar.email && (
                    <>
                      <dt className="col-5 text-muted">E-mail:</dt>
                      <dd className="col-7 text-break">{parlamentar.email}</dd>
                    </>
                  )}

                  {parlamentar.numero_gab_parlamentar && (
                    <>
                      <dt className="col-5 text-muted">Gabinete:</dt>
                      <dd className="col-7">{parlamentar.numero_gab_parlamentar}</dd>
                    </>
                  )}

                  {parlamentar.locais_atuacao && (
                    <>
                      <dt className="col-5 text-muted">Atuação:</dt>
                      <dd className="col-7">{parlamentar.locais_atuacao}</dd>
                    </>
                  )}

                  {parlamentar.endereco_web && (
                    <>
                      <dt className="col-5 text-muted">Site/Rede:</dt>
                      <dd className="col-7 text-break">
                        <a href={parlamentar.endereco_web} target="_blank" rel="noopener noreferrer" className="text-primary">
                          {parlamentar.endereco_web}
                        </a>
                      </dd>
                    </>
                  )}

                  <dt className="col-5 text-muted">Fonte:</dt>
                  <dd className="col-7">Sistema SAPL Oficial</dd>
                </dl>

                <div className="mt-4 pt-3 border-top">
                  <Link
                    href={`/materias?busca=${encodeURIComponent(nomeExibicao)}`}
                    className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  >
                    <FileText size={15} /> Ver Matérias Apresentadas
                  </Link>
                </div>
              </div>
            </div>

            {/* Biografia Oficial da API (Sem Dados Fictícios) */}
            <div className="col-lg-8">
              <div className="mb-4">
                <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <Award className="text-primary" size={22} /> Biografia Oficial Registrada na API
                </h4>
                {parlamentar.biografia ? (
                  <div
                    className="prose text-secondary lh-lg fs-6"
                    dangerouslySetInnerHTML={{ __html: parlamentar.biografia }}
                  />
                ) : (
                  <div className="alert alert-light border p-4 text-muted small">
                    <p className="mb-0">
                      Nenhum texto biográfico foi registrado para este parlamentar no cadastro oficial do SAPL. Os dados apresentados refletem com precisão as informações fornecidas pela Casa Legislativa.
                    </p>
                  </div>
                )}
              </div>

              {/* Informação do Portal e Transparência */}
              <div className="mt-4 pt-3 border-top text-muted small d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="d-flex align-items-center gap-1.5">
                  <ShieldCheck size={16} className="text-success" />
                  <span>Conteúdo oficial sincronizado em tempo real da API pública</span>
                </span>
                <Link href="/parlamentares" className="text-primary text-decoration-none fw-semibold">
                  &larr; Ver todos os vereadores
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Integração API */}
      <ApiIntegrationModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        title={`Vereador Oficial: ${nomeExibicao}`}
        cleanPath={cleanApiPath}
        category="Parlamentares"
        defaultData={parlamentar}
      />
    </div>
  );
}
