/**
 * DocumentTypesMenu — menu suspenso com lista única de tipos de documento.
 *
 * Carrega dinamicamente todos os tipos de ambas as categorias (Matéria e Norma)
 * e os exibe como uma lista única, deduplicada por nome. Cada item navega para
 * a página unificada do tipo (tipo:both:<slug>).
 */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Layers, X, FileText } from 'lucide-react';
import { TipoFiltro } from '../types';
import { getTiposMaterias, getTiposNormas } from '../lib/api/sapl';
import { toSlug } from '../lib/slugUtils';

interface DocumentTypesMenuProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

interface MenuItem {
  nome:  string;
  slug:  string;
  tabId: string;
}

export const DocumentTypesMenu: React.FC<DocumentTypesMenuProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const [items, setItems]       = useState<MenuItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [open, setOpen]         = useState(false);
  const containerRef            = useRef<HTMLDivElement>(null);

  // Carrega e deduplica tipos das duas categorias
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [tm, tn] = await Promise.all([getTiposMaterias(), getTiposNormas()]);
        const seenSlugs = new Set<string>();
        const merged: MenuItem[] = [];

        for (const t of [...tm, ...tn]) {
          if (!t?.nome) continue;          // ignora itens sem nome
          const slug = toSlug(t.nome);
          if (!slug || seenSlugs.has(slug)) continue;
          seenSlugs.add(slug);
          merged.push({ nome: t.nome, slug, tabId: `tipo:both:${slug}` });
        }

        merged.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        if (!cancelled) setItems(merged);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Fecha ao clicar fora
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node))
        setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const handleSelect = (tabId: string) => {
    onSelectTab(tabId);
    setOpen(false);
  };

  const anyTypeActive = currentTab.startsWith('tipo:');
  const activeItem    = items.find(i => i.tabId === currentTab);

  return (
    <div ref={containerRef} className="relative bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 sm:h-11 gap-3">

          {/* Botão trigger */}
          <button
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-haspopup="listbox"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[36px] ${
              open || anyTypeActive
                ? 'bg-blue-600 text-white'
                : 'text-slate-200 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Documentos por Tipo</span>
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
            ) : (
              <>
                <span className="bg-slate-700 text-slate-200 text-xs font-mono px-2 py-0.5 rounded-full font-bold">
                  {items.length}
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          {/* Breadcrumb do tipo ativo */}
          {anyTypeActive && activeItem && !open && (
            <span className="hidden sm:block text-xs sm:text-sm text-slate-300 font-medium truncate max-w-xs">
              / {activeItem.nome}
            </span>
          )}
        </div>
      </div>

      {/* Painel suspenso */}
      {open && (
        <div className="absolute left-0 right-0 z-50 bg-slate-900 border-b border-slate-700 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">

            {/* Cabeçalho do painel */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tipos de Documento — {items.length} disponíveis
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 py-4 text-slate-300 text-xs sm:text-sm">
                <span className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-slate-300 animate-spin" />
                Carregando tipos do SAPL…
              </div>
            ) : (
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-1">
                {items.map(item => (
                  <button
                    key={item.tabId}
                    onClick={() => handleSelect(item.tabId)}
                    className={`w-full break-inside-avoid text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors mb-1 cursor-pointer min-h-[40px] flex items-center ${
                      currentTab === item.tabId
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-200 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {item.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
