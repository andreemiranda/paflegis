import React from 'react';
import { ShieldCheck, Mail, Clock, Lock, Users, Database, FileCheck } from 'lucide-react';
import { setContatoOrigin } from '../lib/contatoNavStore';

interface Props { onSelectTab: (tab: string) => void; }

const Sec: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="space-y-2">
    <h2 className="font-bold text-slate-900 text-base">{n}. {title}</h2>
    <div className="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">{children}</div>
  </section>
);

const Table: React.FC<{ rows: string[][] }> = ({ rows }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs border-collapse">
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
            {row.map((cell, j) => (
              <td key={j} className={`border border-slate-200 px-3 py-2 ${j === 0 ? 'font-bold text-slate-800 w-1/3' : 'text-slate-600'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const PoliticaPrivacidadeView: React.FC<Props> = ({ onSelectTab }) => (
  <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-slate-700 text-xs sm:text-sm leading-relaxed">

      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Política de Privacidade</h1>
          <p className="text-xs text-slate-500">Última atualização: Julho de 2026 · Em conformidade com a Lei nº 13.709/2018 (LGPD)</p>
        </div>
      </div>

      <Sec n="1" title="Apresentação e Compromisso">
        <p>
          O <strong>Paflegis</strong> é um aplicativo cívico independente dedicado à consulta de informações legislativas públicas do Município de Pedro Afonso - TO. Comprometemo-nos com a transparência, a privacidade e a proteção dos dados pessoais dos usuários, em conformidade plena com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) e com as diretrizes da Autoridade Nacional de Proteção de Dados (ANPD).
        </p>
        <p>Esta política descreve quais dados coletamos, como os utilizamos, por quanto tempo os retemos e quais são seus direitos como titular.</p>
      </Sec>

      <Sec n="2" title="Identificação do Controlador">
        <Table rows={[
          ['Nome',         'Paflegis - Aplicativo Cívico Independente'],
          ['Natureza',     'Pessoa jurídica de direito privado / Desenvolvedor independente'],
          ['Finalidade',   'Facilitação de acesso a informações legislativas públicas de Pedro Afonso - TO'],
          ['Contato DPO',  'privacidade@paflegis.com'],
          ['Encarregado',  'Equipe de Privacidade - Paflegis'],
          ['Horário',      'Seg–Sex, 08h–18h (horário de Brasília)'],
        ]} />
      </Sec>

      <Sec n="3" title="Dados Públicos e Lei de Acesso à Informação">
        <p>
          Todas as informações legislativas exibidas - matérias, leis, decretos, atas e sessões - são obtidas via API pública do SAPL de Pedro Afonso - TO, amparadas pela Lei nº 12.527/2011 (LAI). Tais dados são de domínio público e não constituem dados pessoais nos termos do art. 5º, I da LGPD.
        </p>
      </Sec>

      <Sec n="4" title="Categorias de Dados Coletados e Finalidades">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <Database className="w-4 h-4 text-blue-600" />, title: 'Dados de Navegação', items: ['Páginas acessadas', 'Tempo de permanência', 'Tipo de dispositivo e navegador', 'Resolução de tela'] },
            { icon: <Lock className="w-4 h-4 text-emerald-600" />, title: 'Dados de Preferências', items: ['Consentimentos de cookies', 'Histórico de consentimento', 'Configurações de acessibilidade', 'Preferências de exibição'] },
            { icon: <Users className="w-4 h-4 text-violet-600" />, title: 'Dados Fornecidos Voluntariamente', items: ['Nome e e-mail (formulário de contato ao DPO)', 'Mensagem de solicitação', 'Protocolo de solicitação gerado'] },
            { icon: <FileCheck className="w-4 h-4 text-amber-600" />, title: 'Dados Técnicos (Cookies)', items: ['Cookies necessários (localStorage)', 'Cookies analíticos (com consentimento)', 'Cookies de marketing - AdSense (com consentimento)'] },
          ].map(cat => (
            <div key={cat.title} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <p className="font-bold text-slate-800 flex items-center gap-1.5">{cat.icon}{cat.title}</p>
              <ul className="list-disc pl-4 space-y-0.5 text-xs text-slate-600">
                {cat.items.map(i => <li key={i}>{i}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">O Paflegis <strong>não coleta</strong> dados sensíveis (saúde, biometria, origem racial, convicções religiosas ou políticas, dados de crianças).</p>
      </Sec>

      <Sec n="5" title="Bases Legais para o Tratamento (Art. 7º LGPD)">
        <Table rows={[
          ['Tratamento',                      'Base Legal',                                  'Artigo'],
          ['Cookies necessários',             'Legítimo interesse',                          'Art. 7º, IX'],
          ['Preferências de acessibilidade',  'Legítimo interesse',                          'Art. 7º, IX'],
          ['Cookies analíticos',              'Consentimento do titular',                    'Art. 7º, I'],
          ['Cookies de desempenho',           'Consentimento do titular',                    'Art. 7º, I'],
          ['Cookies funcionais',              'Consentimento do titular',                    'Art. 7º, I'],
          ['Cookies de marketing (AdSense)',  'Consentimento do titular',                    'Art. 7º, I'],
          ['Formulário de contato DPO',       'Consentimento / Exercício regular de direitos', 'Art. 7º, I e VI'],
          ['Logs de auditoria LGPD',          'Cumprimento de obrigação legal',              'Art. 7º, II'],
          ['Dados legislativos (SAPL)',        'Execução de políticas públicas / LAI',        'Art. 7º, III e LAI'],
        ]} />
      </Sec>

      <Sec n="6" title="Forma de Coleta">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Automaticamente:</strong> cookies de sessão armazenados no localStorage do navegador ao acessar o aplicativo.</li>
          <li><strong>Via consentimento:</strong> cookies analíticos, funcionais e de marketing carregados somente após autorização expressa.</li>
          <li><strong>Fornecimento voluntário:</strong> dados inseridos no formulário de contato ao DPO ou na Central de Privacidade.</li>
          <li><strong>Dados públicos (SAPL):</strong> obtidos via requisição à API oficial, sem qualquer dado pessoal do usuário.</li>
        </ul>
      </Sec>

      <Sec n="7" title="Tempo de Retenção">
        <Table rows={[
          ['Dado / Cookie',                  'Prazo de Retenção'],
          ['Consentimento LGPD (localStorage)', '12 meses ou até revogação'],
          ['Histórico de consentimentos',    '12 meses no dispositivo do usuário'],
          ['Configurações de acessibilidade','Até exclusão pelo usuário ou reset'],
          ['Dados analíticos',               'Até 13 meses'],
          ['Dados de marketing (AdSense)',   'Até 13 meses (geridos pelo Google)'],
          ['Formulário de contato DPO',      'Até 5 anos (obrigação legal de resposta)'],
          ['Logs de auditoria de consentimento', 'Até 5 anos'],
        ]} />
        <p>Transcorrido o prazo, os dados são eliminados ou anonimizados, salvo obrigação legal de retenção superior.</p>
      </Sec>

      <Sec n="8" title="Compartilhamento de Dados">
        <p>O Paflegis <strong>não comercializa, vende ou cede dados pessoais</strong> a terceiros. O compartilhamento ocorre apenas nos seguintes casos:</p>
        <Table rows={[
          ['Terceiro',     'Dado compartilhado',              'Finalidade',                   'Base Legal'],
          ['Google LLC',   'Cookies de navegação (AdSense)',  'Publicidade contextual',       'Consentimento (Art. 7º, I)'],
          ['Google LLC',   'Dados de uso (Gemini API)',       'Assistente de IA - consultas', 'Legítimo interesse / Contrato'],
          ['SAPL - Pedro Afonso', 'Nenhum (somente leitura)', 'Consulta de dados públicos',  'LAI / Art. 7º, III LGPD'],
        ]} />
        <p>Em caso de obrigação legal ou ordem judicial, dados poderão ser compartilhados com autoridades competentes, nos limites exigidos por lei.</p>
      </Sec>

      <Sec n="9" title="Armazenamento e Segurança">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <p className="font-bold text-emerald-800 flex items-center gap-2"><Lock className="w-4 h-4" />Medidas de Segurança Implementadas</p>
          <ul className="list-disc pl-5 space-y-1 text-emerald-900 text-xs">
            <li>Comunicação criptografada via HTTPS/TLS em toda a transmissão;</li>
            <li>Dados de preferências armazenados exclusivamente no localStorage do dispositivo do usuário (sem servidor);</li>
            <li>Nenhuma senha ou dado financeiro é coletado ou armazenado;</li>
            <li>Cabeçalhos de segurança HTTP configurados (X-Frame-Options, X-Content-Type-Options, Referrer-Policy);</li>
            <li>Scripts de terceiros (AdSense) carregados apenas após consentimento explícito;</li>
            <li>Assistente de IA (Gemini) não armazena histórico de conversas além da sessão ativa.</li>
          </ul>
        </div>
      </Sec>

      <Sec n="10" title="Direitos do Titular (Art. 18 LGPD)">
        <p>Você tem direito a, a qualquer momento:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            ['Confirmação',        'Confirmar se realizamos tratamento de dados seus'],
            ['Acesso',             'Obter cópia dos dados tratados'],
            ['Correção',           'Solicitar correção de dados incompletos ou inexatos'],
            ['Eliminação',         'Solicitar exclusão de dados desnecessários'],
            ['Anonimização',       'Solicitar anonimização quando possível'],
            ['Portabilidade',      'Receber seus dados em formato estruturado'],
            ['Informação',         'Ser informado sobre compartilhamentos realizados'],
            ['Revogação',          'Revogar consentimento a qualquer momento'],
            ['Oposição',           'Opor-se a tratamento baseado em legítimo interesse'],
          ].map(([dir, desc]) => (
            <div key={dir} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 shrink-0">{dir}:</span>
              <span className="text-slate-600">{desc}</span>
            </div>
          ))}
        </div>
        <p>Para exercer seus direitos acesse a <strong>Central de Privacidade</strong> → aba "Direitos do Titular", ou use o formulário de contato abaixo. Respostas em até 15 dias úteis.</p>
        <button
          onClick={() => { setContatoOrigin('Política de Privacidade', 'Exercício de Direito LGPD'); onSelectTab('contato'); }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline underline-offset-2 hover:text-blue-900 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" /> Ir para a página de Contato →
        </button>
      </Sec>

      <Sec n="11" title="Contato do Encarregado (DPO)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <Users className="w-4 h-4 text-blue-600" />, label: 'Encarregado (DPO)', value: 'Equipe de Privacidade - Paflegis' },
            { icon: <Mail className="w-4 h-4 text-blue-600" />, label: 'Contato', value: 'Formulário de Contato →' },
            { icon: <Clock className="w-4 h-4 text-blue-600" />, label: 'Horário', value: 'Seg–Sex, 08h–18h (Brasília)' },
            { icon: <Clock className="w-4 h-4 text-blue-600" />, label: 'Prazo de Resposta', value: 'Até 15 dias úteis (art. 18, §3º LGPD)' },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
              <div className="mt-0.5 shrink-0">{item.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-semibold text-slate-800">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Sec>

      <Sec n="12" title="Alterações desta Política">
        <p>Esta política pode ser atualizada a qualquer momento. Alterações relevantes serão comunicadas por meio de aviso no próprio aplicativo. A data da última atualização é sempre indicada no cabeçalho. Recomendamos revisão periódica.</p>
        <p><strong>Versão atual:</strong> 1.0 - Julho de 2026.</p>
      </Sec>

      <Sec n="13" title="Legislação Aplicável e Foro">
        <p>Esta política é regida pelas leis da República Federativa do Brasil, especialmente pela Lei nº 13.709/2018 (LGPD) e pela Lei nº 12.527/2011 (LAI). Fica eleito o foro da Comarca de Pedro Afonso - TO para dirimir eventuais litígios.</p>
      </Sec>

    </div>
  </div>
);
