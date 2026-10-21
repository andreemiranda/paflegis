import React from 'react';
import Link from 'next/link';
import { Landmark, Shield, Cpu, ExternalLink, HeartHandshake, Database, Code } from 'lucide-react';

export const metadata = {
  title: 'Sobre o Paflegis',
  description: 'Conheça o Paflegis, portal cívico e independente de transparência legislativa de Pedro Afonso - TO.',
};

export default function SobrePage() {
  return (
    <div className="container py-5">
      {/* Header */}
      <div className="text-center mb-5">
        <div className="bg-primary text-white p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3">
          <Landmark size={36} />
        </div>
        <h1 className="h2 fw-bold text-dark mb-2">Sobre o Paflegis</h1>
        <p className="lead text-muted mx-auto" style={{ maxWidth: 700 }}>
          Tecnologia cívica e transparência pública para aproximar o cidadão do Poder Legislativo de Pedro Afonso - TO.
        </p>
      </div>

      <div className="row g-4 mb-5">
        {/* Missão */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-primary bg-opacity-10 text-primary p-3 rounded-3">
                <HeartHandshake size={24} />
              </div>
              <h4 className="fw-bold text-dark mb-0 fs-5">Missão & Propósito</h4>
            </div>
            <p className="text-muted small lh-lg mb-3">
              O <strong>Paflegis</strong> é uma iniciativa cívica, independente e sem fins lucrativos que tem como objetivo simplificar, democratizar e acelerar o acesso às informações públicas da Câmara Municipal de Pedro Afonso.
            </p>
            <p className="text-muted small lh-lg mb-0">
              Acreditamos que o acesso fácil aos projetos de lei, indicações parlamentares e gravações das sessões plenárias fortalece a cidadania, estimula a participação social e aprimora o controle social da gestão pública.
            </p>
          </div>
        </div>

        {/* Independência */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-warning bg-opacity-10 text-warning p-3 rounded-3">
                <Shield size={24} />
              </div>
              <h4 className="fw-bold text-dark mb-0 fs-5">Declaração de Independência</h4>
            </div>
            <p className="text-muted small lh-lg mb-3">
              O Paflegis <strong>não possui qualquer vínculo oficial, institucional, partidário ou governamental</strong> com a Câmara Municipal de Pedro Afonso ou com a Prefeitura Municipal.
            </p>
            <p className="text-muted small lh-lg mb-0">
              Todas as informações exibidas são consumidas diretamente dos dados públicos abertos disponibilizados pelo Sistema de Apoio ao Processo Legislativo (SAPL) oficial, nos termos da Lei de Acesso à Informação (Lei Federal nº 12.527/2011).
            </p>
          </div>
        </div>
      </div>

      {/* Fontes & Stack */}
      <div className="row g-4 mb-5">
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-success bg-opacity-10 text-success p-3 rounded-3">
                <Database size={24} />
              </div>
              <h4 className="fw-bold text-dark mb-0 fs-5">Fontes Oficiais</h4>
            </div>
            <p className="text-muted small mb-3">
              Os dados são obtidos em tempo real ou por cache resiliente a partir do portal oficial:
            </p>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-4">
              <li className="d-flex align-items-center gap-2">
                <span className="badge bg-success">Oficial</span>
                <a
                  href={process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN || "https://sapl.pedroafonso.to.leg.br"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-decoration-none d-flex align-items-center gap-1"
                >
                  <span>SAPL - Câmara Municipal de Pedro Afonso - TO</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            </ul>
            <p className="small text-muted mb-0">
              Caso identifique divergências nas informações, a fonte primária oficial e soberana é o portal do SAPL.
            </p>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="bg-secondary bg-opacity-10 text-secondary p-3 rounded-3">
                <Code size={24} />
              </div>
              <h4 className="fw-bold text-dark mb-0 fs-5">Arquitetura & Tecnologia</h4>
            </div>
            <p className="text-muted small mb-3">
              Construído com tecnologia moderna e padrões de alta performance e acessibilidade:
            </p>
            <div className="row g-2 small">
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <strong>Framework:</strong> Next.js App Router
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <strong>Linguagem:</strong> TypeScript & React
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <strong>Interface:</strong> Bootstrap 5 & Lucide
                </div>
              </div>
              <div className="col-6">
                <div className="p-2 border rounded bg-light">
                  <strong>IA Cívica:</strong> Google Gemini 2.0 Flash
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="card bg-light border-0 shadow-sm p-4 text-center">
        <h5 className="fw-bold text-dark mb-2">Tem dúvidas ou sugestões para aprimorar o portal?</h5>
        <p className="text-muted small mb-3">Envie uma mensagem pelo canal de contato da plataforma cívica.</p>
        <div>
          <Link href="/contato" className="btn btn-primary px-4">
            Entrar em Contato
          </Link>
        </div>
      </div>
    </div>
  );
}
