import React from 'react';
import {
  Map, X, ChevronRight, FileText, BookOpen, Users, Info, Mail,
  ShieldCheck, Code2, Cookie, Scale, Lock, FileCheck,
} from 'lucide-react';

interface SitemapModalProps {
  onSelectTab: (tab: string) => void;
  onClose: () => void;
}

export const SitemapModal: React.FC<SitemapModalProps> = ({ onSelectTab, onClose }) => {
  const sections = [
    {
      label: 'Módulos de Consulta',
      links: [
        { id: 'home',     label: 'Início / Painel Geral',       icon: Map },
        { id: 'materias', label: 'Matérias Legislativas',        icon: FileText },
        { id: 'normas',   label: 'Normas Jurídicas',             icon: BookOpen },
        { id: 'sessoes',  label: 'Sessões Plenárias',            icon: Users },
        { id: 'contato',  label: 'Contato',                      icon: Mail },
        { id: 'sobre',    label: 'Sobre o Paflegis',             icon: Info },
        { id: 'api-docs', label: 'API Swagger Pública',          icon: Code2 },
      ],
    },
    {
      label: 'Informações Legais & Privacidade',
      links: [
        { id: 'politica-de-privacidade',  label: 'Política de Privacidade (LGPD)', icon: ShieldCheck },
        { id: 'termos-de-uso',            label: 'Termos de Uso',                  icon: FileText },
        { id: 'politica-de-cookies',      label: 'Política de Cookies',             icon: Cookie },
        { id: 'aviso-legal',              label: 'Aviso Legal',                     icon: Scale },
        { id: 'aviso-de-dados-publicos',  label: 'Aviso de Dados Públicos (LAI)',   icon: FileCheck },
        { id: 'central-de-privacidade',   label: 'Central de Privacidade',          icon: Lock },
      ],
    },
  ];

  const handleClick = (id: string) => { onSelectTab(id); onClose(); };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in overflow-hidden">
      <div
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(92dvh, calc(100dvh - 1rem))' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2 text-slate-900">
            <Map className="w-5 h-5 text-[#0ea5e9]" />
            <h3 className="font-bold text-base">Mapa do Site Paflegis</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links com scroll */}
        <div className="overflow-y-auto p-5 pt-3 space-y-4">
          {sections.map(sec => (
            <div key={sec.label}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{sec.label}</p>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {sec.links.map(l => {
                  const Icon = l.icon;
                  return (
                    <button
                      key={l.id}
                      onClick={() => handleClick(l.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-[#0ea5e9] hover:bg-sky-50 text-slate-800 transition-all font-medium text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-[#0ea5e9]" />
                        <span>{l.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
