import React, { useState } from 'react';
import {
  Calendar,
  User,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Paperclip,
} from 'lucide-react';
import { MateriaLegislativa } from '../types';
import { copyToClipboard, shareUrl } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';
import { DocumentCard } from './DocumentCard';

interface MateriaCardProps {
  materia: MateriaLegislativa;
  onSelect?: (materia: MateriaLegislativa) => void;
}

export const MateriaCard: React.FC<MateriaCardProps> = ({ materia, onSelect }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mainDocUrl = materia.texto_original_url || '';

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mainDocUrl) {
      const ok = await copyToClipboard(mainDocUrl);
      if (ok) {
        setCopied(true);
        setToastMsg('Link do texto original copiado!');
        setTimeout(() => setCopied(false), 2500);
        setTimeout(() => setToastMsg(null), 2500);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow transition-all space-y-3 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-2 right-4 z-20 bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 animate-fade-in border border-slate-700">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Badge Header & Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded">
            {materia.tipo}
          </span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
            Nº {materia.numero}/{materia.ano}
          </span>
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            materia.situacao.includes('Aprovad') || materia.situacao.includes('Deferid')
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {materia.situacao}
        </span>
      </div>

      {/* Ementa */}
      <div onClick={() => onSelect && onSelect(materia)} className="cursor-pointer">
        <p className="text-xs sm:text-sm text-slate-700 font-normal leading-relaxed hover:text-slate-950 transition-colors">
          {materia.ementa}
        </p>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-700">{materia.autor}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formatDateBR(materia.data_apresentacao)}</span>
        </div>
      </div>

      {/* Main Document Quick Action Buttons */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:flex sm:items-center gap-2">
        {/* Botão 1: Ver Original */}
        {mainDocUrl ? (
          <a
            href={mainDocUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-md transition-colors shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Original</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400 italic">Sem texto original anexado</span>
        )}

        {/* Botão 2: Copiar Link */}
        {mainDocUrl && (
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs px-3.5 py-1.5 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
          </button>
        )}

        {/* Toggle Documents Button */}
        {materia.documentos_acessorios && materia.documentos_acessorios.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="col-span-2 sm:col-span-1 sm:ml-auto flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>{materia.documentos_acessorios.length} Anexo(s)</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Collapsible Accessory Documents Section */}
      {expanded && materia.documentos_acessorios && materia.documentos_acessorios.length > 0 && (
        <div className="pt-3 border-t border-slate-200 space-y-2 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl animate-fade-in">
          <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
            <span>Documentos Acessórios e Anexos:</span>
          </p>
          <div className="space-y-2">
            {materia.documentos_acessorios.map(doc => (
              <DocumentCard key={doc.id} documento={doc} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

