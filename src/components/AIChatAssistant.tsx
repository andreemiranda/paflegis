import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown, Clock, WifiOff } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimit, setIsRateLimit] = useState(false);
  const [isServiceUnavailable, setIsServiceUnavailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content:
            'Olá! Sou o Assistente do Paflegis 🏛️. Posso ajudar você a encontrar informações sobre matérias legislativas, normas jurídicas e sessões plenárias. Como posso ajudar?',
        },
      ]);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setIsRateLimit(false);
    setIsServiceUnavailable(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

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
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'Erro ao conectar com o assistente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChipClick = (text: string) => {
    if (loading) return;
    setInput(text);
    // Send immediately
    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    setIsRateLimit(false);
    setIsServiceUnavailable(false);

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 429) setIsRateLimit(true);
          else if (res.status === 503) setIsServiceUnavailable(true);
          throw new Error(data.error || `Erro ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      })
      .catch((err: any) => {
        setError(err.message || 'Erro ao conectar com o assistente. Tente novamente.');
      })
      .finally(() => setLoading(false));
  };

  const hasUserMessage = messages.some((m) => m.role === 'user');

  const SUGGESTION_CHIPS = [
    'O que é uma matéria legislativa?',
    'Como funciona uma sessão plenária?',
    'Quais tipos de normas jurídicas existem?',
  ];

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar assistente' : 'Abrir assistente de IA'}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-2rem))] flex flex-col rounded-2xl shadow-2xl border border-slate-200 bg-white overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
            <Bot className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Assistente Paflegis</p>
              <p className="text-xs text-blue-100 truncate">Paflegis</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="p-1 rounded-full hover:bg-blue-500 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[280px] max-h-[400px] bg-slate-50">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Suggestion chips - only shown before the user sends any message */}
            {!hasUserMessage && !loading && (
              <div className="flex flex-wrap gap-2 pl-9">
                {SUGGESTION_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors text-left leading-snug"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

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

            {error && (
              <div
                className={`flex items-start gap-2 rounded-lg px-3 py-2 border text-xs ${
                  isServiceUnavailable
                    ? 'bg-slate-100 border-slate-300 text-slate-600'
                    : isRateLimit
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-red-50 border-red-100 text-red-600 justify-center'
                }`}
              >
                {isServiceUnavailable && <WifiOff className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                {isRateLimit && <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre matérias, normas, sessões…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-28 overflow-y-auto"
              style={{ lineHeight: '1.4' }}
              disabled={loading}
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
