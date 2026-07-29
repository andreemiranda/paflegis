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
  Mail,
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
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onSearch();
  };

  const navItems = [
    { id: 'home', label: 'Início', icon: Building2 },
    { id: 'materias', label: 'Matérias', icon: FileText },
    { id: 'normas', label: 'Normas', icon: BookOpen },
    { id: 'sessoes', label: 'Sessões', icon: Users },
    { id: 'contato', label: 'Contato', icon: Mail },
    { id: 'sobre', label: 'Sobre', icon: Info },
    { id: 'api-docs', label: 'API Swagger', icon: Code2, highlight: true },
  ];

  const handleNavClick = (id: string) => {
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative bg-slate-900 border-b border-slate-800 text-white shadow-sm w-full max-w-full overflow-x-hidden">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 xl:gap-3 w-full">
          {/* Brand Logo & Title */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group shrink-0 py-1"
          >
            <img src="/images/logo.jpg" alt="Paflegis" className="h-8 sm:h-9 xl:h-10 w-auto rounded-lg shadow-sm" />
            <div>
              <span className="font-bold text-white text-base sm:text-lg xl:text-xl tracking-tight font-sans">
                Paflegis
              </span>
              <p className="text-[10px] sm:text-xs text-slate-400 leading-none mt-0.5">
                Consulta Legislativa Independente
              </p>
            </div>
          </div>

          {/* Quick Search Bar (Desktop LG+) */}
          <div className="hidden lg:flex flex-1 items-center mx-2 max-w-sm xl:max-w-md 2xl:max-w-lg min-w-[200px]">
            <div
              className={`relative w-full transition-all duration-200 ease-in-out flex items-center gap-1.5 ${
                isFocused ? 'ring-2 ring-blue-500/40 rounded-lg z-30' : ''
              }`}
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Buscar matérias, leis, decretos, sessões..."
                  className={`w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 border rounded-lg pl-9 pr-8 py-2 text-xs sm:text-sm transition-colors shadow-inner focus:outline-none min-h-[38px] ${
                    isFocused
                      ? 'border-blue-500 bg-slate-900'
                      : 'border-slate-700/80 hover:border-slate-600'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {searchQuery && (
                  <button
                    onClick={() => onSearchChange('')}
                    onMouseDown={e => e.preventDefault()}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Limpar busca"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                onClick={onSearch}
                className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer min-h-[38px] flex items-center gap-1.5 shadow-sm"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Navigation Links (Desktop LG+) */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs xl:text-xs 2xl:text-sm font-semibold transition-colors cursor-pointer min-h-[36px] whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : item.highlight
                      ? 'bg-slate-800 text-amber-300 hover:bg-slate-700 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 xl:w-4 xl:h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Status Badge (LG+) */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800 text-xs shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] xl:text-xs font-mono text-slate-300 uppercase tracking-wider whitespace-nowrap">
              API SAPL
            </span>
          </div>

          {/* Mobile Menu Hamburger Button (<1024px) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            aria-label="Abrir Menu de Navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile / Tablet Search Input (<1024px) */}
        <div className="pb-3 lg:hidden">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar em Pedro Afonso (Ex: PL 42, Lei 1450)..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 border border-slate-700 rounded-lg pl-9 pr-8 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all min-h-[42px]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-3 text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={onSearch}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer min-h-[42px] flex items-center gap-1.5 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>Buscar</span>
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
                className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 flex-1 space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Navegação
              </p>
              {navItems.map(item => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                      active
                        ? 'bg-blue-600 text-white font-bold'
                        : item.highlight
                        ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800 mt-auto bg-slate-950/50 -mx-5 -mb-5 p-5">
              <div className="flex items-center gap-2 text-xs text-slate-300 mb-1">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Consulta às Informações Públicas do SAPL</span>
              </div>
              <p className="text-xs text-slate-400">
                Desenvolvido por <strong className="text-slate-200">Paflegis</strong> (Aplicação Independente).
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

