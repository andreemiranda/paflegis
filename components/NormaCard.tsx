'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Calendar, Eye, Share2, Check, Tag } from 'lucide-react';
import { NormaJuridica } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';

interface Props {
  norma: NormaJuridica;
  onPreview?: (url: string, title: string) => void;
}

export default function NormaCard({ norma, onPreview }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/normas/${norma.id}` : '';
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
            <span className="badge bg-teal bg-opacity-10 text-success border border-success border-opacity-25 fw-semibold px-2 py-1">
              {norma.tipo}
            </span>
            <span className="badge bg-dark bg-opacity-10 text-dark fw-bold px-2 py-1">
              Nº {norma.numero}/{norma.ano}
            </span>
          </div>

          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
            {norma.situacao || 'Vigente'}
          </span>
        </div>

        {/* Ementa */}
        <h5 className="fs-6 fw-bold text-dark mt-2 mb-3 lh-base">
          <Link href={`/normas/${norma.id}`} className="text-dark text-decoration-none hover-primary">
            {norma.ementa || 'Sem ementa cadastrada.'}
          </Link>
        </h5>

        {/* Metadata */}
        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
          {norma.data_publicacao && (
            <div className="d-flex align-items-center gap-1">
              <Calendar size={14} className="text-success" />
              <span><strong>Publicação:</strong> {norma.data_publicacao}</span>
            </div>
          )}

          {norma.assunto && (
            <div className="d-flex align-items-center gap-1">
              <Tag size={14} className="text-secondary" />
              <span><strong>Assunto:</strong> {norma.assunto}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
          <div className="d-flex flex-wrap gap-2">
            {norma.texto_integral_url && (
              <button
                type="button"
                onClick={() =>
                  onPreview
                    ? onPreview(norma.texto_integral_url!, `${norma.tipo} ${norma.numero}/${norma.ano}`)
                    : window.open(norma.texto_integral_url!, '_blank')
                }
                className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
              >
                <Eye size={14} />
                <span>Texto Integral</span>
              </button>
            )}

            <Link
              href={`/normas/${norma.id}`}
              className="btn btn-sm btn-light text-success border d-inline-flex align-items-center gap-1"
            >
              <BookOpen size={14} />
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
