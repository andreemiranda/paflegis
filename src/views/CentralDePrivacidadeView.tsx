import React, { useState, useEffect } from 'react';
import {
  Shield, FileText, Cookie, Scale, BookOpen, Settings,
  History, Mail, CheckCircle, Download, Trash2, Send,
  AlertCircle, Users, Lock, RotateCcw, ChevronRight,
} from 'lucide-react';
import {
  getStoredPreferences, savePreferences, getConsentHistory,
  clearPreferences, exportPreferences, saveRightsRequest,
  getRightsRequests, ConsentPreferences, ConsentRecord, RightsRequest,
} from '../lib/consentManager';

type Tab = 'documentos' | 'consentimentos' | 'direitos' | 'historico' | 'dpo';

interface NavTabProps { id: Tab; current: Tab; icon: React.ReactNode; label: string; onClick: (t: Tab) => void }
const NavTab: React.FC<NavTabProps> = ({ id, current, icon, label, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
      current === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon}<span className="hidden sm:inline">{label}</span>
  </button>
);

// ── Documentos ──────────────────────────────────────────────────────────────
const DocLink: React.FC<{ icon: React.ReactNode; title: string; desc: string; onClick: () => void }> = ({ icon, title, desc, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">{icon}</div>
      <div>
        <p className="font-bold text-slate-800 text-xs">{title}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
  </button>
);

// ── Toggle de consentimento ─────────────────────────────────────────────────
const Toggle: React.FC<{ label: string; desc: string; value: boolean; fixed?: boolean; onChange: (v: boolean) => void }> = ({ label, desc, value, fixed, onChange }) => (
  <div className="flex items-start justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50">
    <div className="min-w-0">
      <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
        {label}
        {fixed && <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded">Sempre Ativo</span>}
      </p>
      <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
    </div>
    <button
      disabled={fixed}
      onClick={() => onChange(!value)}
      className={`relative shrink-0 w-10 h-5 rounded-full transition-colors ${value ? 'bg-blue-600' : 'bg-slate-300'} ${fixed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

// ── Formulário de Direitos ───────────────────────────────────────────────────
const RIGHTS_TYPES = ['Acesso aos dados', 'Correção de dados', 'Exclusão de dados', 'Anonimização', 'Portabilidade', 'Revogação de consentimento', 'Oposição ao tratamento', 'Informação sobre compartilhamentos', 'Outro'];

// ── Componente principal ─────────────────────────────────────────────────────
export const CentralDePrivacidadeView: React.FC<{ onSelectTab?: (t: string) => void }> = ({ onSelectTab }) => {
  const [tab, setTab] = useState<Tab>('documentos');

  // Consentimentos
  const blankPrefs: Omit<ConsentPreferences, 'consentimento_definido'> = {
    essencial: true, analitico: false, desempenho: false, funcional: false, preferencias: false, marketing: false,
  };
  const stored = getStoredPreferences();
  const [prefs, setPrefs] = useState<Omit<ConsentPreferences, 'consentimento_definido'>>(
    stored ? { essencial: stored.essencial, analitico: stored.analitico, desempenho: stored.desempenho ?? false, funcional: stored.funcional ?? false, preferencias: stored.preferencias ?? false, marketing: stored.marketing } : blankPrefs,
  );
  const [savedMsg, setSavedMsg] = useState('');

  // Histórico
  const [history, setHistory] = useState<ConsentRecord[]>([]);
  useEffect(() => setHistory(getConsentHistory()), [tab]);

  // Direitos
  const [form, setForm] = useState({ type: RIGHTS_TYPES[0], name: '', email: '', message: '' });
  const [protocol, setProtocol] = useState('');
  const [formError, setFormError] = useState('');
  const [requests, setRequests] = useState<RightsRequest[]>([]);
  useEffect(() => setRequests(getRightsRequests()), [tab]);

  // DPO form
  const [dpo, setDpo] = useState({ name: '', email: '', subject: '', msg: '' });
  const [dpoSent, setDpoSent] = useState(false);

  const handleSavePrefs = (action: 'Personalizou' | 'Revogou' | 'Aceitou Todos' | 'Recusou') => {
    savePreferences(prefs, action);
    setSavedMsg('Preferências salvas!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'paflegis-privacidade.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (!window.confirm('Confirma a exclusão de todas as suas preferências e histórico de consentimento?')) return;
    clearPreferences();
    setPrefs(blankPrefs);
    setHistory([]);
    setSavedMsg('Dados apagados com sucesso.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSubmitRights = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setFormError('Preencha todos os campos obrigatórios.'); return;
    }
    const p = saveRightsRequest(form);
    setProtocol(p);
    setRequests(getRightsRequests());
    setForm({ type: RIGHTS_TYPES[0], name: '', email: '', message: '' });
    setFormError('');
  };

  const handleDpoSend = () => {
    if (!dpo.name.trim() || !dpo.email.trim() || !dpo.msg.trim()) return;
    setDpoSent(true);
    setDpo({ name: '', email: '', subject: '', msg: '' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">Central de Privacidade</h1>
            <p className="text-[11px] text-slate-500">Gerencie seus consentimentos e exerça seus direitos - Lei nº 13.709/2018 (LGPD)</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          <NavTab id="documentos"    current={tab} onClick={setTab} icon={<FileText className="w-4 h-4" />}   label="Documentos Legais" />
          <NavTab id="consentimentos" current={tab} onClick={setTab} icon={<Settings className="w-4 h-4" />}  label="Meus Consentimentos" />
          <NavTab id="direitos"      current={tab} onClick={setTab} icon={<Users className="w-4 h-4" />}     label="Direitos do Titular" />
          <NavTab id="historico"     current={tab} onClick={setTab} icon={<History className="w-4 h-4" />}   label="Histórico" />
          <NavTab id="dpo"           current={tab} onClick={setTab} icon={<Mail className="w-4 h-4" />}      label="Contato DPO" />
        </div>
      </div>

      {/* ── DOCUMENTOS ── */}
      {tab === 'documentos' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="font-bold text-slate-900 text-sm">Documentos Legais e de Privacidade</h2>
          <p className="text-xs text-slate-500">Acesse qualquer documento diretamente:</p>
          <div className="space-y-2">
            <DocLink icon={<Shield className="w-4 h-4 text-emerald-600" />} title="Política de Privacidade (LGPD)" desc="Tratamento de dados, base legal e direitos - versão 1.0/Jul 2026" onClick={() => onSelectTab?.('politica-de-privacidade')} />
            <DocLink icon={<FileText className="w-4 h-4 text-blue-600" />} title="Termos de Uso" desc="Regras e condições gerais de utilização do Paflegis" onClick={() => onSelectTab?.('termos-de-uso')} />
            <DocLink icon={<Cookie className="w-4 h-4 text-amber-600" />} title="Política de Cookies" desc="Categorias, finalidades, prazos e terceiros envolvidos" onClick={() => onSelectTab?.('politica-de-cookies')} />
            <DocLink icon={<Scale className="w-4 h-4 text-violet-600" />} title="Aviso Legal" desc="Natureza do aplicativo, limitações e propriedade intelectual" onClick={() => onSelectTab?.('aviso-legal')} />
            <DocLink icon={<BookOpen className="w-4 h-4 text-slate-600" />} title="Aviso de Dados Públicos (LAI)" desc="Origem dos dados e base na Lei de Acesso à Informação" onClick={() => onSelectTab?.('aviso-de-dados-publicos')} />
          </div>
        </div>
      )}

      {/* ── CONSENTIMENTOS ── */}
      {tab === 'consentimentos' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Minhas Preferências de Cookies</h2>
          <p className="text-xs text-slate-500">Ative ou desative cookies opcionais a qualquer momento. Suas alterações são salvas imediatamente.</p>

          <div className="space-y-2">
            <Toggle label="Cookies Necessários" desc="Essenciais ao funcionamento: consentimento LGPD, acessibilidade, navegação." value fixed onChange={() => {}} />
            <Toggle label="Cookies Analíticos" desc="Compreender padrões de uso para melhorar o aplicativo (dados anônimos)." value={prefs.analitico} onChange={v => setPrefs(p => ({ ...p, analitico: v }))} />
            <Toggle label="Cookies de Desempenho" desc="Medir tempos de carregamento e identificar erros técnicos." value={prefs.desempenho} onChange={v => setPrefs(p => ({ ...p, desempenho: v }))} />
            <Toggle label="Cookies Funcionais" desc="Recordar escolhas de ordenação e visualização." value={prefs.funcional} onChange={v => setPrefs(p => ({ ...p, funcional: v }))} />
            <Toggle label="Cookies de Preferências" desc="Preservar configurações de acessibilidade entre sessões." value={prefs.preferencias} onChange={v => setPrefs(p => ({ ...p, preferencias: v }))} />
            <Toggle label="Cookies de Marketing (AdSense)" desc="Anúncios contextuais do Google para sustentação do aplicativo independente." value={prefs.marketing} onChange={v => setPrefs(p => ({ ...p, marketing: v }))} />
          </div>

          {savedMsg && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />{savedMsg}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => { setPrefs({ essencial: true, analitico: true, desempenho: true, funcional: true, preferencias: true, marketing: true }); handleSavePrefs('Aceitou Todos'); }} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Aceitar Todos</button>
            <button onClick={() => handleSavePrefs('Personalizou')} className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">Salvar Preferências</button>
            <button onClick={() => { setPrefs(blankPrefs); handleSavePrefs('Recusou'); }} className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">Apenas Necessários</button>
            <button onClick={() => { setPrefs(blankPrefs); handleSavePrefs('Revogou'); }} className="text-red-600 hover:text-red-700 text-xs font-bold px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" />Revogar Todos</button>
          </div>

          {/* Exportar / Apagar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" />Exportar Preferências (JSON)
            </button>
            <button onClick={handleClear} className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Apagar Todos os Dados Locais
            </button>
          </div>
        </div>
      )}

      {/* ── DIREITOS DO TITULAR ── */}
      {tab === 'direitos' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Exercício de Direitos - Art. 18 da LGPD</h2>
            <p className="text-xs text-slate-500 mt-1">Você tem o direito de confirmar o tratamento, acessar, corrigir, eliminar, anonimizar, bloquear, portar, revogar consentimento e ser informado sobre compartilhamentos de dados.</p>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { icon: <Lock className="w-3.5 h-3.5" />, label: 'Confirmar Tratamento', desc: 'Verificar se processamos seus dados' },
              { icon: <FileText className="w-3.5 h-3.5" />, label: 'Acessar Dados', desc: 'Obter cópia dos dados tratados' },
              { icon: <CheckCircle className="w-3.5 h-3.5" />, label: 'Corrigir Dados', desc: 'Solicitar correção de imprecisões' },
              { icon: <Trash2 className="w-3.5 h-3.5" />, label: 'Excluir / Anonimizar', desc: 'Eliminar dados desnecessários' },
              { icon: <Download className="w-3.5 h-3.5" />, label: 'Portabilidade', desc: 'Receber dados em formato estruturado' },
              { icon: <RotateCcw className="w-3.5 h-3.5" />, label: 'Revogar Consentimento', desc: 'Encerrar tratamento baseado em consentimento' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">{item.icon}</div>
                <div>
                  <p className="font-bold text-slate-800">{item.label}</p>
                  <p className="text-slate-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formulário */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Formulário de Solicitação</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Tipo de Solicitação *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500">
                  {RIGHTS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nome completo *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Seu nome" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">E-mail *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="seuemail@exemplo.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Descrição da Solicitação *</label>
              <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} placeholder="Descreva sua solicitação com detalhes..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 resize-none" />
            </div>

            {formError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />{formError}
              </div>
            )}
            {protocol && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 shrink-0" />Solicitação registrada! Protocolo: <strong>{protocol}</strong>
              </div>
            )}

            <button onClick={handleSubmitRights} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              <Send className="w-3.5 h-3.5" />Enviar Solicitação
            </button>
          </div>

          {/* Protocolos anteriores */}
          {requests.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Solicitações Anteriores</h3>
              <div className="space-y-2">
                {requests.map(r => (
                  <div key={r.protocol} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{r.protocol}</p>
                      <p className="text-slate-500">{r.type} · {new Date(r.timestamp).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded">{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTÓRICO ── */}
      {tab === 'historico' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Histórico de Consentimentos</h2>
          <p className="text-xs text-slate-500">Registro de todas as suas interações de consentimento neste dispositivo, com hash de integridade.</p>

          {history.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Nenhum registro de consentimento encontrado neste dispositivo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold">Data/Hora</th>
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold">Ação</th>
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold">Dispositivo</th>
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold">Navegador</th>
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold">Versão Política</th>
                    <th className="border border-slate-200 px-2 py-2 text-left font-bold font-mono">Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="border border-slate-200 px-2 py-1.5">{new Date(r.timestamp).toLocaleString('pt-BR')}</td>
                      <td className="border border-slate-200 px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          r.action === 'Aceitou Todos' ? 'bg-emerald-100 text-emerald-800' :
                          r.action === 'Recusou'       ? 'bg-red-100 text-red-700' :
                          r.action === 'Revogou'       ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-800'
                        }`}>{r.action}</span>
                      </td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.device}</td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.browser}</td>
                      <td className="border border-slate-200 px-2 py-1.5">{r.policyVersion}</td>
                      <td className="border border-slate-200 px-2 py-1.5 font-mono text-[10px] text-slate-400">{r.hash}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CONTATO DPO ── */}
      {tab === 'dpo' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
          <h2 className="font-bold text-slate-900 text-sm">Encarregado de Proteção de Dados (DPO)</h2>

          {/* Card DPO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Responsável', value: 'Equipe de Privacidade - Paflegis' },
              { label: 'Cargo', value: 'Encarregado de Proteção de Dados (DPO)' },
              { label: 'E-mail', value: 'privacidade@paflegis.com' },
              { label: 'Horário de Atendimento', value: 'Seg–Sex, 08h–18h (Brasília)' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</p>
                <p className="text-xs font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
            <p className="font-bold mb-1">Prazo de Resposta</p>
            <p>Solicitações ao Encarregado serão respondidas em até <strong>15 dias úteis</strong>, conforme art. 18, § 3º da LGPD. Em casos de alta complexidade, o prazo poderá ser prorrogado por igual período, com justificativa ao titular.</p>
          </div>

          {/* Formulário */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Enviar Mensagem ao Encarregado</h3>

            {dpoSent ? (
              <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold">Mensagem enviada!</p>
                  <p className="font-normal mt-0.5">Responderemos em até 15 dias úteis no e-mail informado.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nome *</label>
                    <input value={dpo.name} onChange={e => setDpo(d => ({ ...d, name: e.target.value }))} placeholder="Seu nome completo" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">E-mail *</label>
                    <input type="email" value={dpo.email} onChange={e => setDpo(d => ({ ...d, email: e.target.value }))} placeholder="seuemail@exemplo.com" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Assunto</label>
                  <input value={dpo.subject} onChange={e => setDpo(d => ({ ...d, subject: e.target.value }))} placeholder="Ex: Solicitação de acesso a dados" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Mensagem *</label>
                  <textarea value={dpo.msg} onChange={e => setDpo(d => ({ ...d, msg: e.target.value }))} rows={4} placeholder="Descreva sua dúvida ou solicitação..." className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-slate-50 focus:outline-none focus:border-blue-500 resize-none" />
                </div>
                <button onClick={handleDpoSend} disabled={!dpo.name || !dpo.email || !dpo.msg} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                  <Send className="w-3.5 h-3.5" />Enviar ao Encarregado
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
