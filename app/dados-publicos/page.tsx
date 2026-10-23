import React from 'react';
import Link from 'next/link';
import { Database, FileCheck, ExternalLink, Code2, Server } from 'lucide-react';
import EndpointsCatalog from '@/components/EndpointsCatalog';
import { getConfig } from '@/lib/config';

export async function generateMetadata() {
  const config = getConfig();
  return {
    title: `Dados Públicos & Licenciamento Aberto | ${config.siteName}`,
    description: `Catálogo completo dos endpoints da API pública e espelho nativo da ${config.orgName} com documentação de acesso aberto e interoperabilidade.`,
  };
}

export default function DadosPublicosPage() {
  const config = getConfig();
  const apiBase = config.saplApiBase;
  const publicDomain = config.saplPublicDomain;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold small mb-2 border border-success border-opacity-25">
              Transparência Cívica & Dados Abertos
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Dados Públicos & Catálogo de Endpoints</h1>
            <p className="text-muted small mb-0">
              Conectado à API oficial de {config.orgName} ({config.orgCity} - {config.orgUf})
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5 mb-4">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Fundamento Legal</h4>
              <p className="text-muted small lh-lg">
                A disponibilização de informações públicas pelo {config.siteName} fundamenta-se na
                Constituição Federal de 1988 (Art. 5º, XXXIII), na Lei de Acesso à Informação (Lei
                Federal nº 12.527/2011) e na Lei da Transparência (Lei Complementar nº 131/2009).
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Formato e Interoperabilidade</h4>
              <p className="text-muted small lh-lg">
                O aplicativo consome diretamente a API pública REST do SAPL e disponibiliza endpoints
                nativos espelhados em <code>/api/*</code> e especificação OpenAPI 3.0 para fomentar pesquisas acadêmicas,
                jornalismo de dados e integrações tecnológicas cívicas.
              </p>
              <div className="p-3 bg-light rounded-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                <span className="small text-dark fw-medium">
                  Consulte a especificação OpenAPI interativa e documentação:
                </span>
                <div className="d-flex gap-2">
                  <Link href="/api-docs" className="btn btn-sm btn-outline-primary text-nowrap">
                    Documentação Swagger &rarr;
                  </Link>
                  <a href="/api/openapi.json" target="_blank" className="btn btn-sm btn-outline-secondary text-nowrap">
                    OpenAPI JSON
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">
                3. Catálogo Dinâmico de Endpoints do SAPL
              </h4>
              <p className="text-muted small lh-lg mb-3">
                Abaixo está a relação completa dos endpoints descobertos na raiz da API
                fonte pública conectada. Quaisquer referências ao IP de origem legado são automaticamente
                substituídas pelo domínio público seguro HTTPS (<code>{publicDomain}</code>) e pela base de API (
                <code>{apiBase}</code>).
              </p>

              <EndpointsCatalog apiBase={apiBase} publicDomain={publicDomain} />
            </section>

            <section className="mt-4 pt-3 border-top">
              <h4 className="fw-bold text-dark fs-5 mb-3">4. Licença de Software</h4>
              <p className="text-muted small lh-lg mb-0">
                O código que dá vida à interface e às rotas do {config.siteName} é licenciado sob a{' '}
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
