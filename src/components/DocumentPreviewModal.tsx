import React from 'react';
import ReactDOM from 'react-dom';
import { X, ExternalLink, Copy, Check, FileText } from 'lucide-react';
import { copyToClipboard } from '../lib/urlUtils';

interface DocumentPreviewModalProps {
  title: string;
  url: string;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  title,
  url,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(url);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
      <div className="bg-white rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl border border-slate-200 overflow-hidden" style={{ maxHeight: 'min(92dvh, calc(100dvh - 1rem))' }}>
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-white truncate">{title}</h3>
              <p className="text-[11px] text-slate-400 truncate">{url}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="hidden sm:flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
            </button>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-[#4363bc] hover:bg-[#283c71] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver Original</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fechar Pré-visualização"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Body: PDF Preview / Document Viewer */}
        <div className="flex-1 bg-slate-100 relative flex flex-col">
          <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-slate-300">
              Caso o leitor interno não exiba o PDF nesta janela devido a restrições de segurança do navegador:
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Abrir em Nova Guia</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
          <iframe
            src={url}
            title={title}
            className="w-full flex-1 border-none bg-white"
            loading="lazy"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
