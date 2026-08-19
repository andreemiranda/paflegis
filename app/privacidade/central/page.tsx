'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Download, Trash2, CheckCircle, RefreshCw, Send, Lock } from 'lucide-react';
import {
  exportPreferences,
  clearPreferences,
  saveRightsRequest,
  getConsentHistory,
} from '@/lib/consentManager';
import { setContatoOrigin } from '@/lib/contatoNavStore';

export default function CentralPrivacidadePage() {
  const [tipoDireito, setTipoDireito] = useState('Acesso aos Dados');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [protocolo, setProtocolo] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [msgClear, setMsgClear] = useState(false);

  const handleExport = () => {
    const data = exportPreferences();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paflegis_dados_privacidade_${Date.now()}.json`;
    a.click();
  };

  const handleClear = () => {
    if (confirm('Deseja realmente redefinir todas as suas preferências salvas localmente?')) {
      clearPreferences();
      setMsgClear(true);
      setTimeout(() => setMsgClear(false), 3000);
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    const prot = saveRightsRequest({
      type: tipoDireito,
      name: nome.trim(),
      email: email.trim(),
      message: mensagem.trim(),
    });

    setProtocolo(prot);
    setSucesso(true);
    setNome('');
    setEmail('');
    setMensagem('');
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          {/* Header */}
          <div className="text-center mb-5">
            <div className="bg-primary text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
              <Shield size={32} />
            </div>
            <h1 className="h2 fw-bold text-dark mb-2">Central de Privacidade e Direitos do Titular</h1>
            <p className="text-muted mx-auto" style={{ maxWidth: 650 }}>
              Gerencie seus consentimentos, exporte seu histórico e exerça seus direitos garantidos pela LGPD (Lei nº 13.709/2018).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="row g-3 mb-5">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h5 className="fw-bold text-dark fs-6 mb-2 d-flex align-items-center gap-2">
                  <Download size={18} className="text-primary" /> Exportar Dados e Consentimentos
                </h5>
                <p className="small text-muted mb-3">
                  Baixe um arquivo JSON com todas as preferências de cookies e histórico de consentimento registrados no seu navegador.
                </p>
                <button onClick={handleExport} className="btn btn-sm btn-outline-primary mt-auto">
                  Baixar Meus Dados (JSON)
                </button>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card border-0 shadow-sm p-4 h-100">
                <h5 className="fw-bold text-dark fs-6 mb-2 d-flex align-items-center gap-2">
                  <Trash2 size={18} className="text-danger" /> Redefinir Preferências Locais
                </h5>
                <p className="small text-muted mb-3">
                  Limpe os cookies e permissões memorizadas para forçar a reexibição do aviso de consentimento.
                </p>
                <button onClick={handleClear} className="btn btn-sm btn-outline-danger mt-auto">
                  Limpar Preferências Locais
                </button>
              </div>
            </div>
          </div>

          {msgClear && (
            <div className="alert alert-success border-0 shadow-sm small py-2 mb-4">
              Preferências locais limpas com sucesso! Recarregue a página para rever o banner de consentimento.
            </div>
          )}

          {/* Form de Exercício de Direitos */}
          <div className="card border-0 shadow-sm p-4 p-md-5">
            <h4 className="fw-bold text-dark fs-5 mb-3 d-flex align-items-center gap-2">
              <Lock size={20} className="text-primary" /> Exercer Direitos do Titular (Art. 18 LGPD)
            </h4>
            <p className="text-muted small mb-4">
              Preencha o formulário abaixo para registrar formalmente uma solicitação de privacidade junto à equipe cívica do Paflegis.
            </p>

            {sucesso && (
              <div className="alert alert-success border-0 p-3 mb-4">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <CheckCircle size={18} className="text-success" />
                  <strong>Solicitação registrada com sucesso!</strong>
                </div>
                <div className="small">
                  Seu número de protocolo é: <strong className="text-success">{protocolo}</strong>.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmitRequest}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-dark">Tipo de Solicitação</label>
                <select
                  className="form-select"
                  value={tipoDireito}
                  onChange={(e) => setTipoDireito(e.target.value)}
                >
                  <option value="Acesso aos Dados">Acesso aos Meus Dados</option>
                  <option value="Correção de Dados">Correção de Dados Incompletos ou Inexatos</option>
                  <option value="Eliminação de Dados">Eliminação de Dados Pessoais de Contato</option>
                  <option value="Revogação de Consentimento">Revogação Formal de Consentimento</option>
                  <option value="Outra Solicitação LGPD">Outra Solicitação Específica</option>
                </select>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Seu Nome</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Seu nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-dark">Seu E-mail</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-dark">Detalhes da Solicitação</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Descreva detalhes adicionais para agilizar o atendimento..."
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                ></textarea>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary px-4 d-flex align-items-center gap-2">
                  <Send size={16} /> Enviar Requerimento LGPD
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
