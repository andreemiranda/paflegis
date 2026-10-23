import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ExternalLink } from 'lucide-react';
import { getConfig } from '@/lib/config';

export const metadata = {
  title: 'Aviso Legal & Isenção de Responsabilidade',
  description: 'Declaração formal de independência e isenção de representação governamental do Paflegis.',
};

export default function AvisoLegalPage() {
  const config = getConfig();

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-warning bg-opacity-10 text-dark px-3 py-2 rounded-pill fw-semibold small mb-2 border border-warning">
              Isenção de Responsabilidade & Independência
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Aviso Legal</h1>
            <p className="text-muted small mb-0">
              Versão 1.1 · Conforme a Lei de Acesso à Informação
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5">
            <div className="alert alert-warning border-0 d-flex align-items-start gap-3 p-3 mb-4">
              <ShieldAlert size={24} className="text-warning flex-shrink-0 mt-1" />
              <div className="small">
                <strong>ATENÇÃO:</strong> O {config.siteName} é uma aplicação web cívica de iniciativa privada e independente. Não representa, não fala em nome e não substitui a {config.orgName} ({config.orgCity} - {config.orgUf}).
              </div>
            </div>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Natureza Independente</h4>
              <p className="text-muted small lh-lg">
                O aplicativo {config.siteName} atua exclusivamente como um agregador e organizador visual de dados públicos, facilitando a navegação e a experiência de busca do cidadão.
              </p>
            </section>

            <section className="mb-0">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Fé Pública e Validade Oficial</h4>
              <p className="text-muted small lh-lg">
                Para fins de publicação legal com efeito de fé pública, certidões oficiais ou prazos processuais, o único canal com validade jurídica formal é o Diário Oficial e o Sistema de Apoio ao Processo Legislativo (SAPL) oficial do município:
              </p>
              <div className="p-3 bg-light rounded-3 small">
                <a
                  href={config.saplPublicDomain}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fw-bold text-primary text-decoration-none d-inline-flex align-items-center gap-1"
                >
                  <span>Portal Oficial SAPL {config.orgName}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
