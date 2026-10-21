'use client';

import React from 'react';
import Link from 'next/link';
import { X, Map, ExternalLink } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function SitemapModal({ onClose }: Props) {
  const sections = [
    {
      title: 'Principal & Consulta',
      links: [
        { href: '/', label: 'Página Inicial (Dashboard de Estatísticas)' },
        { href: '/materias', label: 'Matérias Legislativas' },
        { href: '/normas', label: 'Normas Jurídicas' },
        { href: '/sessoes', label: 'Sessões Plenárias' },
      ],
    },
    {
      title: 'Institucional & Atendimento',
      links: [
        { href: '/sobre', label: 'Sobre o Projeto Paflegis' },
        { href: '/contato', label: 'Canal de Contato & Suporte Cívico' },
      ],
    },
    {
      title: 'Privacidade & Jurídico',
      links: [
        { href: '/privacidade', label: 'Política de Privacidade' },
        { href: '/privacidade/central', label: 'Central de Privacidade & Direitos LGPD' },
        { href: '/cookies', label: 'Política de Cookies' },
        { href: '/termos', label: 'Termos de Uso' },
        { href: '/aviso-legal', label: 'Aviso Legal e Independência' },
        { href: '/dados-publicos', label: 'Dados Públicos e Licenciamento Aberto' },
      ],
    },
    {
      title: 'Desenvolvedores & Auditoria',
      links: [
        { href: '/api-docs', label: 'Documentação da API Pública (Swagger/OpenAPI)' },
        { href: '/seo-audit', label: 'Auditoria de SEO, Metadados e Conectividade' },
      ],
    },
  ];

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title d-flex align-items-center gap-2">
              <Map size={20} /> Mapa do Site - Paflegis
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Fechar"
            ></button>
          </div>
          <div className="modal-body p-4">
            <p className="text-muted small mb-4">
              Explore a estrutura de páginas do aplicativo cívico Paflegis para navegação rápida e transparente.
            </p>
            <div className="row g-4">
              {sections.map((sec) => (
                <div className="col-md-6" key={sec.title}>
                  <h6 className="fw-bold text-primary mb-2 border-bottom pb-1">{sec.title}</h6>
                  <ul className="list-unstyled small mb-0 d-flex flex-column gap-2">
                    {sec.links.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="text-decoration-none text-dark d-flex align-items-center gap-1 hover-primary"
                        >
                          <span>•</span>
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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
