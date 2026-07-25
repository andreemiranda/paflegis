import React, { useState, useEffect } from 'react';
import { Cookie, Settings, X, Check, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import {
  getStoredPreferences, savePreferences, ConsentPreferences,
} from '../lib/consentManager';
import { initAdSenseScript } from '../lib/ads';

export const CookieConsent: React.FC<{ onOpenCookiePolicy?: () => void }> = ({ onOpenCookiePolicy }) => {
  const [showBanner, setShowBanner]         = useState(false);
  const [showSettings, setShowSettings]     = useState(false);
  const [expandDetails, setExpandDetails]   = useState(false);

  const defaultPrefs = { essencial: true, analitico: false, desempenho: false, funcional: false, preferencias: false, marketing: false };
  const [prefs, setPrefs] = useState(defaultPrefs);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored?.consentimento_definido) {
      if (stored.marketing) initAdSenseScript(true);
      setShowBanner(false);
    } else {
      setShowBanner(true);
    }
  }, []);

  const apply = (p: typeof defaultPrefs, action: 'Aceitou Todos' | 'Recusou' | 'Personalizou') => {
    savePreferences(p, action);
    setShowBanner(false);
    setShowSettings(false);
    if (p.marketing) initAdSenseScript(true);
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay de fundo quando configurações expandidas */}
      {showSettings && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs" onClick={() => setShowSettings(false)} />
      )}

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl animate-fade-in">
        {/* Painel de configuração expandido */}
        {showSettings && (
          <div className="mb-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" /> Configurar Cookies
              </span>
              <button onClick={() => setShowSettings(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {[
                { key: 'essencial',    label: 'Necessários',       desc: 'Consentimento LGPD, acessibilidade e navegação. Sempre ativos.', fixed: true  },
                { key: 'analitico',    label: 'Analíticos',        desc: 'Compreender padrões de uso (dados anônimos).',                   fixed: false },
                { key: 'desempenho',   label: 'Desempenho',        desc: 'Medir tempos de carregamento e identificar erros.',              fixed: false },
                { key: 'funcional',    label: 'Funcionais',        desc: 'Recordar suas escolhas de visualização.',                        fixed: false },
                { key: 'preferencias', label: 'Preferências',      desc: 'Preservar configurações de acessibilidade entre sessões.',       fixed: false },
                { key: 'marketing',    label: 'Marketing (AdSense)', desc: 'Anúncios contextuais do Google para sustentar o aplicativo.', fixed: false },
              ].map(({ key, label, desc, fixed }) => (
                <div key={key} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      {label}
                      {fixed && <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Sempre Ativo</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <button
                    disabled={fixed}
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`relative shrink-0 w-9 h-5 rounded-full transition-colors ${prefs[key as keyof typeof prefs] ? 'bg-blue-600' : 'bg-slate-300'} ${fixed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${prefs[key as keyof typeof prefs] ? 'translate-x-4' : ''}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4 pt-2 flex gap-2">
              <button onClick={() => apply(prefs, 'Personalizou')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                Salvar Preferências
              </button>
              <button onClick={() => apply({ essencial: true, analitico: true, desempenho: true, funcional: true, preferencias: true, marketing: true }, 'Aceitou Todos')} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                Aceitar Todos
              </button>
            </div>
          </div>
        )}

        {/* Banner principal */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-xs mb-1">Privacidade & Cookies (LGPD)</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  O <strong>Paflegis</strong> utiliza cookies e tecnologias semelhantes para garantir o funcionamento adequado do aplicativo, melhorar sua experiência e atender às exigências da Lei Geral de Proteção de Dados (LGPD). Você pode aceitar todos, recusá-los ou personalizar suas preferências a qualquer momento.
                </p>

                {/* Link Política de Cookies */}
                <button
                  onClick={onOpenCookiePolicy}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-500 font-semibold mt-1"
                >
                  <ExternalLink className="w-3 h-3" /> Política de Cookies
                </button>

                {/* Detalhes colapsáveis */}
                <button
                  onClick={() => setExpandDetails(e => !e)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 mt-1 font-medium"
                >
                  {expandDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expandDetails ? 'Ocultar detalhes' : 'Ver categorias'}
                </button>

                {expandDetails && (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {[
                      ['✔ Necessários', 'Sempre'],
                      ['Analíticos', 'Opcional'],
                      ['Desempenho', 'Opcional'],
                      ['Funcionais', 'Opcional'],
                      ['Preferências', 'Opcional'],
                      ['Marketing', 'Opcional'],
                    ].map(([cat, status]) => (
                      <div key={cat} className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'Sempre' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            <button
              onClick={() => apply({ essencial: true, analitico: true, desempenho: true, funcional: true, preferencias: true, marketing: true }, 'Aceitou Todos')}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Aceitar Todos
            </button>
            <button
              onClick={() => apply(defaultPrefs, 'Recusou')}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Recusar
            </button>
            <button
              onClick={() => setShowSettings(s => !s)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Configurar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
