import React from 'react';
import { FileText, Shield, AlertTriangle, BookOpen, Scale } from 'lucide-react';
import { setContatoOrigin } from '../lib/contatoNavStore';

interface Props { onSelectTab: (tab: string) => void; }

const Sec: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="space-y-2">
    <h2 className="font-bold text-slate-900 text-base">{n}. {title}</h2>
    <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">{children}</div>
  </section>
);

export const TermosDeUsoView: React.FC<Props> = ({ onSelectTab }) => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-[#bae6fd] text-[#075985] flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Termos de Uso</h1>
          <p className="text-xs text-slate-500">Versão 1.0 - Julho de 2026 · Paflegis - Aplicativo Cívico Independente</p>
        </div>
      </div>

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
        <p>Ao utilizar o Paflegis, você declara ter lido, compreendido e concordado com todos os termos aqui descritos. Se não concordar, interrompa o uso imediatamente.</p>
      </div>

      <Sec n="1" title="Objeto do Aplicativo">
        <p>
          O <strong>Paflegis</strong> é um aplicativo cívico independente destinado à consulta e facilitação de acesso às informações legislativas públicas do Município de Pedro Afonso - TO, obtidas por meio da API pública do SAPL (Sistema de Apoio ao Processo Legislativo), nos termos da Lei nº 12.527/2011 (Lei de Acesso à Informação).
        </p>
        <p>
          O Paflegis <strong>não é</strong> o portal oficial da Câmara Municipal de Pedro Afonso - TO, não possui vínculo com qualquer órgão governamental e não exerce função deliberativa, normativa ou oficial.
        </p>
      </Sec>

      <Sec n="2" title="Responsabilidades do Usuário">
        <p>Ao utilizar o Paflegis, o usuário concorda em:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Utilizar o aplicativo apenas para fins lícitos e compatíveis com sua finalidade informativa;</li>
          <li>Não tentar burlar, invadir ou comprometer os sistemas de segurança do aplicativo;</li>
          <li>Não realizar raspagem (scraping) automatizada de dados em volume que prejudique a disponibilidade do serviço;</li>
          <li>Não reproduzir a interface ou o código do aplicativo sem autorização prévia;</li>
          <li>Verificar informações críticas diretamente no portal oficial antes de tomar decisões baseadas nos dados exibidos;</li>
          <li>Informar dados verdadeiros ao utilizar formulários de contato ou de exercício de direitos LGPD.</li>
        </ul>
      </Sec>

      <Sec n="3" title="Responsabilidades do Paflegis">
        <p>O Paflegis compromete-se a:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Manter o aplicativo disponível com razoável continuidade, sem garantia de disponibilidade ininterrupta;</li>
          <li>Exibir dados obtidos da fonte pública oficial (SAPL), sem manipulação ou edição de conteúdo;</li>
          <li>Tratar dados pessoais em conformidade com a LGPD e a Política de Privacidade;</li>
          <li>Não carregar cookies opcionais sem consentimento prévio do usuário;</li>
          <li>Responder solicitações LGPD em até 15 dias úteis;</li>
          <li>Comunicar alterações relevantes nos Termos de Uso por meio de aviso no aplicativo.</li>
        </ul>
      </Sec>

      <Sec n="4" title="Regras de Utilização">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <p className="font-bold text-emerald-800 flex items-center gap-1.5"><Shield className="w-4 h-4" />Permitido</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs text-emerald-900">
              <li>Consultar informações legislativas</li>
              <li>Acessar e baixar documentos públicos via links para o SAPL</li>
              <li>Compartilhar conteúdo público com indicação da fonte</li>
              <li>Usar o assistente de IA para dúvidas legislativas</li>
              <li>Exercer direitos LGPD via formulários</li>
            </ul>
          </div>
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
            <p className="font-bold text-red-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" />Vedado</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs text-red-900">
              <li>Reproduzir a interface sem autorização</li>
              <li>Scraping automatizado em volume excessivo</li>
              <li>Tentativas de invasão ou comprometimento de segurança</li>
              <li>Uso para fins ilícitos ou fraudulentos</li>
              <li>Apresentar dados do Paflegis como fonte oficial</li>
            </ul>
          </div>
        </div>
      </Sec>

      <Sec n="5" title="Propriedade Intelectual">
        <p>
          A marca, o logotipo, o design, o código-fonte e os textos originais do Paflegis são de propriedade intelectual de seus desenvolvedores e protegidos pela Lei nº 9.610/1998 (direitos autorais) e Lei nº 9.609/1998 (software).
        </p>
        <p>
          Os dados legislativos (matérias, normas, sessões, documentos) são de domínio público, de titularidade do órgão legislativo de Pedro Afonso - TO, reproduzidos no Paflegis com fundamento na LAI. Sua citação deve sempre indicar o órgão de origem.
        </p>
        <p>
          O assistente de IA utiliza a API do Google Gemini. As respostas geradas são de caráter informativo e não configuram produção intelectual original protegida.
        </p>
      </Sec>

      <Sec n="6" title="Limitações de Responsabilidade">
        <p>O Paflegis não se responsabiliza por:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Imprecisões ou atrasos nos dados provenientes do SAPL;</li>
          <li>Decisões tomadas com base nos dados exibidos sem consulta à fonte oficial;</li>
          <li>Conteúdo de sites externos acessados por links (YouTube, documentos PDF do SAPL etc.);</li>
          <li>Respostas do assistente de IA utilizadas como parecer jurídico;</li>
          <li>Falhas técnicas em dispositivos do usuário ou em sua conexão;</li>
          <li>Danos indiretos, incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso do aplicativo.</li>
        </ul>
      </Sec>

      <Sec n="7" title="Indisponibilidade do Serviço">
        <p>
          O Paflegis pode ser temporariamente indisponibilizado para manutenção, atualizações ou por causas externas (indisponibilidade da API do SAPL, falhas de infraestrutura, força maior). O Paflegis não garante disponibilidade mínima de serviço e não será responsável por quaisquer perdas decorrentes de indisponibilidade.
        </p>
      </Sec>

      <Sec n="8" title="Assistente de Inteligência Artificial">
        <p>
          O assistente integrado ao Paflegis utiliza o modelo Google Gemini para responder dúvidas sobre o conteúdo legislativo público. O usuário está ciente de que:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>As respostas têm caráter exclusivamente informativo e <strong>não constituem parecer jurídico</strong>;</li>
          <li>O histórico de conversa não é armazenado além da sessão ativa;</li>
          <li>O serviço é provido pelo Google LLC e sujeito aos termos deste terceiro;</li>
          <li>O Paflegis não se responsabiliza por interpretações incorretas das respostas geradas pela IA.</li>
        </ul>
      </Sec>

      <Sec n="9" title="Privacidade e Cookies">
        <p>
          O tratamento de dados pessoais e cookies é regido pela <strong>Política de Privacidade</strong> e pela <strong>Política de Cookies</strong> do Paflegis, disponíveis neste aplicativo e incorporadas a estes Termos por referência, em conformidade com a Lei nº 13.709/2018 (LGPD).
        </p>
      </Sec>

      <Sec n="10" title="Atualização dos Termos">
        <p>
          Estes Termos podem ser alterados a qualquer momento. Alterações relevantes serão comunicadas por aviso no aplicativo. O uso continuado após a notificação implica aceitação dos novos termos. Versão atual: <strong>1.0 - Julho de 2026</strong>.
        </p>
      </Sec>

      <Sec n="11" title="Legislação Aplicável e Foro Competente">
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
          <Scale className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>Estes Termos são regidos pelas leis da República Federativa do Brasil, em especial:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-xs">
              <li>Lei nº 13.709/2018 - LGPD</li>
              <li>Lei nº 12.527/2011 - Lei de Acesso à Informação</li>
              <li>Lei nº 9.610/1998 - Direitos Autorais</li>
              <li>Lei nº 9.609/1998 - Software</li>
              <li>Marco Civil da Internet - Lei nº 12.965/2014</li>
            </ul>
            <p className="mt-2 font-semibold">Foro competente: Comarca de Pedro Afonso - TO, com renúncia a qualquer outro.</p>
          </div>
        </div>
      </Sec>

      <Sec n="12" title="Contato">
        <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-800 mb-1">Paflegis - Aplicativo Cívico Independente</p>
            <p>Dúvidas sobre estes Termos ou sobre privacidade:</p>
            <button
              onClick={() => { setContatoOrigin('Termos de Uso', 'Dúvida sobre Termos de Uso'); onSelectTab('contato'); }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors"
            >
              Acessar formulário de contato →
            </button>
          </div>
        </div>
      </Sec>

    </div>
  </div>
);
