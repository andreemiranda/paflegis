import React from 'react';
import { Scale, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { setContatoOrigin } from '../lib/contatoNavStore';

interface Props { onSelectTab: (tab: string) => void; }

const Block: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-2">
    <h2 className="font-bold text-slate-900 text-base">{title}</h2>
    <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">{children}</div>
  </section>
);

export const AvisoLegalView: React.FC<Props> = ({ onSelectTab }) => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
          <Scale className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Aviso Legal</h1>
          <p className="text-xs text-slate-500">Natureza institucional, limitações de responsabilidade e propriedade intelectual - Paflegis</p>
        </div>
      </div>

      {/* Alerta */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <p>
          O <strong>Paflegis</strong> é uma aplicação <strong>independente e cívica</strong>. Não é o portal oficial da Câmara Municipal de Pedro Afonso - TO nem de qualquer órgão governamental. Para informações oficiais, acesse diretamente <a href="https://sapl.pedroafonso.to.leg.br/" target="_blank" rel="noopener noreferrer" className="underline font-bold">sapl.pedroafonso.to.leg.br</a>.
        </p>
      </div>

      <Block title="1. Natureza Institucional do Aplicativo">
        <p>
          O Paflegis é um aplicativo desenvolvido de forma independente com o objetivo exclusivo de facilitar o acesso da população às informações legislativas públicas do Município de Pedro Afonso - TO. Trata-se de ferramenta cívica não oficial, sem vínculo com a Câmara Municipal, com o Poder Executivo Municipal ou com qualquer entidade governamental.
        </p>
        <p>
          Os dados exibidos são obtidos por meio da API pública do SAPL (Sistema de Apoio ao Processo Legislativo), disponibilizada pelo próprio órgão legislativo municipal, e são de domínio público, amparados pela Lei nº 12.527/2011 (Lei de Acesso à Informação).
        </p>
      </Block>

      <Block title="2. Finalidade Informativa">
        <p>
          Todas as informações disponibilizadas pelo Paflegis têm caráter estritamente informativo e de facilitação de consulta. O aplicativo não possui função deliberativa, normativa ou oficial. Nenhuma informação obtida neste aplicativo substitui consulta direta ao portal oficial ou à assessoria jurídica especializada.
        </p>
      </Block>

      <Block title="3. Limitações de Responsabilidade">
        <p>O Paflegis <strong>não se responsabiliza</strong> por:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Imprecisões, omissões ou atrasos nos dados provenientes do SAPL;</li>
          <li>Indisponibilidade temporária da API oficial, que impede a atualização dos dados exibidos;</li>
          <li>Decisões tomadas com base nas informações exibidas no aplicativo sem consulta ao portal oficial;</li>
          <li>Conteúdo de sites ou documentos externos acessados por links disponibilizados;</li>
          <li>Falhas técnicas em dispositivos do usuário ou em sua conexão de internet;</li>
          <li>Uso indevido das informações por terceiros.</li>
        </ul>
        <p>
          A responsabilidade pela autenticidade, completude e atualidade dos documentos legislativos é exclusiva do órgão público que os origina e mantém no SAPL.
        </p>
      </Block>

      <Block title="4. Disponibilidade dos Serviços">
        <p>
          O Paflegis empenha-se na disponibilidade contínua do aplicativo, porém não garante disponibilidade ininterrupta. Poderão ocorrer interrupções para manutenção, atualização ou em decorrência de fatores externos (indisponibilidade do SAPL, falhas de infraestrutura, força maior). O aplicativo reserva-se o direito de interromper, modificar ou encerrar os serviços a qualquer momento, sem aviso prévio.
        </p>
      </Block>

      <Block title="5. Responsabilidade sobre Conteúdo de Terceiros">
        <p>
          O aplicativo não coleta nem hospeda conteúdo enviado por usuários. Os documentos exibidos (PDFs, atas, pautas) são originados integralmente no SAPL e servidos pelo servidor oficial do órgão legislativo. O Paflegis atua exclusivamente como facilitador de acesso a dados já públicos.
        </p>
        <p>
          Links para o YouTube ou outras plataformas externas presentes nas sessões são fornecidos pelo próprio SAPL. O Paflegis não se responsabiliza pelo conteúdo dessas plataformas nem por suas políticas de privacidade.
        </p>
      </Block>

      <Block title="6. Propriedade Intelectual">
        <p>
          A interface, o código-fonte, o design, os textos originais e a marca Paflegis são de propriedade intelectual de seus desenvolvedores e protegidos pelas leis brasileiras de direito autoral (Lei nº 9.610/1998) e de software (Lei nº 9.609/1998).
        </p>
        <p>
          Os dados legislativos (matérias, normas, sessões, documentos) são de domínio público, pertencentes ao órgão legislativo de Pedro Afonso - TO, e reproduzidos neste aplicativo com fundamento na LAI e na natureza pública de tais informações. A reprodução total ou parcial da interface do Paflegis sem autorização expressa é vedada.
        </p>
      </Block>

      <Block title="7. Assistente de IA">
        <p>
          O assistente de IA integrado ao Paflegis é alimentado pela API do Google Gemini e tem finalidade exclusivamente informativa e de apoio à consulta legislativa. Suas respostas não constituem parecer jurídico, orientação legal ou opinião oficial. Recomenda-se sempre verificar as informações no portal oficial do SAPL ou consultar profissional habilitado.
        </p>
      </Block>

      <Block title="8. Cookies e Dados de Navegação">
        <p>
          O tratamento de dados de navegação é regido pela nossa <strong>Política de Privacidade</strong> e pela <strong>Política de Cookies</strong>, disponíveis neste aplicativo, em conformidade com a Lei nº 13.709/2018 (LGPD).
        </p>
      </Block>

      <Block title="9. Legislação Aplicável e Foro">
        <p>
          Este aviso legal é regido pelas leis da República Federativa do Brasil. Fica eleito o foro da Comarca de Pedro Afonso - TO para dirimir eventuais litígios decorrentes do uso do aplicativo, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
        </p>
      </Block>

      {/* Footer info */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
        <div>
          <p className="font-bold text-slate-800 mb-1">Paflegis - Aplicativo Cívico Independente</p>
          <p>Última atualização: Julho de 2026 · Em conformidade com a Lei nº 13.709/2018 (LGPD) e a Lei nº 12.527/2011 (LAI).</p>
          <p className="mt-1">Contato:&nbsp;
            <button
              onClick={() => { setContatoOrigin('Aviso Legal'); onSelectTab('contato'); }}
              className="text-blue-600 underline hover:text-blue-800 transition-colors"
            >
              Formulário de Contato →
            </button>
          </p>
        </div>
      </div>

    </div>
  </div>
);
