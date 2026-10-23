'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Type, Volume2, HelpCircle } from 'lucide-react';
import AccessibilityModal from './AccessibilityModal';

export default function AccessibilityBar() {
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const storedContrast = localStorage.getItem('paflegis_contrast');
    if (storedContrast === 'true') {
      setHighContrast(true);
      document.body.classList.add('high-contrast');
    }

    const storedScale = localStorage.getItem('paflegis_font_scale') as any;
    if (storedScale) {
      setFontScale(storedScale);
      document.body.classList.remove('font-sm', 'font-base', 'font-lg', 'font-xl');
      document.body.classList.add(`font-${storedScale}`);
    }
  }, []);

  const toggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    localStorage.setItem('paflegis_contrast', String(next));
    if (next) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const changeFontSize = (delta: number) => {
    const scales: ('sm' | 'base' | 'lg' | 'xl')[] = ['sm', 'base', 'lg', 'xl'];
    const currentIndex = scales.indexOf(fontScale);
    const nextIndex = Math.max(0, Math.min(scales.length - 1, currentIndex + delta));
    const nextScale = scales[nextIndex];
    setFontScale(nextScale);
    localStorage.setItem('paflegis_font_scale', nextScale);
    document.body.classList.remove('font-sm', 'font-base', 'font-lg', 'font-xl');
    document.body.classList.add(`font-${nextScale}`);
  };

  return (
    <div>
      <div className="bg-dark text-white py-1 px-3 border-bottom border-secondary small w-100 overflow-hidden" aria-label="Barra de Acessibilidade">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div className="d-flex align-items-center gap-3">
            <span className="text-secondary fw-semibold">Acessibilidade:</span>
            <button
              onClick={toggleContrast}
              className={`btn btn-sm py-0 px-2 d-inline-flex align-items-center gap-1 ${
                highContrast ? 'btn-warning text-dark fw-bold' : 'btn-outline-light'
              }`}
              title="Alternar modo de alto contraste"
              aria-pressed={highContrast}
            >
              <Eye size={13} />
              <span>{highContrast ? 'Alto Contraste: Ativo' : 'Alto Contraste'}</span>
            </button>

            <div className="btn-group btn-group-sm" role="group" aria-label="Ajustar tamanho do texto">
              <button
                onClick={() => changeFontSize(-1)}
                className="btn btn-outline-light py-0 px-2 d-inline-flex align-items-center"
                title="Diminuir texto"
                disabled={fontScale === 'sm'}
              >
                <Type size={11} className="me-1" /> A-
              </button>
              <button
                onClick={() => changeFontSize(1)}
                className="btn btn-outline-light py-0 px-2 d-inline-flex align-items-center"
                title="Aumentar texto"
                disabled={fontScale === 'xl'}
              >
                <Type size={14} className="me-1" /> A+
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-link text-light text-decoration-none p-0 d-inline-flex align-items-center gap-1"
              title="Guia de Recursos de Acessibilidade"
            >
              <HelpCircle size={13} />
              <span>Guia de Acessibilidade</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && <AccessibilityModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
