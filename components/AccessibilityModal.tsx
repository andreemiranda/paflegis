'use client';

import React from 'react';
import { X, Eye, Type, Keyboard, HelpCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function AccessibilityModal({ onClose }: Props) {
  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <HelpCircle size={20} /> Recursos de Acessibilidade do Paflegis
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Fechar"
            ></button>
          </div>
          <div className="modal-body p-4">
            <p className="text-muted">
              O Paflegis foi desenvolvido em conformidade com as diretrizes de acessibilidade web (eMAG e WCAG 2.1), garantindo navegação inclusiva para todos os cidadãos.
            </p>

            <div className="row g-3 mt-2">
              <div className="col-md-6">
                <div className="card h-100 border-light bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary d-flex align-items-center gap-2">
                      <Eye size={18} /> Alto Contraste
                    </h6>
                    <p className="card-text small text-muted">
                      Inverte o esquema de cores para fundo preto puro com texto em alto contraste, facilitando a leitura para pessoas com baixa visão ou sensibilidade à luz.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card h-100 border-light bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary d-flex align-items-center gap-2">
                      <Type size={18} /> Redimensionamento de Texto
                    </h6>
                    <p className="card-text small text-muted">
                      Permite aumentar ou diminuir a escala tipográfica de toda a aplicação através dos botões A+ e A- na barra superior, sem quebrar o layout.
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="card border-light bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary d-flex align-items-center gap-2">
                      <Keyboard size={18} /> Navegação por Teclado e Leitores de Tela
                    </h6>
                    <p className="card-text small text-muted mb-2">
                      Todos os botões, campos e links possuem indicadores visuais de foco e rótulos semânticos (WAI-ARIA) compatíveis com NVDA, JAWS e TalkBack.
                    </p>
                    <ul className="small text-muted mb-0 ps-3">
                      <li><kbd>Tab</kbd>: Avança o foco para o próximo elemento interativo</li>
                      <li><kbd>Shift + Tab</kbd>: Retorna o foco para o elemento anterior</li>
                      <li><kbd>Enter</kbd> ou <kbd>Espaço</kbd>: Ativa botões e links</li>
                      <li><kbd>Esc</kbd>: Fecha modais e janelas suspensas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-light">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
