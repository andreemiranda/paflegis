import React from 'react';
import { Building2, ShieldCheck, Sparkles, FileText } from 'lucide-react';

export const SobreView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-sm space-y-2 border border-slate-800">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold">
          <Building2 className="w-5 h-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Sobre o Paflegis</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Plataforma independente de facilitação de acesso e consulta às informações legislativas de Pedro Afonso - TO.
        </p>
      </div>

      {/* Main Content Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-sm space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">
        <div className="space-y-2.5">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Missão e Propósito</span>
          </h2>
          <p>
            O <strong>Paflegis</strong> é um aplicativo e leitor cívico desenvolvido de forma independente para simplificar o acesso dos cidadãos do município de Pedro Afonso - TO às matérias, leis e sessões legislativas.
          </p>
          <p>
            Com interface leve, acessível e otimizada, o Paflegis consolida dados públicos abertos de <strong>Matérias Legislativas</strong>, <strong>Normas Jurídicas</strong> e <strong>Sessões Plenárias</strong> em um único ambiente de consulta intuitivo.
          </p>
          <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
            <strong>Natureza do Aplicativo:</strong> Esta ferramenta não constitui o portal oficial do governo nem do órgão legislativo. Trata-se de uma aplicação privada/cívica desenvolvida por Paflegis com o intuito de facilitar a pesquisa e a transparência pública, amparada pela Lei de Acesso à Informação (Lei 12.527/2011).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Domínio e Interesse Público</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              "Este aplicativo foi desenvolvido utilizando dados públicos obtidos mediante a API pública disponibilizada pelo SAPL de Pedro Afonso - TO. Os arquivos, leis e documentos aqui exibidos são de domínio público e de interesse de toda a sociedade, nos termos da Lei de Acesso à Informação."
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-xs sm:text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Conformidade com a LGPD</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              O Paflegis garante total respeito à privacidade e à proteção de dados (Lei 13.709/2018), com gestão transparente de consentimento de cookies e sem coleta não autorizada de dados pessoais.
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-1">
          <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Créditos de Desenvolvimento e Autoria</h3>
          <p className="text-xs text-slate-600">
            Desenvolvido por <strong>Paflegis</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

