import React from 'react';
import Link from 'next/link';
import { Database, FileCheck, ExternalLink, Code2 } from 'lucide-react';
import EndpointsCatalog from '@/components/EndpointsCatalog';

export const metadata = {
  title: 'Dados Públicos & Licenciamento Aberto | Paflegis',
  description:
    'Catálogo completo dos 129 endpoints da API pública do SAPL de Pedro Afonso - TO com substituição de IP e documentação de acesso aberto.',
};

export default function DadosPublicosPage() {
  const apiBase =
    process.env.NEXT_PUBLIC_SAPL_API_BASE ||
    process.env.SAPL_API_BASE ||
    'https://sapl.pedroafonso.to.leg.br/api';
  const publicDomain =
    process.env.NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN ||
    process.env.SAPL_PUBLIC_DOMAIN ||
    'https://sapl.pedroafonso.to.leg.br';

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold small mb-2 border border-success border-opacity-25">
              Transparência Cívica & Dados Abertos
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Dados Públicos & Endpoints da API</h1>
            <p className="text-muted small mb-0">
              Versão 1.1 · Conectado à API oficial do SAPL de Pedro Afonso - TO
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5 mb-4">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Fundamento Legal</h4>
              <p className="text-muted small lh-lg">
                A disponibilização de informações públicas pelo Paflegis fundamenta-se na
                Constituição Federal de 1988 (Art. 5º, XXXIII), na Lei de Acesso à Informação (Lei
                Federal nº 12.527/2011) e na Lei da Transparência (Lei Complementar nº 131/2009).
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Formato e Interoperabilidade</h4>
              <p className="text-muted small lh-lg">
                O Paflegis consome diretamente a API pública REST do SAPL e disponibiliza endpoints
                normalizados em JSON e especificação OpenAPI 3.0 para fomentar pesquisas acadêmicas,
                jornalismo de dados e integrações tecnológicas cívicas.
              </p>
              <div className="p-3 bg-light rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <span className="small text-dark fw-medium">
                  Consulte a especificação OpenAPI interativa:
                </span>
                <Link href="/api-docs" className="btn btn-sm btn-outline-primary text-nowrap">
                  Documentação da API &rarr;
                </Link>
              </div>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">
                3. Catálogo dos 129 Endpoints Públicos do SAPL
              </h4>
              <p className="text-muted small lh-lg mb-3">
                Abaixo está a relação completa dos 129 endpoints disponibilizados na raiz da API
                fonte pública. Quaisquer referências ao IP de origem legado (
                <code>http://64.23.167.191</code>) são automaticamente substituídas pelo domínio
                oficial seguro HTTPS (<code>{publicDomain}</code>) e pela base de API (
                <code>{apiBase}</code>).
              </p>

              <EndpointsCatalog apiBase={apiBase} publicDomain={publicDomain} />
            </section>

            <section className="mt-4 pt-3 border-top">
              <h4 className="fw-bold text-dark fs-5 mb-3">4. Licença de Software</h4>
              <p className="text-muted small lh-lg mb-0">
                O código que dá vida à interface e às rotas do Paflegis é licenciado sob a{' '}
                <strong>MIT License</strong>, permitindo livre reutilização, auditoria e colaboração
                por qualquer membro da comunidade de desenvolvedores.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
