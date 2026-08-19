import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições gerais de uso do aplicativo cívico Paflegis.',
};

export default function TermosPage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold small mb-2">
              Condições de Acesso e Uso
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Termos de Uso</h1>
            <p className="text-muted small mb-0">
              Versão 1.0 · Última atualização: Julho de 2026
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Aceitação dos Termos</h4>
              <p className="text-muted small lh-lg">
                Ao navegar ou interagir com o portal Paflegis, o usuário declara concordar com as regras e condições estabelecidas nestes Termos de Uso e nas demais políticas do aplicativo.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Objeto e Finalidade</h4>
              <p className="text-muted small lh-lg">
                O Paflegis é uma ferramenta de tecnologia cívica destinada exclusivamente a facilitar a consulta e o acompanhamento dos atos legislativos públicos da Câmara Municipal de Pedro Afonso - TO. O acesso às consultas públicas é 100% gratuito e irrestrito.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">3. Uso Aceitável</h4>
              <p className="text-muted small lh-lg mb-2">
                É vedado aos usuários e sistemas automatizados:
              </p>
              <ul className="text-muted small lh-lg ps-3 mb-0">
                <li>Realizar requisições abusivas que sobrecarreguem ou prejudiquem a disponibilidade dos servidores do Paflegis ou do SAPL oficial (ataques de negação de serviço).</li>
                <li>Utilizar o formulário de contato para envio de spam, fraudes ou mensagens ofensivas.</li>
                <li>Burlar mecanismos de autenticação de API e limites de taxa de requisições.</li>
              </ul>
            </section>

            <section>
              <h4 className="fw-bold text-dark fs-5 mb-3">4. Licenciamento</h4>
              <p className="text-muted small lh-lg mb-0">
                O código-fonte do Paflegis é distribuído como software livre sob os termos da licença MIT. Os dados públicos exibidos pertencem ao domínio público e à Câmara Municipal de Pedro Afonso.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
