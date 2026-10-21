'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Cookie, Check, X, Settings } from 'lucide-react';
import {
  getStoredPreferences,
  savePreferences,
  ConsentPreferences,
} from '@/lib/consentManager';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [prefs, setPrefs] = useState<Omit<ConsentPreferences, 'consentimento_definido'>>({
    essencial: true,
    analitico: false,
    desempenho: false,
    funcional: false,
    preferencias: false,
    marketing: false,
  });

  useEffect(() => {
    const existing = getStoredPreferences();
    if (!existing || !existing.consentimento_definido) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    savePreferences(
      {
        essencial: true,
        analitico: true,
        desempenho: true,
        funcional: true,
        preferencias: true,
        marketing: true,
      },
      'Aceitou Todos'
    );
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    savePreferences(
      {
        essencial: true,
        analitico: false,
        desempenho: false,
        funcional: false,
        preferencias: false,
        marketing: false,
      },
      'Recusou'
    );
    setShowBanner(false);
  };

  const handleSaveCustom = () => {
    savePreferences(prefs, 'Personalizou');
    setShowModal(false);
    setShowBanner(false);
  };

  if (!showBanner && !showModal) return null;

  return (
    <>
      {showBanner && (
        <div
          className="fixed-bottom bg-white border-top shadow-lg p-3 p-md-4"
          style={{ zIndex: 1050 }}
          role="region"
          aria-label="Aviso de Cookies e Privacidade"
        >
          <div className="container">
            <div className="row align-items-center g-3">
              <div className="col-lg-8">
                <div className="d-flex align-items-start gap-3">
                  <div className="bg-primary text-white p-2 rounded-circle d-none d-sm-flex align-items-center justify-content-center">
                    <Cookie size={24} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                      <span>Privacidade & Cookies no Paflegis</span>
                    </h6>
                    <p className="small text-muted mb-0">
                      Utilizamos cookies essenciais para o funcionamento básico e cookies analíticos para aprimorar a sua experiência cívica de consulta. Seus dados são protegidos em conformidade com a LGPD (Lei nº 13.709/2018). Consulte nossa{' '}
                      <Link href="/privacidade" className="text-primary text-decoration-underline">
                        Política de Privacidade
                      </Link>{' '}
                      e{' '}
                      <Link href="/cookies" className="text-primary text-decoration-underline">
                        Política de Cookies
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 d-flex flex-wrap justify-content-lg-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                >
                  <Settings size={14} />
                  <span>Personalizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectAll}
                  className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                >
                  <X size={14} />
                  <span>Recusar Opcionais</span>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptAll}
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                >
                  <Check size={14} />
                  <span>Aceitar Todos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <Shield size={20} /> Personalizar Preferências de Cookies
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  aria-label="Fechar"
                ></button>
              </div>
              <div className="modal-body p-4">
                <p className="text-muted small mb-4">
                  Selecione as categorias de cookies que você autoriza o Paflegis a utilizar durante a sua navegação.
                </p>

                <div className="d-flex flex-column gap-3">
                  {/* Essencial */}
                  <div className="card border-light bg-light">
                    <div className="card-body py-3 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">Cookies Estritamente Necessários</h6>
                        <p className="small text-muted mb-0">
                          Indispensáveis para a segurança, roteamento e memorização de acessibilidade.
                        </p>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked disabled />
                      </div>
                    </div>
                  </div>

                  {/* Analítico */}
                  <div className="card border-light bg-light">
                    <div className="card-body py-3 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">Cookies Analíticos & Estatísticas</h6>
                        <p className="small text-muted mb-0">
                          Ajudam a entender o volume de acessos a matérias e normas para otimizar o desempenho.
                        </p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={prefs.analitico}
                          onChange={(e) => setPrefs({ ...prefs, analitico: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desempenho */}
                  <div className="card border-light bg-light">
                    <div className="card-body py-3 d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">Cookies de Desempenho</h6>
                        <p className="small text-muted mb-0">
                          Armazenam temporariamente consultas frequentes do SAPL para acelerar respostas.
                        </p>
                      </div>
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={prefs.desempenho}
                          onChange={(e) => setPrefs({ ...prefs, desempenho: e.target.checked })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveCustom}>
                  Salvar Preferências
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
