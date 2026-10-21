'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Landmark,
  FileText,
  BookOpen,
  Video,
  Info,
  Mail,
  Code,
  Layers,
  ChevronDown,
  Search,
  X,
  FileCheck,
  Scale,
  FileSpreadsheet,
  FolderKanban,
} from 'lucide-react';
import { ALL_38_DOCUMENT_TYPES, getDocumentTypesByCategory } from '@/lib/sapl/documentTypes';

export default function Header() {
  const pathname = usePathname();
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao navegar para outra página
  useEffect(() => {
    setShowMegaMenu(false);
  }, [pathname]);

  // Fechar menu ao clicar fora do componente Header
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMegaMenu(false);
      }
    }
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const categorizedTypes = getDocumentTypesByCategory();

  const categoryIcons: Record<string, any> = {
    'Matérias e Projetos': FileCheck,
    'Requerimentos por Vereador': FileSpreadsheet,
    'Normas e Legislação': Scale,
    'Atos e Comissões': FolderKanban,
  };

  const filteredList = ALL_38_DOCUMENT_TYPES.filter(
    (t) =>
      filterSearch === '' ||
      t.nome.toLowerCase().includes(filterSearch.toLowerCase()) ||
      t.menuLabel.toLowerCase().includes(filterSearch.toLowerCase()) ||
      t.sigla.toLowerCase().includes(filterSearch.toLowerCase())
  );

  const isDocActive = pathname.startsWith('/documentos') || pathname.startsWith('/tipos');

  const toggleMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMegaMenu(!showMegaMenu);
  };

  return (
    <header className="sticky-top bg-white border-bottom shadow-sm position-relative" ref={menuRef} style={{ zIndex: 1040 }}>
      {/* Barra de Navegação Principal */}
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
            {/* Ordem Solicitada: Início, Matérias, Normas, Sessões, Todos (38), Contato, Sobre */}
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-1 align-items-lg-center">
              {/* 1. Início */}
              <li className="nav-item">
                <Link
                  href="/"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname === '/' ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <Landmark size={16} />
                  <span>Início</span>
                </Link>
              </li>

              {/* 2. Matérias */}
              <li className="nav-item">
                <Link
                  href="/materias"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname.startsWith('/materias') ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <FileText size={16} />
                  <span>Matérias</span>
                </Link>
              </li>

              {/* 3. Normas */}
              <li className="nav-item">
                <Link
                  href="/normas"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname.startsWith('/normas') ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <BookOpen size={16} />
                  <span>Normas</span>
                </Link>
              </li>

              {/* 4. Sessões */}
              <li className="nav-item">
                <Link
                  href="/sessoes"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname.startsWith('/sessoes') ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <Video size={16} />
                  <span>Sessões</span>
                </Link>
              </li>

              {/* 5. Todos (38) - Menu Suspenso */}
              <li className="nav-item">
                <button
                  type="button"
                  onClick={toggleMenu}
                  className={`nav-link btn btn-link px-3 py-2 rounded-2 d-flex align-items-center gap-1.5 fw-semibold text-decoration-none border-0 ${
                    showMegaMenu || isDocActive
                      ? 'bg-primary bg-opacity-10 text-primary'
                      : 'text-dark'
                  }`}
                  aria-expanded={showMegaMenu}
                  aria-haspopup="true"
                  title="Consultar os 38 tipos de documentos da Câmara Municipal"
                  style={{ cursor: 'pointer' }}
                >
                  <Layers size={16} className="text-primary" />
                  <span>Todos (38)</span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showMegaMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                    className={showMegaMenu ? 'text-primary' : 'text-muted'}
                  />
                </button>
              </li>

              {/* 6. Contato */}
              <li className="nav-item">
                <Link
                  href="/contato"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname.startsWith('/contato') ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <Mail size={16} />
                  <span>Contato</span>
                </Link>
              </li>

              {/* 7. Sobre */}
              <li className="nav-item">
                <Link
                  href="/sobre"
                  className={`nav-link px-3 py-2 rounded-2 d-flex align-items-center gap-2 fw-medium ${
                    pathname.startsWith('/sobre') ? 'active bg-primary bg-opacity-10 text-primary' : 'text-dark'
                  }`}
                >
                  <Info size={16} />
                  <span>Sobre</span>
                </Link>
              </li>
            </ul>

            <div className="d-flex ms-lg-2 mt-2 mt-lg-0 align-items-center">
              <Link
                href="/api-docs"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 px-3 py-1.5"
                title="Documentação da API REST"
              >
                <Code size={14} />
                <span>API REST</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu Suspenso / Mega Menu com os 38 Tipos Reais */}
      {showMegaMenu && (
        <div
          className="border-top bg-light shadow-lg py-3 position-absolute w-100 start-0"
          style={{
            top: '100%',
            zIndex: 1050,
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="container">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3 pb-2 border-bottom">
              <div>
                <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <Layers size={18} className="text-primary" />
                  Todos os 38 Tipos de Documentos (SAPL Pedro Afonso)
                </h6>
                <small className="text-muted">
                  Acesse páginas exclusivas de cada documento da Câmara Municipal.
                </small>
              </div>

              <div className="d-flex align-items-center gap-2" style={{ minWidth: 260 }}>
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white text-muted">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Filtrar tipo ou sigla..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    autoFocus
                  />
                  {filterSearch && (
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => setFilterSearch('')}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  className="btn-close btn-sm"
                  aria-label="Fechar"
                  onClick={() => setShowMegaMenu(false)}
                />
              </div>
            </div>

            {/* Visualização Filtrada quando há pesquisa */}
            {filterSearch ? (
              <div className="row g-2">
                {filteredList.length > 0 ? (
                  filteredList.map((doc) => (
                    <div key={doc.id} className="col-lg-3 col-md-4 col-sm-6">
                      <Link
                        href={`/documentos/${doc.slug}`}
                        onClick={() => setShowMegaMenu(false)}
                        className="px-2.5 py-1.5 bg-white rounded border d-flex align-items-center justify-content-between text-decoration-none hover-shadow text-nowrap"
                      >
                        <div className="d-flex align-items-center gap-1.5 text-nowrap overflow-hidden">
                          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold text-nowrap" style={{ fontSize: '0.72rem' }}>
                            {doc.sigla}
                          </span>
                          <span className="small text-dark fw-semibold text-nowrap">{doc.menuLabel}</span>
                        </div>
                        <span className="badge bg-light text-muted border text-nowrap" style={{ fontSize: '0.65rem' }}>
                          #{doc.saplTipoId}
                        </span>
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="col-12 py-3 text-center text-muted">
                    Nenhum tipo encontrado para &quot;{filterSearch}&quot;.
                  </div>
                )}
              </div>
            ) : (
              /* Visualização Organizada pelas Categorias Reais */
              <div className="row g-3">
                {Object.entries(categorizedTypes).map(([categoryName, items]) => {
                  const CategoryIcon = categoryIcons[categoryName] || Layers;
                  return (
                    <div key={categoryName} className="col-lg-3 col-md-6">
                      <div className="card h-100 border-0 shadow-none bg-white p-2.5 rounded-3">
                        <h6 className="fw-bold text-primary mb-2 pb-1.5 border-bottom d-flex align-items-center gap-1.5 text-nowrap" style={{ fontSize: '0.84rem' }}>
                          <CategoryIcon size={15} />
                          <span className="text-nowrap">{categoryName}</span>
                          <span className="badge bg-primary bg-opacity-10 text-primary ms-auto" style={{ fontSize: '0.68rem' }}>
                            {items.length}
                          </span>
                        </h6>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-1" style={{ maxHeight: 260, overflowY: 'auto' }}>
                          {items.map((doc) => (
                            <li key={doc.id} className="text-nowrap">
                              <Link
                                href={`/documentos/${doc.slug}`}
                                onClick={() => setShowMegaMenu(false)}
                                className="px-2 py-1 rounded d-flex align-items-center justify-content-between text-decoration-none small text-dark hover-bg-light text-nowrap"
                                style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                                title={doc.nome}
                              >
                                <span className="fw-medium text-nowrap">{doc.menuLabel}</span>
                                <span className="badge bg-secondary bg-opacity-10 text-secondary text-nowrap" style={{ fontSize: '0.68rem' }}>
                                  {doc.sigla}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
              <span className="small text-muted">
                38 espécies catalogadas da API SAPL com busca e paginação dedicada.
              </span>
              <Link
                href="/documentos"
                onClick={() => setShowMegaMenu(false)}
                className="btn btn-sm btn-link text-primary fw-semibold text-decoration-none"
              >
                Ver Catálogo Completo &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
