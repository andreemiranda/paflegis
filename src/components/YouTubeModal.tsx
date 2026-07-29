import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Youtube, ExternalLink, Calendar, FileText, Copy, Check } from 'lucide-react';
import { SessaoPlenaria } from '../types';
import { copyToClipboard, getYouTubeVideoId, getYouTubeWatchUrl } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';

// Re-exporta para manter compatibilidade com importações existentes
export { getYouTubeVideoId };

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessao?: SessaoPlenaria | null;
  videoUrl?: string;
  title?: string;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  sessao,
  videoUrl,
  title,
}) => {
  const [copied, setCopied] = useState(false);

  // Bloqueia a rolagem do body e html enquanto o modal estiver aberto e restaura ao fechar
  useEffect(() => {
    if (isOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isOpen]);

  // Suporte a fechamento com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const rawUrl =
    videoUrl?.trim() ||
    sessao?.youtube_url?.trim() ||
    sessao?.anexos?.find(
      a =>
        a.url &&
        (a.url.includes('youtube') ||
          a.url.includes('youtu.be') ||
          a.url.includes('facebook') ||
          a.tipo?.toLowerCase().includes('vídeo'))
    )?.url?.trim() ||
    '';

  const videoId = getYouTubeVideoId(rawUrl);
  const isYouTube = Boolean(videoId);
  const isFacebook = rawUrl.toLowerCase().includes('facebook');

  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`
    : '';

  const watchUrl = getYouTubeWatchUrl(rawUrl) || (isYouTube ? `https://www.youtube.com/watch?v=${videoId}` : rawUrl);

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

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-sm overflow-y-auto max-w-full overflow-x-hidden"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100dvh',
      }}
      onClick={onClose}
    >
      {/* Card do Modal — Centralizado estritamente na Viewport visível */}
      <div
        className="relative z-10 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto transition-all duration-200"
        style={{
          maxHeight: 'min(92dvh, calc(100dvh - 2rem))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="shrink-0 px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 text-white">
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
                className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
                title="Copiar link do vídeo"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar Transmissão"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Area - Garante dimensões visíveis com aspect-video real */}
        <div className="relative w-full bg-black aspect-video max-h-[58dvh] sm:max-h-[62dvh] flex items-center justify-center overflow-hidden shrink-0">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={displayTitle}
              className="w-full h-full border-0 block"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : rawUrl && watchUrl ? (
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
                href={watchUrl}
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
        <div className="shrink-0 p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 space-y-3">
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

  return createPortal(modalContent, document.body);
};

