import React from 'react';
import Link from 'next/link';
import { Database, FileCheck, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'Dados Públicos & Licenciamento Aberto',
  description: 'Informações sobre abertura de dados públicos e transparência no Paflegis.',
};

export default function DadosPublicosPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill fw-semibold small mb-2 border border-success border-opacity-25">
              Transparência Cívica & Dados Abertos
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Dados Públicos & Licenciamento</h1>
            <p className="text-muted small mb-0">
              Versão 1.0 · Última atualização: Julho de 2026
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Fundamento Legal</h4>
              <p className="text-muted small lh-lg">
                A disponibilização de informações públicas pelo Paflegis fundamenta-se na Constituição Federal de 1988 (Art. 5º, XXXIII), na Lei de Acesso à Informação (Lei Federal nº 12.527/2011) e na Lei da Transparência (Lei Complementar nº 131/2009).
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Formato e Interoperabilidade</h4>
              <p className="text-muted small lh-lg">
                O Paflegis disponibiliza endpoints públicos normalizados em JSON e especificação OpenAPI 3.0 para fomentar pesquisas acadêmicas, jornalismo de dados e integrações tecnológicas cívicas.
              </p>
              <div className="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                <span className="small text-dark fw-medium">Consulte a documentação e solicite uma chave gratuita:</span>
                <Link href="/api-docs" className="btn btn-sm btn-outline-primary">
                  Documentação da API &rarr;
                </Link>
              </div>
            </section>

            <section>
              <h4 className="fw-bold text-dark fs-5 mb-3">3. Licença de Software</h4>
              <p className="text-muted small lh-lg mb-0">
                O código que dá vida à interface e às rotas do Paflegis é licenciado sob a <strong>MIT License</strong>, permitindo livre reutilização, auditoria e colaboração por qualquer membro da comunidade de desenvolvedores.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
