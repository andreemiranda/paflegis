import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Clock, WifiOff, RotateCcw, Info, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  outOfScope?: boolean;
}

const WELCOME_MESSAGE = 'Olá! Sou o Assistente do Paflegis 🏛️. Posso ajudar você a encontrar informações sobre matérias legislativas, normas jurídicas e sessões plenárias. Como posso ajudar?';

const SESSION_KEY = 'paflegis_chat_messages';

function loadMessagesFromSession(): Message[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Message[];
  } catch {
    // ignore corrupt data
  }
  return [];
}

// Pool completo de sugestões — 3 são sorteadas localmente ao abrir o chat, sem chamada à API
const ALL_SUGGESTION_CHIPS = [
  'O que é uma matéria legislativa?',
  'Como funciona uma sessão plenária?',
  'Quais tipos de normas jurídicas existem?',
  'O que é um Projeto de Lei?',
  'Como consultar as leis aprovadas?',
  'O que são Sessões Extraordinárias?',
  'Como funciona o processo legislativo?',
  'Qual a diferença entre Lei Ordinária e Decreto?',
  'O que é uma Indicação legislativa?',
  'O que é uma Moção na Câmara?',
  'Como acompanhar uma matéria em tramitação?',
  'O que é uma norma jurídica municipal?',
];

function sampleChips(n = 3): string[] {
  return [...ALL_SUGGESTION_CHIPS].sort(() => Math.random() - 0.5).slice(0, n);
}

export function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => loadMessagesFromSession());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const [isNetworkError, setIsNetworkError] = useState(false);
  const [suggestionChips, setSuggestionChips] = useState<string[]>(() => sampleChips());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Persiste mensagens no sessionStorage sempre que mudam
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages));
    } catch {
      // ignore quota errors
    }
  }, [messages]);

  // Inicializa mensagem de boas-vindas e sorteia chips ao abrir
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
      setSuggestionChips(sampleChips()); // novo sorteio local a cada abertura
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  /**
   * Função unificada de envio — usada pelo botão, pelo Enter e pelos chips.
   * Bloqueia em TODOS os pontos de entrada se `loading` for true.
   */
  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return; // guard central — cobre botão, Enter e chip

      const userMsg: Message = { role: 'user', content: trimmed };
      // Captura histórico ANTES de atualizar state para evitar race condition
      const historySnapshot = messages.map(m => ({ role: m.role, content: m.content }));

      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setLoading(true);
      setError(null);
      setIsRateLimit(false);
      setIsServiceUnavailable(false);
      setIsNetworkError(false);

      try {
        let res: Response;
        try {
          res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: trimmed, history: historySnapshot }),
          });
        } catch {
          setIsNetworkError(true);
          throw new Error('Sem conexão com o servidor. Verifique sua internet e tente novamente.');
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 429) {
            setIsRateLimit(true);
          } else if (res.status === 503) {
            setIsServiceUnavailable(true);
          }
          throw new Error(data.error || `Erro ${res.status}`);
        }

        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, outOfScope: !!data.outOfScope }]);
      } catch (err: any) {
        setError(err.message || 'Erro ao conectar com o assistente. Tente novamente.');
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const sendMessage = useCallback(() => {
    sendText(input);
  }, [sendText, input]);

  const handleChipClick = useCallback(
    (chip: string) => {
      sendText(chip);
    },
    [sendText],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(); // chama sendMessage que chama sendText — mesmo guard
    }
  };

  const restartChat = useCallback(() => {
    if (loading) return;
    sessionStorage.removeItem(SESSION_KEY);
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE }]);
    setSuggestionChips(sampleChips());
    setInput('');
    setError(null);
    setIsRateLimit(false);
    setIsServiceUnavailable(false);
    setIsNetworkError(false);
  }, [loading]);

  const hasUserMessage = messages.some(m => m.role === 'user');

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente de IA'}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Painel de chat */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-2rem))] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-fade-in">

          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white">
            <Bot className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Assistente Paflegis</p>
            </div>
            <button
              onClick={restartChat}
              disabled={loading}
              aria-label="Apagar mensagens e reiniciar chat"
              title="Apagar mensagens / Reiniciar chat"
              className="flex items-center gap-1.5 text-xs bg-blue-700 hover:bg-blue-800 px-2.5 py-1.5 rounded-lg text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar chat</span>
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="p-1 rounded-full hover:bg-blue-500 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[400px] bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    {msg.role === 'user'
                      ? <User className="w-4 h-4 text-white" />
                      : <Bot className="w-4 h-4 text-slate-600" />
                    }
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
                {/* Nota de escopo — exibida abaixo de respostas fora do domínio da Câmara */}
                {msg.role === 'assistant' && msg.outOfScope && (
                  <div className="flex items-start gap-1.5 pl-9 pr-2">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-blue-500" />
                    <p className="text-xs text-blue-600 leading-snug">
                      Este assistente responde apenas sobre o Legislativo de Pedro Afonso&nbsp;- TO.
                    </p>
                  </div>
                )}
                {/* Chips de sugestão rexibidos após resposta fora do escopo */}
                {msg.role === 'assistant' && msg.outOfScope && i === messages.length - 1 && !loading && (
                  <div className="flex flex-wrap gap-2 pl-9 pt-1">
                    {suggestionChips.map(chip => (
                      <button
                        key={chip}
                        onClick={() => handleChipClick(chip)}
                        disabled={loading}
                        className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors text-left leading-snug disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Chips de sugestão — sorteados localmente, sem chamada à API */}
            {!hasUserMessage && !loading && (
              <div className="flex flex-wrap gap-2 pl-9">
                {suggestionChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors text-left leading-snug disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Indicador de carregamento */}
            {loading && (
              <div className="flex gap-2 flex-row">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-slate-200">
                  <Bot className="w-4 h-4 text-slate-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
              </div>
            )}

            {/* Mensagem de erro */}
            {error && (
              <div className={`flex items-start gap-2 rounded-lg px-3 py-2 border text-xs ${
                isNetworkError
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : isServiceUnavailable
                  ? 'bg-slate-100 border-slate-300 text-slate-600'
                  : isRateLimit
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-red-50 border-red-100 text-red-600 justify-center'
              }`}>
                {isNetworkError && <WifiOff className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                {isServiceUnavailable && !isNetworkError && <WifiOff className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                {isRateLimit && <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                <span>
                  {error}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre matérias, normas, sessões…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-28 overflow-y-auto disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ lineHeight: '1.4' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              aria-label="Enviar mensagem"
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
