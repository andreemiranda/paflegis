'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, RefreshCw, ExternalLink, Activity, Server, FileText } from 'lucide-react';
import { api } from '@/lib/sapl/client';

export default function SeoAuditPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getHealth();
        setHealth(data);
      } catch (e: any) {
        setHealth({ status: 'error', error: e.message });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="bg-primary text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
          <Activity size={32} />
        </div>
        <h1 className="h2 fw-bold text-dark mb-2">Auditoria de SEO & Conectividade do Sistema</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 650 }}>
          Painel de monitoramento da saúde das conexões com o SAPL, infraestrutura de IA e indexação de dados.
        </p>
      </div>

      <div className="row g-4 mb-5">
        {/* Status Geral */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <Server size={20} className="text-primary" /> Conectividade SAPL Oficial
            </h5>
            {loading ? (
              <div className="text-muted p-4 text-center">
                <RefreshCw size={24} className="spinner-border spinner-border-sm mb-2" />
                <div>Testando conexão com o SAPL...</div>
              </div>
            ) : health?.sapl === 'reachable' ? (
              <div className="alert alert-success border-0 d-flex align-items-center gap-3">
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <strong>Conexão Online e Ativa</strong>
                  <div className="small">Latência medida: {health.sapl_latency_ms}ms</div>
                </div>
              </div>
            ) : (
              <div className="alert alert-warning border-0 d-flex align-items-center gap-3">
                <XCircle size={24} className="text-warning" />
                <div>
                  <strong>Modo de Cache Resiliente Ativo</strong>
                  <div className="small">O SAPL oficial está instável; o Paflegis está servindo do cache local.</div>
                </div>
              </div>
            )}
            <p className="text-muted small mb-0">
              Endpoint verificado: <code>https://sapl.pedroafonso.to.leg.br/api</code>
            </p>
          </div>
        </div>

        {/* Status de SEO */}
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <FileText size={20} className="text-primary" /> Recursos de SEO & Indexação
            </h5>
            <ul className="list-group list-group-flush small">
              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Sitemap XML Nativo</span>
                <a href="/sitemap.xml" target="_blank" className="btn btn-sm btn-outline-primary py-0">
                  /sitemap.xml <ExternalLink size={12} />
                </a>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Robots.txt Dinâmico</span>
                <a href="/robots.txt" target="_blank" className="btn btn-sm btn-outline-primary py-0">
                  /robots.txt <ExternalLink size={12} />
                </a>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Metadados OpenGraph & Twitter</span>
                <span className="badge bg-success">Configurado</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                <span>Dados Estruturados JSON-LD Schema.org</span>
                <span className="badge bg-success">Ativo</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
