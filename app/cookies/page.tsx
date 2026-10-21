import React from 'react';
import Link from 'next/link';
import { Cookie, ShieldCheck, Check } from 'lucide-react';

export const metadata = {
  title: 'Política de Cookies',
  description: 'Entenda como e por que o Paflegis utiliza cookies.',
};

export default function CookiesPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold small mb-2">
              Transparência no Uso de Cookies
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Política de Cookies</h1>
            <p className="text-muted small mb-0">
              Versão 1.0 · Última atualização: Julho de 2026
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. O que são Cookies?</h4>
              <p className="text-muted small lh-lg">
                Cookies são pequenos arquivos de texto armazenados no navegador do usuário para memorizar preferências, garantir a segurança da sessão e otimizar o desempenho do aplicativo.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Categorias Utilizadas no Paflegis</h4>
              <div className="table-responsive">
                <table className="table table-bordered small">
                  <thead className="table-light">
                    <tr>
                      <th>Categoria</th>
                      <th>Finalidade</th>
                      <th>Obrigatório?</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="fw-bold">Estritamente Necessários</td>
                      <td>Segurança, integridade da sessão e memorização do consentimento.</td>
                      <td><span className="badge bg-primary">Sim</span></td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Preferências & Acessibilidade</td>
                      <td>Memorização do modo de alto contraste e escala tipográfica.</td>
                      <td><span className="badge bg-secondary">Opcional</span></td>
                    </tr>
                    <tr>
                      <td className="fw-bold">Analíticos & Desempenho</td>
                      <td>Estatísticas anônimas de visualizações de matérias para otimizar o cache.</td>
                      <td><span className="badge bg-secondary">Opcional</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">3. Como Alterar suas Preferências</h4>
              <p className="text-muted small lh-lg mb-3">
                Você pode gerenciar ou revogar seus consentimentos de cookies a qualquer momento através da nossa Central de Privacidade.
              </p>
              <Link href="/privacidade/central" className="btn btn-outline-primary btn-sm">
                Gerenciar Preferências na Central &rarr;
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
