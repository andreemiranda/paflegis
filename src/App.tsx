import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AIChatAssistant } from './components/AIChatAssistant';
import { AccessibilityBar } from './components/AccessibilityBar';
import { Header } from './components/Header';
import { DocumentTypesMenu } from './components/DocumentTypesMenu';
import { Footer } from './components/Footer';
import { CookieConsent } from './components/CookieConsent';
import { AccessibilityModal } from './components/AccessibilityModal';
import { SitemapModal } from './components/SitemapModal';

import { HomeView } from './views/HomeView';
import { MateriasView } from './views/MateriasView';
import { NormasView } from './views/NormasView';
import { SessoesView } from './views/SessoesView';
import { SobreView } from './views/SobreView';
import { PoliticaPrivacidadeView } from './views/PoliticaPrivacidadeView';
import { TermosDeUsoView } from './views/TermosDeUsoView';
import { AvisoDadosPublicosView } from './views/AvisoDadosPublicosView';
import { PoliticaDeCookiesView } from './views/PoliticaDeCookiesView';
import { AvisoLegalView } from './views/AvisoLegalView';
import { CentralDePrivacidadeView } from './views/CentralDePrivacidadeView';
import { ApiDocsView } from './views/ApiDocsView';
import { ContatoView } from './views/ContatoView';
import { DocumentTypeView } from './views/DocumentTypeView';
import { SeoAuditView } from './views/SeoAuditView';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname.toLowerCase();
      if (p.includes('seo-audit')) return 'seo-audit';
      if (p.startsWith('/materias')) return 'materias';
      if (p.startsWith('/normas')) return 'normas';
      if (p.startsWith('/sessoes')) return 'sessoes';
      if (p.startsWith('/sobre')) return 'sobre';
      if (p.startsWith('/contato')) return 'contato';
      if (p.startsWith('/api-docs')) return 'api-docs';
      if (p.startsWith('/termos-de-uso')) return 'termos-de-uso';
      if (p.startsWith('/politica-de-privacidade')) return 'politica-de-privacidade';
      if (p.startsWith('/aviso-de-dados-publicos')) return 'aviso-de-dados-publicos';
      if (p.startsWith('/politica-de-cookies')) return 'politica-de-cookies';
      if (p.startsWith('/aviso-legal')) return 'aviso-legal';
      if (p.startsWith('/central-de-privacidade')) return 'central-de-privacidade';
    }
    return 'home';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState(false);
  const [sitemapModalOpen, setSitemapModalOpen] = useState(false);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const searchableTabs = ['materias', 'normas', 'sessoes'];
    if (searchableTabs.includes(currentTab)) {
      setCurrentTab('_reset');
      setTimeout(() => {
        setCurrentTab(currentTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0);
    } else {
      handleSelectTab('materias');
    }
  };

  const renderCurrentView = () => {
    switch (currentTab) {
      case 'home':
        return (
          <HomeView
            onSelectTab={handleSelectTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      case 'materias':
        return <MateriasView initialSearch={searchQuery} />;
      case 'normas':
        return <NormasView initialSearch={searchQuery} />;
      case 'sessoes':
        return <SessoesView initialSearch={searchQuery} />;
      case 'sobre':
        return <SobreView />;
      case 'politica-de-privacidade':
        return <PoliticaPrivacidadeView onSelectTab={handleSelectTab} />;
      case 'termos-de-uso':
        return <TermosDeUsoView onSelectTab={handleSelectTab} />;
      case 'aviso-de-dados-publicos':
        return <AvisoDadosPublicosView onSelectTab={handleSelectTab} />;
      case 'politica-de-cookies':
        return <PoliticaDeCookiesView onSelectTab={handleSelectTab} />;
      case 'aviso-legal':
        return <AvisoLegalView onSelectTab={handleSelectTab} />;
      case 'central-de-privacidade':
        return <CentralDePrivacidadeView onSelectTab={handleSelectTab} />;
      case 'contato':
        return <ContatoView />;
      case 'api-docs':
        return <ApiDocsView />;
      case 'seo-audit':
        return <SeoAuditView />;
      default: {
        // Roteamento dinâmico: tipo:materia:<slug> | tipo:norma:<slug> | tipo:both:<slug>
        if (currentTab.startsWith('tipo:')) {
          const parts    = currentTab.split(':');
          const categoria = parts[1] as 'materia' | 'norma' | 'both';
          const slug      = parts.slice(2).join(':');
          return <DocumentTypeView categoria={categoria} slug={slug} />;
        }
        return (
          <HomeView
            onSelectTab={handleSelectTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-[#404040] selection:bg-[#bae6fd] selection:text-[#075985] pt-[48px] sm:pt-[42px] max-w-full w-full overflow-x-hidden">
      <AccessibilityBar
        onOpenAccessibilityModal={() => setAccessibilityModalOpen(true)}
        onOpenSitemapModal={() => setSitemapModalOpen(true)}
      />

      <Header
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <DocumentTypesMenu currentTab={currentTab} onSelectTab={handleSelectTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ErrorBoundary key={currentTab}>
          {renderCurrentView()}
        </ErrorBoundary>
      </main>

      <Footer onSelectTab={handleSelectTab} />

      {/* Banner LGPD - passa callback para abrir Política de Cookies */}
      <CookieConsent onOpenCookiePolicy={() => handleSelectTab('politica-de-cookies')} />

      {accessibilityModalOpen && (
        <AccessibilityModal onClose={() => setAccessibilityModalOpen(false)} />
      )}

      {sitemapModalOpen && (
        <SitemapModal
          onSelectTab={handleSelectTab}
          onClose={() => setSitemapModalOpen(false)}
        />
      )}

      <AIChatAssistant />
    </div>
  );
}
