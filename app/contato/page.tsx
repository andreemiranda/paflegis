'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { consumeContatoOrigin } from '@/lib/contatoNavStore';

export default function ContatoPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('Dúvida sobre Matéria/Norma');
  const [origem, setOrigem] = useState('Página de Contato');
  const [mensagem, setMensagem] = useState('');
  const [hp, setHp] = useState(''); // Honeypot anti-spam

  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    const navOrigin = consumeContatoOrigin();
    if (navOrigin.origem) {
      setOrigem(navOrigin.origem);
    }
    if (navOrigin.assunto) {
      setAssunto(navOrigin.assunto);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !mensagem.trim()) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    setErro('');
    setSucesso(false);

    try {
      const res = await api.sendContato({
        nome: nome.trim(),
        email: email.trim(),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        origem,
        _hp: hp,
      });

      if (res.sucesso) {
        setSucesso(true);
        setProtocolo(res.protocolo || '');
        setNome('');
        setEmail('');
        setMensagem('');
      } else {
        setErro(res.erro || res.mensagem || 'Não foi possível enviar a mensagem. Tente novamente.');
      }
    } catch (err: any) {
      setErro(err.message || 'Erro de conexão ao enviar o formulário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="bg-primary text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
              <Mail size={32} />
            </div>
            <h1 className="h2 fw-bold text-dark mb-2">Canal de Contato & Sugestões</h1>
            <p className="text-muted mx-auto" style={{ maxWidth: 580 }}>
              Dúvidas sobre o funcionamento do portal, sugestões de melhorias cívicas ou solicitações de chaves para integração externa.
            </p>
          </div>

          {/* Success Card */}
          {sucesso && (
            <div className="card border-success bg-success bg-opacity-10 shadow-sm p-4 mb-4">
              <div className="d-flex align-items-start gap-3">
                <CheckCircle size={32} className="text-success flex-shrink-0 mt-1" />
                <div>
                  <h5 className="fw-bold text-success mb-1">Mensagem enviada com sucesso!</h5>
                  <p className="text-dark small mb-2">
                    Recebemos o seu contato. Caso tenhamos uma resposta relevante para sua mensagem, retornaremos no e-mail informado.
                  </p>
                  {protocolo && (
                    <div className="badge bg-success fs-6 px-3 py-2">
                      Protocolo de Atendimento: {protocolo}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {erro && (
            <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-danger flex-shrink-0" />
              <div>{erro}</div>
            </div>
          )}

          {/* Form Card */}
          <div className="card border-0 shadow-sm p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              {/* Honeypot */}
              <div style={{ display: 'none' }} aria-hidden="true">
                <input
                  type="text"
                  name="_hp"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">
                    Seu Nome Completo <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Maria Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">
                    Seu E-mail <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Ex: maria@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">
                  Assunto <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  required
                >
                  <option value="Dúvida sobre Matéria/Norma">Dúvida sobre Matéria / Norma</option>
                  <option value="Sugestão de Funcionalidade">Sugestão de Funcionalidade</option>
                  <option value="Reportar Erro ou Instabilidade">Reportar Erro ou Instabilidade</option>
                  <option value="Solicitação de Chave de API de Parceiro">Solicitação de Chave de API de Parceiro</option>
                  <option value="Exercício de Direitos LGPD">Exercício de Direitos LGPD (Privacidade)</option>
                  <option value="Outro Assunto">Outro Assunto</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">
                  Sua Mensagem <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Escreva sua dúvida, sugestão ou detalhe do requerimento..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg px-4 d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={18} className="spinner-border spinner-border-sm" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Enviar Mensagem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
