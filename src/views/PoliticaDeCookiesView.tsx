import React, { useState } from 'react';
import { Cookie, CheckCircle, Info, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { getStoredPreferences, savePreferences } from '../lib/consentManager';
import { setContatoOrigin } from '../lib/contatoNavStore';

interface PoliticaDeCookiesProps { onSelectTab: (tab: string) => void; }

const Section: React.FC<{ title: string; badge?: string; always?: boolean; optional?: boolean; children: React.ReactNode }> = ({
  title, badge, always, optional, children,
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="font-bold text-slate-800 text-sm">{title}</span>
          {always   && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Sempre Ativo</span>}
          {optional && <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">Opcional</span>}
          {badge    && <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">{badge}</span>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-4 py-4 text-xs text-slate-600 leading-relaxed space-y-2">{children}</div>}
    </div>
  );
};

export const PoliticaDeCookiesView: React.FC<PoliticaDeCookiesProps> = ({ onSelectTab }) => {
  const prefs = getStoredPreferences();
  const [saved, setSaved] = useState(false);

  const handleAcceptAll = () => {
    savePreferences({ essencial: true, analitico: true, desempenho: true, funcional: true, preferencias: true, marketing: true }, 'Aceitou Todos');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  const handleRejectOptional = () => {
    savePreferences({ essencial: true, analitico: false, desempenho: false, funcional: false, preferencias: false, marketing: false }, 'Recusou');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Cookie className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Política de Cookies</h1>
            <p className="text-xs text-slate-500">Última atualização: Julho de 2026 · Em conformidade com a Lei nº 13.709/2018 (LGPD)</p>
          </div>
        </div>

        {/* O que são cookies */}
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 text-base">1. O Que São Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você acessa um site ou aplicativo. Eles permitem que o sistema reconheça o dispositivo em visitas subsequentes, preserve preferências e colete informações de uso.
          </p>
          <p>
            O <strong>Paflegis</strong> utiliza cookies estritamente necessários ao funcionamento e, com o seu consentimento, cookies analíticos e de publicidade para melhorar continuamente a experiência. Nenhum cookie opcional é carregado antes da sua autorização expressa.
          </p>
        </section>

        {/* Categorias */}
        <section className="space-y-3">
          <h2 className="font-bold text-slate-900 text-base">2. Categorias de Cookies Utilizados</h2>

          <Section title="Cookies Necessários" always>
            <p><strong>Finalidade:</strong> garantir o funcionamento básico do aplicativo - preferências de acessibilidade (contraste, tamanho de fonte), consentimento LGPD e navegação entre abas.</p>
            <p><strong>Base legal (LGPD):</strong> Legítimo Interesse (art. 7º, IX) e cumprimento de obrigação legal (art. 7º, II).</p>
            <p><strong>Exemplos:</strong> <code>paflegis_cookie_preferences</code>, <code>paflegis_consent_history</code>, <code>paflegis_accessibility</code>.</p>
            <p><strong>Prazo de armazenamento:</strong> Sessão ou até 12 meses (preferências).</p>
            <p><strong>Terceiros:</strong> Nenhum.</p>
          </Section>

          <Section title="Cookies Analíticos" optional>
            <p><strong>Finalidade:</strong> compreender como os usuários interagem com o aplicativo para melhorar a usabilidade e o desempenho.</p>
            <p><strong>Base legal (LGPD):</strong> Consentimento do titular (art. 7º, I).</p>
            <p><strong>Exemplos:</strong> dados de sessão anônimos de navegação (páginas visitadas, tempo de uso).</p>
            <p><strong>Prazo de armazenamento:</strong> Até 13 meses.</p>
            <p><strong>Terceiros:</strong> Nenhum no momento. Caso integrado futuramente (ex.: Google Analytics), o usuário será notificado e o consentimento reobtido.</p>
          </Section>

          <Section title="Cookies de Desempenho" optional>
            <p><strong>Finalidade:</strong> medir tempos de carregamento, identificar erros e otimizar o desempenho do aplicativo.</p>
            <p><strong>Base legal (LGPD):</strong> Consentimento do titular (art. 7º, I).</p>
            <p><strong>Prazo de armazenamento:</strong> Até 6 meses.</p>
            <p><strong>Terceiros:</strong> Nenhum no momento.</p>
          </Section>

          <Section title="Cookies Funcionais" optional>
            <p><strong>Finalidade:</strong> recordar escolhas do usuário para personalizar a experiência (ex.: idioma, região, ordenação preferida).</p>
            <p><strong>Base legal (LGPD):</strong> Consentimento do titular (art. 7º, I).</p>
            <p><strong>Prazo de armazenamento:</strong> Até 12 meses.</p>
            <p><strong>Terceiros:</strong> Nenhum.</p>
          </Section>

          <Section title="Cookies de Preferências" optional>
            <p><strong>Finalidade:</strong> preservar configurações de acessibilidade (alto contraste, tamanho de fonte) além do período de sessão.</p>
            <p><strong>Base legal (LGPD):</strong> Consentimento do titular (art. 7º, I).</p>
            <p><strong>Prazo de armazenamento:</strong> Até 12 meses.</p>
            <p><strong>Terceiros:</strong> Nenhum.</p>
          </Section>

          <Section title="Cookies de Marketing / Publicidade" optional badge="AdSense">
            <p><strong>Finalidade:</strong> exibir anúncios contextuais (Google AdSense) para sustentação financeira do aplicativo independente.</p>
            <p><strong>Base legal (LGPD):</strong> Consentimento do titular (art. 7º, I).</p>
            <p><strong>Prazo de armazenamento:</strong> Até 13 meses (geridos pelo Google).</p>
            <p><strong>Terceiros:</strong> Google LLC - consulte a <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Política de Privacidade do Google</a>.</p>
            <p className="text-amber-700 font-semibold flex items-center gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> Sem o seu consentimento, nenhum script do AdSense é carregado.</p>
          </Section>
        </section>

        {/* Prazo e terceiros */}
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 text-base">3. Prazo de Armazenamento e Terceiros</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-200 px-3 py-2 text-left font-bold">Categoria</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-bold">Prazo máx.</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-bold">Terceiro</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Necessários',   'Sessão / 12 meses', 'Nenhum'],
                  ['Analíticos',    '13 meses',           'Nenhum'],
                  ['Desempenho',    '6 meses',            'Nenhum'],
                  ['Funcionais',    '12 meses',           'Nenhum'],
                  ['Preferências',  '12 meses',           'Nenhum'],
                  ['Marketing',     '13 meses',           'Google LLC'],
                ].map(([cat, prazo, terceiro]) => (
                  <tr key={cat} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-3 py-2">{cat}</td>
                    <td className="border border-slate-200 px-3 py-2">{prazo}</td>
                    <td className="border border-slate-200 px-3 py-2">{terceiro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Como alterar */}
        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 text-base">4. Como Alterar ou Revogar Suas Preferências</h2>
          <p>Você pode alterar suas preferências de cookies a qualquer momento de duas formas:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Pelo botão <strong>"Configurar"</strong> no banner de cookies (reexibido clicando em "Configurar Cookies" na Central de Privacidade);</li>
            <li>Diretamente na <strong>Central de Privacidade</strong> → aba "Meus Consentimentos".</li>
          </ul>
          <p>Também é possível bloquear cookies diretamente nas configurações do seu navegador. Atenção: bloquear cookies necessários pode comprometer o funcionamento do aplicativo.</p>
        </section>

        {/* Status atual */}
        {prefs && (
          <section className="space-y-3">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" /> 5. Suas Preferências Atuais
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                ['Necessários',  prefs.essencial],
                ['Analíticos',   prefs.analitico],
                ['Desempenho',   prefs.desempenho],
                ['Funcionais',   prefs.funcional],
                ['Preferências', prefs.preferencias],
                ['Marketing',    prefs.marketing],
              ].map(([label, val]) => (
                <div key={String(label)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${val ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <CheckCircle className={`w-3.5 h-3.5 shrink-0 ${val ? 'text-emerald-600' : 'text-slate-300'}`} />
                  {String(label)}
                </div>
              ))}
            </div>

            {saved && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" /> Preferências salvas com sucesso!
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button onClick={handleAcceptAll} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Aceitar Todos
              </button>
              <button onClick={handleRejectOptional} className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                Apenas Necessários
              </button>
            </div>
          </section>
        )}

        {/* Contato */}
        <section className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <h2 className="font-bold text-slate-900 text-base">6. Contato</h2>
          <p>Dúvidas sobre esta política:&nbsp;
            <button
              onClick={() => { setContatoOrigin('Política de Cookies', 'Dúvida sobre Política de Cookies'); onSelectTab('contato'); }}
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              Formulário de Contato →
            </button>
          </p>
          <p>Encarregado de Proteção de Dados (DPO): <strong>Paflegis - Equipe de Privacidade</strong></p>
        </section>

      </div>
    </div>
  );
};
