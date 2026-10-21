'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Video, Calendar, Clock, FileText, Eye, Share2, Check, ExternalLink } from 'lucide-react';
import { SessaoPlenaria } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';

interface Props {
  sessao: SessaoPlenaria;
  onPreview?: (url: string, title: string) => void;
  onWatchVideo?: (url: string, title: string) => void;
}

export default function SessaoCard({ sessao, onPreview, onWatchVideo }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/sessoes/${sessao.id}` : '';
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="card border-0 shadow-sm card-hover mb-3">
      <div className="card-body p-4">
        {/* Header Badges */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 fw-semibold px-2 py-1">
              {sessao.tipo}
            </span>
            <span className="badge bg-dark bg-opacity-10 text-dark fw-bold px-2 py-1">
              Nº {sessao.numero}/{sessao.ano}
            </span>
          </div>

          <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 px-2 py-1">
            {sessao.situacao || 'Realizada'}
          </span>
        </div>

        {/* Title */}
        <h5 className="fs-6 fw-bold text-dark mt-2 mb-3 lh-base">
          <Link href={`/sessoes/${sessao.id}`} className="text-dark text-decoration-none hover-primary">
            {sessao.tipo} Nº {sessao.numero}/{sessao.ano} - Câmara de Pedro Afonso
          </Link>
        </h5>

        {/* Metadata */}
        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
          <div className="d-flex align-items-center gap-1">
            <Calendar size={14} className="text-primary" />
            <span><strong>Data:</strong> {sessao.data}</span>
          </div>

          {sessao.horario && (
            <div className="d-flex align-items-center gap-1">
              <Clock size={14} className="text-primary" />
              <span><strong>Horário:</strong> {sessao.horario}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
          <div className="d-flex flex-wrap gap-2">
            {sessao.youtube_url && (
              <button
                type="button"
                onClick={() =>
                  onWatchVideo
                    ? onWatchVideo(sessao.youtube_url!, `${sessao.tipo} Nº ${sessao.numero}/${sessao.ano}`)
                    : window.open(sessao.youtube_url!, '_blank')
                }
                className="btn btn-sm btn-danger d-inline-flex align-items-center gap-1"
              >
                <Video size={14} />
                <span>Vídeo da Sessão</span>
              </button>
            )}

            {sessao.pauta_url && (
              <button
                type="button"
                onClick={() =>
                  onPreview
                    ? onPreview(sessao.pauta_url!, `Pauta - ${sessao.tipo} Nº ${sessao.numero}/${sessao.ano}`)
                    : window.open(sessao.pauta_url!, '_blank')
                }
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              >
                <Eye size={14} />
                <span>Pauta</span>
              </button>
            )}

            {sessao.ata_url && (
              <button
                type="button"
                onClick={() =>
                  onPreview
                    ? onPreview(sessao.ata_url!, `Ata - ${sessao.tipo} Nº ${sessao.numero}/${sessao.ano}`)
                    : window.open(sessao.ata_url!, '_blank')
                }
                className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              >
                <FileText size={14} />
                <span>Ata</span>
              </button>
            )}

            <Link
              href={`/sessoes/${sessao.id}`}
              className="btn btn-sm btn-light text-primary border d-inline-flex align-items-center gap-1"
            >
              <span>Detalhes</span>
            </Link>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'} d-inline-flex align-items-center gap-1`}
              title="Copiar link"
            >
              {copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{copied ? 'Copiado!' : 'Compartilhar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
