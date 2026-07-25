import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Youtube,
} from 'lucide-react';
import { SessaoPlenaria } from '../types';
import { copyToClipboard } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';
import { DocumentCard } from './DocumentCard';

interface SessaoCardProps {
  sessao: SessaoPlenaria;
  onSelect?: (sessao: SessaoPlenaria) => void;
  onOpenYouTube?: (sessao: SessaoPlenaria) => void;
}

export const SessaoCard: React.FC<SessaoCardProps> = ({ sessao, onSelect, onOpenYouTube }) => {
  const [copiedPauta, setCopiedPauta] = useState(false);
  const [copiedAta, setCopiedAta] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleCopyPauta = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessao.pauta_url) {
      const ok = await copyToClipboard(sessao.pauta_url);
      if (ok) {
        setCopiedPauta(true);
        setToastMsg('Link da Pauta copiado!');
        setTimeout(() => setCopiedPauta(false), 2500);
        setTimeout(() => setToastMsg(null), 2500);
      }
    }
  };

  const handleCopyAta = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessao.ata_url) {
      const ok = await copyToClipboard(sessao.ata_url);
      if (ok) {
        setCopiedAta(true);
        setToastMsg('Link da Ata copiado!');
        setTimeout(() => setCopiedAta(false), 2500);
        setTimeout(() => setToastMsg(null), 2500);
      }
    }
  };

  const videoUrl =
    sessao.youtube_url?.trim() ||
    sessao.anexos?.find(a => a.url && (a.url.includes('youtube') || a.url.includes('youtu.be') || a.url.includes('facebook') || (a.tipo && a.tipo.toLowerCase().includes('vídeo'))))?.url?.trim();

  const hasVideo = Boolean(videoUrl && videoUrl.length > 0);
  const hasPauta = Boolean(sessao.pauta_url && sessao.pauta_url.trim().length > 0);
  const hasAta = Boolean(sessao.ata_url && sessao.ata_url.trim().length > 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow transition-all space-y-3 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-2 right-4 z-20 bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 animate-fade-in border border-slate-700">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded">
            {sessao.tipo}
          </span>
          <span className="font-bold text-slate-900 text-xs sm:text-sm font-mono">
            Nº {sessao.numero}/{sessao.ano}
          </span>
        </div>

        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            sessao.situacao === 'Realizada'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}
        >
          {sessao.situacao}
        </span>
      </div>

      {/* Date & Time */}
      <div onClick={() => onSelect && onSelect(sessao)} className="cursor-pointer space-y-1">
        <h3 className="font-bold text-slate-900 text-xs sm:text-sm hover:text-blue-600 transition-colors">
          {sessao.tipo} nº {sessao.numero}/{sessao.ano}
        </h3>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Data: {formatDateBR(sessao.data)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Horário: {sessao.horario}</span>
          </div>
        </div>
      </div>

      {/* YouTube Video Recording Action & Document Action Cards */}
      <div className="space-y-2 pt-1">
        {/* Renderiza botão de assistir vídeo apenas se houver URL de vídeo válida */}
        {hasVideo && (
          <button
            onClick={() => onOpenYouTube && onOpenYouTube(sessao)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs p-2 rounded-md flex items-center justify-between gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Youtube className="w-4 h-4 fill-white text-red-600 shrink-0" />
              <span>Assistir Transmissão da Sessão</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-red-200 shrink-0" />
          </button>
        )}

        {(hasPauta || hasAta) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Pauta */}
            {hasPauta && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate">Pauta da Sessão</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={sessao.pauta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded transition-colors"
                    title="Ver Pauta da Sessão"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleCopyPauta}
                    className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 p-1 rounded transition-colors"
                    title="Copiar Link da Pauta"
                  >
                    {copiedPauta ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}

            {/* Ata */}
            {hasAta && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate">Ata da Sessão</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={sessao.ata_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-500 text-white p-1 rounded transition-colors"
                    title="Ver Ata da Sessão"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleCopyAta}
                    className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 p-1 rounded transition-colors"
                    title="Copiar Link da Ata"
                  >
                    {copiedAta ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!hasVideo && !hasPauta && !hasAta && (
          <div className="text-[11px] text-slate-400 italic py-0.5">
            Sem vídeo ou documentos (pauta/ata) cadastrados para esta sessão na API.
          </div>
        )}
      </div>

      {/* Details Toggle Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>{sessao.presencas ? `${sessao.presencas.filter(p => p.presenca).length} Vereadores Presentes` : 'Registro de Presença'}</span>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>{expanded ? 'Ocultar Detalhes' : 'Ver Pauta e Votações'}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Content (Presenças, Ordem do Dia, Anexos) */}
      {expanded && (
        <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl animate-fade-in">
          {/* Presença */}
          {sessao.presencas && sessao.presencas.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Presença da Sessão:</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {sessao.presencas.map((v, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      v.presenca
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200 line-through'
                    }`}
                  >
                    {v.nome} {v.cargo ? `(${v.cargo})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ordem do Dia */}
          {sessao.ordem_dia && sessao.ordem_dia.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-800">Ordem do Dia / Deliberações:</h4>
              <div className="space-y-1.5">
                {sessao.ordem_dia.map(item => (
                  <div key={item.id} className="bg-white p-2.5 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Item {item.ordem}: {item.materia_titulo}</span>
                      {item.resultado && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-bold">
                          {item.resultado}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">{item.materia_ementa}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Anexos */}
          {sessao.anexos && sessao.anexos.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <h4 className="text-xs font-bold text-slate-800">Documentos e Gravações Anexas:</h4>
              <div className="space-y-2">
                {sessao.anexos.map(doc => (
                  <DocumentCard key={doc.id} documento={doc} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

