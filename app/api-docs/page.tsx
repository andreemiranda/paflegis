'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Code, Terminal, Key, Database, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { copyToClipboard } from '@/lib/urlUtils';

export default function ApiDocsPage() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/materias',
      desc: 'Lista matérias legislativas com filtros de busca, tipo, ano e paginação.',
      params: '?busca=educacao&ano=2024&pagina=1&limite=10',
      curl: 'curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/materias?busca=educacao',
    },
    {
      method: 'GET',
      path: '/api/v1/materias/{id}',
      desc: 'Retorna os detalhes completos de uma matéria com tramitações e documentos anexos.',
      params: '/1234',
      curl: 'curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/materias/1234',
    },
    {
      method: 'GET',
      path: '/api/v1/normas',
      desc: 'Lista a legislação municipal (leis ordinárias, complementares, decretos).',
      params: '?tipo=1&ano=2024',
      curl: 'curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/normas?ano=2024',
    },
    {
      method: 'GET',
      path: '/api/v1/sessoes',
      desc: 'Lista sessões plenárias com links para pautas, atas e vídeos do YouTube.',
      params: '?ano=2024',
      curl: 'curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/sessoes?ano=2024',
    },
    {
      method: 'GET',
      path: '/api/v1/estatisticas',
      desc: 'Retorna o total consolidado de matérias, normas e sessões do município.',
      params: '',
      curl: 'curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/estatisticas',
    },
    {
      method: 'GET',
      path: '/api/v1/health',
      desc: 'Verifica a integridade do proxy, latência do SAPL e status do serviço de IA.',
      params: '',
      curl: 'curl https://paflegis.vercel.app/api/v1/health',
    },
  ];

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="bg-primary text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
          <Code size={32} />
        </div>
        <h1 className="h2 fw-bold text-dark mb-2">Documentação da API REST do Paflegis</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 680 }}>
          Integre dados legislativos normalizados e enriquecidos de Pedro Afonso ao seu aplicativo, dashboard ou portal cívico.
        </p>
      </div>

      {/* Auth Banner & Policy */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <div className="card border-primary border-opacity-25 bg-primary bg-opacity-10 h-100 p-4">
            <h5 className="fw-bold text-primary mb-2 d-flex align-items-center gap-2">
              <Key size={20} /> Autenticação por Cabeçalho
            </h5>
            <p className="small text-dark mb-3">
              Todas as requisições externas às rotas de dados <code>/api/v1/*</code> devem obrigatoriamente incluir o cabeçalho <code>x-api-key</code>.
            </p>
            <div className="bg-dark text-light p-3 rounded-3 small font-monospace">
              x-api-key: SUA_CHAVE_DE_PARCEIRO
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-success border-opacity-25 bg-success bg-opacity-10 h-100 p-4">
            <h5 className="fw-bold text-success mb-2 d-flex align-items-center gap-2">
              <ShieldCheck size={20} /> Solicitação de Chaves
            </h5>
            <p className="small text-dark mb-3">
              Para obter uma chave gratuita de desenvolvedor ou parceiro cívico, basta solicitar pelo formulário de contato selecionando a opção correspondente.
            </p>
            <div>
              <Link href="/contato" className="btn btn-sm btn-success">
                Solicitar Chave de API &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* OpenAPI JSON link */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold text-dark mb-0 fs-5">Endpoints Disponíveis</h4>
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
        >
          <ExternalLink size={14} /> <span>Ver Especificação OpenAPI (JSON)</span>
        </a>
      </div>

      {/* Endpoints List */}
      <div className="d-flex flex-column gap-3 mb-5">
        {endpoints.map((ep, idx) => (
          <div key={idx} className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary px-2 py-1">{ep.method}</span>
                  <code className="fs-6 text-dark fw-bold">{ep.path}</code>
                </div>
                <button
                  onClick={() => handleCopy(ep.curl, `ep-${idx}`)}
                  className="btn btn-sm btn-light border d-flex align-items-center gap-1"
                >
                  {copiedKey === `ep-${idx}` ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  <span>{copiedKey === `ep-${idx}` ? 'Copiado!' : 'Copiar cURL'}</span>
                </button>
              </div>

              <p className="text-muted small mb-3">{ep.desc}</p>

              <div className="bg-dark text-white-50 p-3 rounded-3 small font-monospace overflow-auto">
                <span className="text-success">$</span> {ep.curl}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
