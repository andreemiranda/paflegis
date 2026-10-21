'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Landmark, ExternalLink, Map } from 'lucide-react';
import SitemapModal from './SitemapModal';

export default function Footer() {
  const [showSitemap, setShowSitemap] = useState(false);

  return (
    <>
      <footer className="bg-dark text-white-50 pt-5 pb-3 mt-auto border-top border-secondary">
        <div className="container">
          <div className="row g-4">
            {/* Coluna 1: Sobre o Projeto */}
            <div className="col-lg-4 col-md-6">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center">
                  <Landmark size={20} />
                </div>
                <span className="fs-5 fw-bold text-white">Paflegis</span>
              </div>
              <p className="small text-white-50 mb-3">
                Plataforma cívica e independente para consulta e transparência das atividades legislativas da Câmara Municipal de Pedro Afonso - TO.
              </p>
              <div className="p-3 rounded-2 small text-light mb-0 border border-secondary border-opacity-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
                <strong className="text-white d-block mb-1">Nota de Independência:</strong>
                <span className="text-white-50">O Paflegis utiliza dados públicos oficiais e abertos. Não é um canal governamental ou oficial.</span>
              </div>
            </div>

            {/* Coluna 2: Navegação Rápida */}
            <div className="col-lg-2 col-md-6">
              <h6 className="text-white fw-bold mb-3">Consulta Pública</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><Link href="/" className="text-white-50 text-decoration-none">Início</Link></li>
                <li><Link href="/materias" className="text-white-50 text-decoration-none">Matérias Legislativas</Link></li>
                <li><Link href="/normas" className="text-white-50 text-decoration-none">Normas Jurídicas</Link></li>
                <li><Link href="/sessoes" className="text-white-50 text-decoration-none">Sessões Plenárias</Link></li>
                <li><Link href="/sobre" className="text-white-50 text-decoration-none">Sobre o Paflegis</Link></li>
                <li><Link href="/contato" className="text-white-50 text-decoration-none">Fale Conosco</Link></li>
              </ul>
            </div>

            {/* Coluna 3: Privacidade & Governança */}
            <div className="col-lg-3 col-md-6">
              <h6 className="text-white fw-bold mb-3">Privacidade & LGPD</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
                <li><Link href="/privacidade" className="text-white-50 text-decoration-none">Política de Privacidade</Link></li>
                <li><Link href="/privacidade/central" className="text-white-50 text-decoration-none">Central de Privacidade LGPD</Link></li>
                <li><Link href="/cookies" className="text-white-50 text-decoration-none">Política de Cookies</Link></li>
                <li><Link href="/termos" className="text-white-50 text-decoration-none">Termos de Uso</Link></li>
                <li><Link href="/aviso-legal" className="text-white-50 text-decoration-none">Aviso Legal</Link></li>
                <li><Link href="/dados-publicos" className="text-white-50 text-decoration-none">Dados Públicos e Licença</Link></li>
              </ul>
            </div>

            {/* Coluna 4: Desenvolvedores & Auditoria */}
            <div className="col-lg-3 col-md-6">
              <h6 className="text-white fw-bold mb-3">Transparência & API</h6>
              <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
                <li><Link href="/api-docs" className="text-white-50 text-decoration-none">Documentação da API REST</Link></li>
                <li><Link href="/seo-audit" className="text-white-50 text-decoration-none">Auditoria de SEO & Conectividade</Link></li>
                <li>
                  <a
                    href="https://sapl.pedroafonso.to.leg.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white-50 text-decoration-none d-inline-flex align-items-center gap-1"
                  >
                    <span>SAPL Oficial Pedro Afonso</span>
                    <ExternalLink size={12} />
                  </a>
                </li>
              </ul>

              <button
                onClick={() => setShowSitemap(true)}
                className="btn btn-sm btn-outline-secondary text-white-50 w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <Map size={14} />
                <span>Mapa do Site Interativo</span>
              </button>
            </div>
          </div>

          <hr className="border-secondary mt-4 mb-3" />

          {/* Links Auxiliares de Navegação do Rodapé */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-white-50 mb-3">
            <div>
              &copy; {new Date().getFullYear()} Paflegis · Informações Legislativas de Pedro Afonso - TO
            </div>
            <div className="d-flex gap-3">
              <Link href="/privacidade" className="text-white-50 text-decoration-none">Privacidade</Link>
              <span>·</span>
              <Link href="/termos" className="text-white-50 text-decoration-none">Termos</Link>
              <span>·</span>
              <Link href="/cookies" className="text-white-50 text-decoration-none">Cookies</Link>
            </div>
          </div>

          {/* Última Linha na Parte Inferior do Rodapé: Mensagem e Imagens com Fundo Transparente */}
          <div className="pt-3 border-top border-secondary border-opacity-50 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 text-center text-md-start">
            <div className="small text-white-50">
              Conteúdo e dados sob licença{' '}
              <a
                href="https://creativecommons.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info text-decoration-none fw-semibold"
              >
                Creative Commons 4.0
              </a>{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-info text-decoration-none fw-semibold"
              >
                Atribuir Fonte - Compartilhar Igual
              </a>
            </div>

            <div className="d-flex align-items-center gap-3 flex-shrink-0">
              <a
                href="http://www.interlegis.leg.br/"
                target="_blank"
                rel="noopener noreferrer"
                title="Interlegis"
                className="d-inline-flex align-items-center text-decoration-none"
              >
                <img
                  src="https://sapl.pedroafonso.to.leg.br/static/sapl/frontend/img/logo_interlegis.png"
                  alt="Interlegis"
                  style={{ height: 26, width: 'auto', display: 'block' }}
                  referrerPolicy="no-referrer"
                />
              </a>
              <a
                href="https://sapl.pedroafonso.to.leg.br/static/sapl/frontend/img/logo_cc.png"
                target="_blank"
                rel="noopener noreferrer"
                title="Creative Commons"
                className="d-inline-flex align-items-center text-decoration-none"
              >
                <img
                  src="https://sapl.pedroafonso.to.leg.br/static/sapl/frontend/img/logo_cc.png"
                  alt="Creative Commons"
                  style={{ height: 26, width: 'auto', display: 'block' }}
                  referrerPolicy="no-referrer"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showSitemap && <SitemapModal onClose={() => setShowSitemap(false)} />}
    </>
  );
}
