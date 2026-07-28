import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Eye,
  Video,
} from 'lucide-react';
import { DocumentoAnexo } from '../types';
import { copyToClipboard, shareUrl, normalizeDocumentUrl, getYouTubeVideoId, getYouTubeWatchUrl } from '../lib/urlUtils';
import { formatDateBR } from '../lib/dateUtils';
import { DocumentPreviewModal } from './DocumentPreviewModal';
import { YouTubeModal } from './YouTubeModal';

interface DocumentCardProps {
  documento: DocumentoAnexo;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ documento }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showYouTubeModal, setShowYouTubeModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const videoId = getYouTubeVideoId(documento.url);
  const isYouTubeUrl =
    Boolean(videoId) ||
    documento.url.includes('youtube.com') ||
    documento.url.includes('youtu.be') ||
    Boolean(documento.tipo && documento.tipo.toLowerCase().includes('vídeo'));

  // Normaliza o link original de vídeo ou documento para ser aberto com segurança
  const safeWatchUrl =
    getYouTubeWatchUrl(documento.url) ||
    normalizeDocumentUrl(documento.url);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopyLink = async () => {
    const targetUrl = safeWatchUrl || documento.url;
    if (!targetUrl) return;
    const success = await copyToClipboard(targetUrl);
    if (success) {
      setCopied(true);
      showToast('Link do documento copiado com sucesso!');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    const targetUrl = safeWatchUrl || documento.url;
    if (!targetUrl) return;
    const success = await shareUrl(
      documento.nome,
      `Documento público do Paflegis - Pedro Afonso TO`,
      targetUrl
    );
    if (!success && !navigator.share) {
      await handleCopyLink();
    }
  };

  const handleOpenPreview = () => {
    if (isYouTubeUrl) {
      setShowYouTubeModal(true);
    } else {
      setShowPreview(true);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 hover:border-slate-300 transition-all space-y-3">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in border border-sky-400">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Document Name & Description */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0ea5e9]/10 text-[#0c80b6] flex items-center justify-center shrink-0 font-bold">
          {isYouTubeUrl ? <Video className="w-5 h-5 text-red-600" /> : <FileText className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words">
            {documento.nome}
          </h4>
          {documento.descricao && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
              {documento.descricao}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            {documento.tipo && <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded font-medium">{documento.tipo}</span>}
            {documento.data && <span>• {formatDateBR(documento.data)}</span>}
            {documento.tamanho && <span>• {documento.tamanho}</span>}
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* Botão 1: Ver Documento */}
        <a
          href={safeWatchUrl || documento.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-[#4363bc] hover:bg-[#283c71] text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg transition-colors shadow-sm cursor-pointer min-h-[40px]"
          title="Abrir documento original em nova guia"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Ver Documento</span>
        </a>

        {/* Botão 2: Copiar Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-1.5 border border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#f0f9ff] font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          title="Copiar link direto do documento"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
        </button>

        {/* Botão 3: Visualizar / Assistir */}
        <button
          onClick={handleOpenPreview}
          className="flex items-center justify-center gap-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          title={isYouTubeUrl ? "Assistir vídeo no app" : "Visualizar documento na tela"}
        >
          {isYouTubeUrl ? <Video className="w-4 h-4 text-red-600" /> : <Eye className="w-4 h-4" />}
          <span>{isYouTubeUrl ? 'Assistir' : 'Visualizar'}</span>
        </button>

        {/* Botão 4: Compartilhar */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          title="Compartilhar documento"
        >
          <Share2 className="w-4 h-4" />
          <span>Compartilhar</span>
        </button>
      </div>

      {/* PDF Modal Preview */}
      {showPreview && (
        <DocumentPreviewModal
          title={documento.nome}
          url={documento.url}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* YouTube Modal */}
      {showYouTubeModal && (
        <YouTubeModal
          isOpen={showYouTubeModal}
          onClose={() => setShowYouTubeModal(false)}
          videoUrl={documento.url}
          title={documento.nome}
        />
      )}
    </div>
  );
};
