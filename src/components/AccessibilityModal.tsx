import React from 'react';
import { HelpCircle, X, Check, Eye, ZoomIn } from 'lucide-react';

interface AccessibilityModalProps {
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(92dvh, calc(100dvh - 1rem))' }}
      >
        {/* Conteúdo com scroll interno para landscape */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-slate-900">
              <HelpCircle className="w-5 h-5 text-[#0ea5e9]" />
              <h3 className="font-bold text-base">Recursos de Acessibilidade (WCAG 2.1)</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#0ea5e9]" />
                <span>Alto Contraste</span>
              </p>
              <p>
                Na barra superior de acessibilidade, clique em "Alto Contraste" para alternar para o
                tema escuro de alto contraste, ideal para ambientes com pouca iluminação.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ZoomIn className="w-4 h-4 text-[#0ea5e9]" />
                <span>Ajuste Dinâmico de Fonte (A-, A, A+)</span>
              </p>
              <p>
                Aumente ou diminua o tamanho do texto em todo o aplicativo com um clique sem quebrar
                o layout móvel.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Navegação por Teclado e Leitores de Tela</span>
              </p>
              <p>
                Todos os botões contêm descrições para leitores de tela (`aria-label`) e indicativo
                visual de foco ao navegar usando a tecla Tab.
              </p>
            </div>
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="bg-[#0ea5e9] hover:bg-[#0c80b6] text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
