import React from 'react';
import { FileCheck, ExternalLink, ShieldCheck, Mail } from 'lucide-react';
import { setContatoOrigin } from '../lib/contatoNavStore';

interface Props { onSelectTab: (tab: string) => void; }

export const AvisoDadosPublicosView: React.FC<Props> = ({ onSelectTab }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Aviso de Dados Públicos e Natureza da Aplicação</h1>
            <p className="text-xs text-slate-500">Lei nº 12.527/2011 (Lei de Acesso à Informação)</p>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2 text-blue-950 font-medium text-xs sm:text-sm">
          <p className="font-bold text-blue-900">Esclarecimento Importante sobre a Plataforma:</p>
          <p>
            "Este aplicativo foi desenvolvido por <strong>Paflegis</strong> com o intuito exclusivo de facilitar e agilizar o acesso da população às informações legislativas públicas do município de Pedro Afonso - TO, disponibilizadas pelo SAPL. <strong>O Paflegis não é um portal oficial nem possui vínculo com qualquer órgão governamental</strong> - trata-se de uma ferramenta cívica independente sem qualquer afiliação institucional com o Poder Público."
          </p>
          <p>
            "O funcionamento do aplicativo fundamenta-se legalmente na Lei de Acesso à Informação (Lei nº 12.527/2011) e no fato de que a API disponibilizada pelo SAPL e os documentos legislativos nele contidos são de domínio público e de amplo interesse da sociedade."
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 text-base">Origem dos Dados e Integridade</h2>
          <p>
            O Paflegis não altera, edita ou modifica o conteúdo substancial de nenhuma matéria legislativa, lei, ata ou norma jurídica. Todos os links de arquivos e PDFs disponibilizados ("Ver Documento") apontam obrigatoriamente para o repositório público oficial mantido no domínio:
          </p>
          <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 break-all">
            https://sapl.pedroafonso.to.leg.br/
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-bold text-slate-900 text-base">Créditos Institucionais</h2>
          <p>
            Desenvolvido por <strong>Paflegis</strong>.
          </p>
        </section>

        <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
          <Mail className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-bold text-slate-800 mb-1">Dúvidas ou manifestações?</p>
            <p className="mb-2">Entre em contato com a equipe do Paflegis pelo formulário de contato.</p>
            <button
              onClick={() => { setContatoOrigin('Aviso de Dados Públicos', 'Dúvida sobre Dados Públicos'); onSelectTab('contato'); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
            >
              Ir para o Formulário de Contato →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
