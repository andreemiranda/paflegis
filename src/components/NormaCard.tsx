import React, { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Tag,
} from 'lucide-react';
import { NormaJuridica } from '../types';
import { copyToClipboard } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';
import { DocumentCard } from './DocumentCard';

interface NormaCardProps {
  norma: NormaJuridica;
  onSelect?: (norma: NormaJuridica) => void;
}

export const NormaCard: React.FC<NormaCardProps> = ({ norma, onSelect }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mainDocUrl = norma.texto_integral_url || '';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mainDocUrl) {
      const ok = await copyToClipboard(mainDocUrl);
      if (ok) {
        setCopied(true);
        setToastMsg('Link do texto integral copiado!');
        setTimeout(() => setCopied(false), 2500);
        setTimeout(() => setToastMsg(null), 2500);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow transition-all space-y-3 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-2 right-2 z-20 max-w-[calc(100%-1rem)] bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 animate-fade-in border border-slate-700">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMsg}</span>
        </div>
      )}

      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-md">
            {norma.tipo}
          </span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
            Nº {norma.numero}/{norma.ano}
          </span>
        </div>

        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          {norma.situacao}
        </span>
      </div>

      {/* Ementa */}
      <div onClick={() => onSelect && onSelect(norma)} className="cursor-pointer">
        <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed hover:text-slate-950 transition-colors">
          {norma.ementa}
        </p>
      </div>

      {/* Subject & Date Row */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-500 pt-1">
        {norma.assunto && (
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Tag className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{norma.assunto}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Publicada em: {formatDateBR(norma.data_publicacao)}</span>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:flex sm:items-center gap-2">
        {/* Botão 1: Ver Documento */}
        {mainDocUrl ? (
          <a
            href={mainDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer min-h-[40px]"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Ver Documento</span>
          </a>
        ) : (
          <span className="text-xs sm:text-sm text-slate-400 italic">Texto integral indisponível</span>
        )}

        {/* Botão 2: Copiar Link */}
        {mainDocUrl && (
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>
        )}

        {/* Toggle Annexes Button */}
        {norma.anexos && norma.anexos.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            <Paperclip className="w-4 h-4 text-blue-600" />
            <span>{norma.anexos.length} Anexo(s)</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Collapsible Annexes */}
      {expanded && norma.anexos && norma.anexos.length > 0 && (
        <div className="pt-3 border-t border-slate-200 space-y-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl animate-fade-in">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
            <span>Anexos da Norma Jurídica:</span>
          </p>
          <div className="space-y-2">
            {norma.anexos.map(doc => (
              <DocumentCard key={doc.id} documento={doc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

