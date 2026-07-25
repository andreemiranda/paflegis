import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Users,
  Search,
  Menu,
  X,
  Code2,
  Info,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  onSearch,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  const navItems = [
    { id: 'home', label: 'Início', icon: Building2 },
    { id: 'materias', label: 'Matérias', icon: FileText },
    { id: 'normas', label: 'Normas', icon: BookOpen },
    { id: 'sessoes', label: 'Sessões', icon: Users },
    { id: 'sobre', label: 'Sobre', icon: Info },
    { id: 'api-docs', label: 'API Swagger', icon: Code2, highlight: true },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Title */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <img src="/images/logo.jpg" alt="Paflegis" className="h-9 w-auto rounded-lg shadow-sm" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-lg tracking-tight font-sans">
                  Paflegis
                </span>
                <span className="bg-slate-800 text-blue-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                  TO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">
                Consulta Legislativa Independente
              </p>
            </div>
          </div>

          {/* Quick Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-2">
            <div className="relative w-full flex gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Buscar matérias, leis, decretos, sessões..."
                  className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 border border-slate-700/80 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:bg-slate-900 transition-colors"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
              </div>
              <button
                onClick={onSearch}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status Badge */}
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">API SAPL</span>
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-md bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
            aria-label="Abrir Menu de Navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 md:hidden">
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar em Pedro Afonso (Ex: PL 42, Lei 1450)..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-blue-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
            <button
              onClick={onSearch}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex justify-end">
          <div className="w-4/5 max-w-sm bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col p-5 overflow-y-auto border-l border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <div className="w-3.5 h-3.5 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-bold text-white leading-tight">Paflegis</h3>
                  <p className="text-xs text-slate-400">Consulta Legislativa Independente</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">
                Navegação
              </p>
              {navItems.map(item => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-blue-600 text-white font-bold'
                        : item.highlight
                        ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-auto bg-slate-950/50 -mx-5 -mb-5 p-5">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Consulta às Informações Públicas do SAPL</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Desenvolvido por <strong className="text-slate-300">Paflegis</strong> (Aplicação Independente).
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

