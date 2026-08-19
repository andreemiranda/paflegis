'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, Calendar, User, Eye, Share2, Download, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { MateriaLegislativa } from '@/types';
import { copyToClipboard } from '@/lib/urlUtils';

interface Props {
  materia: MateriaLegislativa;
  onPreview?: (url: string, title: string) => void;
}

export default function MateriaCard({ materia, onPreview }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/materias/${materia.id}` : '';
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const situacaoBadgeClass =
    materia.situacao?.toLowerCase().includes('aprovad') || materia.situacao?.toLowerCase().includes('promulgado')
      ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25'
      : materia.situacao?.toLowerCase().includes('rejeit') || materia.situacao?.toLowerCase().includes('arquiv')
      ? 'bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25'
      : 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25';

  return (
    <div className="card border-0 shadow-sm card-hover mb-3">
      <div className="card-body p-4">
        {/* Header Badges */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 fw-semibold px-2 py-1">
              {materia.tipo}
            </span>
            <span className="badge bg-dark bg-opacity-10 text-dark fw-bold px-2 py-1">
              Nº {materia.numero}/{materia.ano}
            </span>
          </div>

          <span className={`badge ${situacaoBadgeClass} px-2 py-1`}>
            {materia.situacao || 'Em Tramitação'}
          </span>
        </div>

        {/* Ementa */}
        <h5 className="fs-6 fw-bold text-dark mt-2 mb-3 lh-base">
          <Link href={`/materias/${materia.id}`} className="text-dark text-decoration-none hover-primary">
            {materia.ementa || 'Sem ementa cadastrada.'}
          </Link>
        </h5>

        {/* Metadata */}
        <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3">
          <div className="d-flex align-items-center gap-1">
            <User size={14} className="text-primary" />
            <span><strong>Autor:</strong> {materia.autor || 'Não informado'}</span>
          </div>

          {materia.data_apresentacao && (
            <div className="d-flex align-items-center gap-1">
              <Calendar size={14} className="text-primary" />
              <span><strong>Apresentação:</strong> {materia.data_apresentacao}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
          <div className="d-flex flex-wrap gap-2">
            {materia.texto_original_url && (
              <button
                type="button"
                onClick={() =>
                  onPreview
                    ? onPreview(materia.texto_original_url!, `${materia.tipo} ${materia.numero}/${materia.ano}`)
                    : window.open(materia.texto_original_url!, '_blank')
                }
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              >
                <Eye size={14} />
                <span>Visualizar Texto</span>
              </button>
            )}

            <Link
              href={`/materias/${materia.id}`}
              className="btn btn-sm btn-light text-primary border d-inline-flex align-items-center gap-1"
            >
              <FileText size={14} />
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
