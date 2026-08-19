'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, FileText, BookOpen, Video, Info, Mail, Code } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Início', icon: Landmark },
    { href: '/materias', label: 'Matérias', icon: FileText },
    { href: '/normas', label: 'Normas', icon: BookOpen },
    { href: '/sessoes', label: 'Sessões', icon: Video },
    { href: '/sobre', label: 'Sobre', icon: Info },
    { href: '/contato', label: 'Contato', icon: Mail },
  ];

  return (
    <header className="sticky-top bg-white border-bottom shadow-sm">
      <nav className="navbar navbar-expand-lg navbar-light bg-white py-2">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center gap-2 text-decoration-none">
            <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
              <Landmark size={22} />
            </div>
            <div>
              <span className="fs-5 fw-bold text-primary d-block lh-1">Paflegis</span>
              <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                Pedro Afonso · TO
              </small>
            </div>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMain"
            aria-controls="navbarMain"
            aria-expanded="false"
            aria-label="Alternar navegação"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarMain">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
                return (
                  <li className="nav-item" key={item.href}>
                    <Link
                      href={item.href}
                      className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                        isActive ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="d-flex ms-lg-2 mt-2 mt-lg-0">
              <Link
                href="/api-docs"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 py-1"
                title="Documentação da API REST"
              >
                <Code size={14} />
                <span>API REST</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
