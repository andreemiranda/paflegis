import React, { useState } from 'react';
import { X, Youtube, ExternalLink, Calendar, FileText, Copy, Check } from 'lucide-react';
import { SessaoPlenaria } from '../types';
import { copyToClipboard } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessao?: SessaoPlenaria | null;
  videoUrl?: string;
  title?: string;
}

// Extrai o ID do vídeo do YouTube a partir de qualquer formato de URL
export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Se já for um ID de 11 caracteres
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Se contiver ?v= ou &v=
  const vParamMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vParamMatch && vParamMatch[1]) {
    return vParamMatch[1];
  }

  // Regex para paths: youtu.be/ID, embed/ID, v/ID, live/ID, shorts/ID
  const pathMatch = trimmed.match(/(?:youtu\.be\/|embed\/|v\/|live\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }

  // Caso genérico de match de 11 caracteres no segmento final da URL
  const lastSegment = trimmed.split('/').pop()?.split('?')[0]?.split('&')[0];
  if (lastSegment && /^[a-zA-Z0-9_-]{11}$/.test(lastSegment)) {
    return lastSegment;
  }

  return null;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  sessao,
  videoUrl,
  title,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const rawUrl =
    videoUrl?.trim() ||
    sessao?.youtube_url?.trim() ||
    sessao?.anexos?.find(a => a.url && (a.url.includes('youtube') || a.url.includes('youtu.be') || a.url.includes('facebook') || a.tipo?.includes('Vídeo')))?.url?.trim() ||
    '';

  const videoId = getYouTubeVideoId(rawUrl);
  const isYouTube = Boolean(videoId);
  const isFacebook = rawUrl.includes('facebook');
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1` : '';
  const watchUrl = isYouTube ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl;

  const displayTitle =
    title ||
    (sessao ? `${sessao.tipo} nº ${sessao.numero}/${sessao.ano}` : 'Transmissão e Gravação Oficial');

  const handleCopyLink = async () => {
    if (!watchUrl) return;
    const success = await copyToClipboard(watchUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-2 pb-10 px-2 sm:pt-3 sm:pb-14 sm:px-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col" style={{ maxHeight: 'min(92dvh, calc(100dvh - 1rem))' }}>
        {/* Header Bar */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Youtube className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {displayTitle}
              </h2>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                <span>Via SAPL · Paflegis</span>
                {sessao?.data && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {formatDateBR(sessao.data)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {watchUrl && (
              <button
                onClick={handleCopyLink}
                className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
                title="Copiar link do vídeo"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar Transmissão"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area - flex-1 + min-h-0 permite encolher em landscape;
            aspect-ratio mantém 16:9 mas cede espaço quando a altura é limitada */}
        <div className="relative w-full bg-black flex-1 min-h-0 overflow-hidden flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={displayTitle}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : rawUrl ? (
            <div className="p-6 text-center space-y-4 max-w-md">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Youtube className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  {isFacebook ? 'Transmissão no Facebook' : 'Transmissão Externa'}
                </h3>
                <p className="text-xs text-slate-400">
                  A gravação desta sessão está disponível no link externo oficial do SAPL.
                </p>
              </div>
              <a
                href={rawUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25"
              >
                <span>Assistir Gravação na Plataforma Externa</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-300">Sem vídeo disponível</p>
              <p className="text-xs text-slate-500">
                Esta sessão não possui link de gravação audiovisual cadastrado no SAPL.
              </p>
            </div>
          )}
        </div>

        {/* Footer info & links */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 block">
                Transmissão Audiovisual da Sessão
              </span>
              <span className="text-[11px] text-slate-400 block">
                Vídeo público vinculado via SAPL · exibido pelo Paflegis
              </span>
            </div>

            {watchUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="sm:hidden flex items-center gap-1 bg-slate-800 text-slate-200 font-bold text-xs px-3 py-1.5 rounded-md border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3 py-1.5 rounded-md transition-colors shadow-sm"
                >
                  <Youtube className="w-4 h-4" />
                  <span>{isYouTube ? 'Abrir no YouTube' : 'Abrir Vídeo Original'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Quick links to Pauta and Ata */}
          {sessao && (sessao.pauta_url || sessao.ata_url) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              {sessao.pauta_url && (
                <a
                  href={sessao.pauta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold">Consultar Pauta em PDF</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}

              {sessao.ata_url && (
                <a
                  href={sessao.ata_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold">Consultar Ata da Sessão</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
