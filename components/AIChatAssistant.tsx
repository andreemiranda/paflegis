'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Trash2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/sapl/client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isOutOfScope?: boolean;
}

export default function AIChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o Assistente Virtual do Paflegis. Posso tirar dúvidas sobre projetos de lei, normas jurídicas, atas e sessões plenárias de Pedro Afonso - TO. Como posso ajudar você hoje?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setErrorMsg('');

    try {
      const history = newMessages.slice(1, -1).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await api.sendChatMessage(text, history);

      if (res.error) {
        setErrorMsg(res.error);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Desculpe, ocorreu uma instabilidade: ${res.error}`,
          },
        ]);
      } else if (res.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: res.reply,
            isOutOfScope: res.isOutOfScope,
          },
        ]);
      }
    } catch (err: any) {
      setErrorMsg('Falha de conexão com o assistente.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Não foi possível obter resposta no momento. Por favor, tente novamente em instantes.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content:
          'Histórico limpo. Como posso ajudar você com informações legislativas de Pedro Afonso?',
      },
    ]);
    setErrorMsg('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="chat-widget-fab">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center p-3"
          style={{ width: 56, height: 56 }}
          aria-label={isOpen ? 'Fechar assistente virtual' : 'Abrir assistente virtual'}
          title="Assistente Legislativo IA"
        >
          {isOpen ? <X size={26} /> : <Bot size={26} />}
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-widget-window card border-0 shadow-lg d-flex flex-column overflow-hidden">
          {/* Header */}
          <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between py-2 px-3">
            <div className="d-flex align-items-center gap-2">
              <Bot size={20} />
              <div>
                <h6 className="mb-0 fs-6 fw-bold">Assistente Cívico IA</h6>
                <small className="text-white-50" style={{ fontSize: '0.7rem' }}>
                  Paflegis · Pedro Afonso
                </small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-1">
              <button
                onClick={handleClear}
                className="btn btn-sm btn-outline-light border-0 p-1"
                title="Limpar conversa"
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="btn btn-sm btn-outline-light border-0 p-1"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="card-body p-3 overflow-auto flex-grow-1 bg-light d-flex flex-column gap-3">
            <div className="alert alert-info border-0 p-2 small mb-1 text-dark" style={{ fontSize: '0.75rem' }}>
              <Sparkles size={14} className="text-primary me-1 inline" />
              Este assistente responde a dúvidas sobre matérias e normas de Pedro Afonso. Não substitui orientações jurídicas formais.
            </div>

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`d-flex ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                <div
                  className={`p-3 rounded-3 shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white text-dark border'
                  }`}
                  style={{ maxWidth: '85%', fontSize: '0.875rem', lineHeight: '1.45' }}
                >
                  {m.isOutOfScope && (
                    <div className="badge bg-warning text-dark mb-1 d-inline-flex align-items-center gap-1">
                      <AlertCircle size={12} /> Assunto fora do escopo legislativo
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="d-flex justify-content-start">
                <div className="bg-white border text-muted p-2 px-3 rounded-3 small d-flex align-items-center gap-2">
                  <RefreshCw size={14} className="spinner-border spinner-border-sm border-0" />
                  <span>Consultando dados legislativos...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form onSubmit={handleSend} className="card-footer bg-white p-2 border-top">
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-sm border-secondary border-opacity-25"
                placeholder="Pergunte sobre leis, projetos..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-sm btn-primary d-flex align-items-center justify-content-center px-3"
                disabled={isLoading || !input.trim()}
              >
                <Send size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
