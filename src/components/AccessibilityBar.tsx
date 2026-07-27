import React, { useState, useEffect } from 'react';
import { Eye, ZoomIn, ZoomOut, RotateCcw, HelpCircle, Map } from 'lucide-react';

interface AccessibilityBarProps {
  onOpenAccessibilityModal: () => void;
  onOpenSitemapModal: () => void;
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({
  onOpenAccessibilityModal,
  onOpenSitemapModal,
}) => {
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());
  }, [fontScale]);

  const toggleHighContrast = () => setHighContrast(!highContrast);

  const increaseFont = () => {
    setFontScale(prev => Math.min(prev + 0.1, 1.4));
  };

  const decreaseFont = () => {
    setFontScale(prev => Math.max(prev - 0.1, 0.8));
  };

  const resetFont = () => {
    setFontScale(1);
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800/80 text-slate-400 py-1 px-4 text-xs flex flex-wrap justify-between items-center gap-2 select-none">
      <div className="flex items-center gap-3">
        <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider hidden sm:inline">
          Acessibilidade:
        </span>
        <button
          onClick={toggleHighContrast}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-colors text-[11px] font-semibold ${
            highContrast
              ? 'bg-amber-400 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:text-white border border-slate-700'
          }`}
          title="Alternar Alto Contraste"
          aria-label="Alternar Alto Contraste"
        >
          <Eye className="w-3 h-3 text-blue-400" />
          <span>Alto Contraste</span>
        </button>

        <div className="flex items-center bg-slate-800 border border-slate-700 rounded overflow-hidden text-[11px]">
          <button
            onClick={decreaseFont}
            className="px-2 py-0.5 hover:bg-slate-700 transition-colors border-r border-slate-700 text-slate-300 font-medium"
            title="Diminuir fonte (A-)"
            aria-label="Diminuir tamanho da fonte"
          >
            <span className="flex items-center gap-1"><ZoomOut className="w-3 h-3 text-slate-400" /> A-</span>
          </button>
          <button
            onClick={resetFont}
            className="px-2 py-0.5 hover:bg-slate-700 transition-colors border-r border-slate-700 text-slate-300 font-medium"
            title="Tamanho normal (A)"
            aria-label="Redefinir tamanho da fonte"
          >
            <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3 text-slate-400" /> A</span>
          </button>
          <button
            onClick={increaseFont}
            className="px-2 py-0.5 hover:bg-slate-700 transition-colors text-slate-300 font-medium"
            title="Aumentar fonte (A+)"
            aria-label="Aumentar tamanho da fonte"
          >
            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3 text-slate-400" /> A+</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[11px]">
        <button
          onClick={onOpenAccessibilityModal}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-medium"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Recursos de Acessibilidade</span>
          <span className="sm:hidden">Acessibilidade</span>
        </button>

        <span className="text-slate-800">|</span>

        <button
          onClick={onOpenSitemapModal}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors font-medium"
        >
          <Map className="w-3.5 h-3.5 text-blue-400" />
          <span>Mapa do Site</span>
        </button>
      </div>
    </div>
  );
};

