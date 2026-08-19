import React, { useState, useEffect, useRef } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { consumeContatoOrigin } from '../lib/contatoNavStore';
import { paflegisFetch } from '../lib/api/client';

type Estado = 'idle' | 'enviando' | 'sucesso' | 'erro';

interface FormData {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  origem: string;
  _hp: string; // honeypot — invisível para humanos
}

const ORIGENS = [
  'Contato Geral',
  'Política de Privacidade',
  'Termos de Uso',
  'Aviso Legal',
  'Política de Cookies',
  'Aviso de Dados Públicos',
  'Outro',
];

function validarEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

export const ContatoView: React.FC = () => {
  const pendente = consumeContatoOrigin();

  const [form, setForm] = useState<FormData>({
    nome:     '',
    email:    '',
    assunto:  pendente.assunto || '',
    mensagem: '',
    origem:   pendente.origem  || 'Contato Geral',
    _hp:      '',
  });
  const [erros, setErros] = useState<Partial<Record<keyof FormData, string>>>({});
  const [estado, setEstado] = useState<Estado>('idle');
  const [erroServidor, setErroServidor] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const topoRef = useRef<HTMLDivElement>(null);

  // Rola para o topo quando a view é montada
  useEffect(() => {
    topoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const set = (campo: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm(f => ({ ...f, [campo]: e.target.value }));
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: undefined }));
  };

  function validar(): boolean {
    const novos: Partial<Record<keyof FormData, string>> = {};
    if (!form.nome.trim())    novos.nome    = 'Nome é obrigatório.';
    if (!form.email.trim())   novos.email   = 'E-mail é obrigatório.';
    else if (!validarEmail(form.email)) novos.email = 'Formato de e-mail inválido.';
    if (!form.assunto.trim()) novos.assunto = 'Assunto é obrigatório.';
    if (!form.mensagem.trim()) novos.mensagem = 'Mensagem é obrigatória.';
    setErros(novos);
    return Object.keys(novos).length === 0;
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;
    setEstado('enviando');
    setErroServidor('');
    try {
      const res = await paflegisFetch('/api/v1/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({})) as { sucesso?: boolean; erro?: string; error?: string; protocolo?: string };
      if (res.ok && json.sucesso) {
        if (json.protocolo) {
          setProtocolo(json.protocolo);
        }
        setEstado('sucesso');
      } else {
        setErroServidor(json.erro || json.error || `Erro ao enviar mensagem (${res.status}). Tente novamente.`);
        setEstado('erro');
      }
    } catch (err: any) {
      setErroServidor(err?.message || 'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.');
      setEstado('erro');
    }
  }

  function reiniciar() {
    setForm({ nome: '', email: '', assunto: '', mensagem: '', origem: 'Contato Geral', _hp: '' });
    setErros({});
    setEstado('idle');
    setErroServidor('');
    setProtocolo('');
  }

  const campo = (
    id: keyof FormData,
    label: string,
    tipo: 'text' | 'email' | 'textarea',
    placeholder: string
  ) => (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
        {label} <span className="text-rose-500">*</span>
      </label>
      {tipo === 'textarea' ? (
        <textarea
          id={id}
          rows={5}
          value={form[id]}
          onChange={set(id)}
          placeholder={placeholder}
          disabled={estado === 'enviando'}
          className={`w-full border rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 transition-colors ${
            erros[id]
              ? 'border-rose-400 focus:ring-rose-300 bg-rose-50'
              : 'border-slate-300 focus:ring-blue-400 bg-white'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        />
      ) : (
        <input
          id={id}
          type={tipo}
          value={form[id]}
          onChange={set(id)}
          placeholder={placeholder}
          disabled={estado === 'enviando'}
          autoComplete={tipo === 'email' ? 'email' : 'off'}
          className={`w-full border rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
            erros[id]
              ? 'border-rose-400 focus:ring-rose-300 bg-rose-50'
              : 'border-slate-300 focus:ring-blue-400 bg-white'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        />
      )}
      {erros[id] && (
        <p className="text-xs text-rose-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {erros[id]}
        </p>
      )}
    </div>
  );

  return (
    <div ref={topoRef} className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 sm:p-7 shadow-sm space-y-2 border border-slate-800">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
          <Mail className="w-5 h-5" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Contato</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Entre em contato com a equipe do Paflegis. Responderemos em até <strong className="text-white">15 dias úteis</strong>.
        </p>
      </div>

      {/* Card principal */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7 shadow-sm">

        {/* Estado: Sucesso */}
        {estado === 'sucesso' && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Mensagem enviada!</h2>
              <p className="text-sm text-slate-600">
                Recebemos sua mensagem e responderemos em até 15 dias úteis.
              </p>
              {protocolo && (
                <p className="text-sm text-slate-600 font-bold mt-2">
                  Protocolo de atendimento: {protocolo}
                </p>
              )}
            </div>
            <button
              onClick={reiniciar}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Enviar outra mensagem
            </button>
          </div>
        )}

        {/* Estado: Erro do servidor */}
        {estado === 'erro' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold mb-1">Falha no envio</p>
                <p>{erroServidor}</p>
              </div>
            </div>
            <button
              onClick={() => setEstado('idle')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 underline underline-offset-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Estado: Formulário (idle ou enviando) */}
        {(estado === 'idle' || estado === 'enviando') && (
          <form onSubmit={enviar} noValidate className="space-y-5">

            {/* Honeypot — invisível para humanos, preenchido por bots */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
              <label htmlFor="_hp">Não preencha este campo</label>
              <input
                id="_hp"
                name="_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form._hp}
                onChange={set('_hp')}
              />
            </div>

            {/* Origem */}
            <div className="space-y-1">
              <label htmlFor="origem" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Assunto / Origem
              </label>
              <select
                id="origem"
                value={form.origem}
                onChange={set('origem')}
                disabled={estado === 'enviando'}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {campo('nome',  'Seu Nome',  'text',  'Maria Silva')}
              {campo('email', 'Seu E-mail', 'email', 'maria@exemplo.com')}
            </div>

            {campo('assunto', 'Assunto', 'text', 'Descreva brevemente o motivo do contato')}
            {campo('mensagem', 'Mensagem', 'textarea', 'Escreva sua mensagem aqui...')}

            <button
              type="submit"
              disabled={estado === 'enviando'}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold text-sm py-2.5 px-6 rounded-lg transition-colors shadow-sm"
            >
              {estado === 'enviando' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Mensagem
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              Seus dados serão usados exclusivamente para responder sua mensagem, conforme nossa{' '}
              <span className="underline">Política de Privacidade</span>.
            </p>
          </form>
        )}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 leading-relaxed space-y-1">
        <p className="font-bold">⚠️ Paflegis é um aplicativo cívico independente.</p>
      </div>

    </div>
  );
};
