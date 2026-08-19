import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade',
  description: 'Conheça como o Paflegis protege seus dados pessoais e cumpre a LGPD.',
};

export default function PrivacidadePage() {
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          {/* Header */}
          <div className="mb-4 pb-3 border-bottom">
            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold small mb-2">
              Conformidade LGPD · Lei nº 13.709/2018
            </span>
            <h1 className="h2 fw-bold text-dark mb-2">Política de Privacidade</h1>
            <p className="text-muted small mb-0">
              Versão 1.0 · Última atualização: Julho de 2026
            </p>
          </div>

          <div className="card border-0 shadow-sm p-4 p-md-5 mb-4">
            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">1. Compromisso com a Privacidade</h4>
              <p className="text-muted small lh-lg">
                O <strong>Paflegis</strong> é uma plataforma cívica e independente comprometida com a transparência pública e com a proteção irrestrita da privacidade e dos dados pessoais de todos os cidadãos que utilizam seus serviços de consulta.
              </p>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">2. Dados Pessoais Tratados</h4>
              <p className="text-muted small lh-lg mb-2">
                O Paflegis opera sob o princípio da minimização da coleta de dados:
              </p>
              <ul className="text-muted small lh-lg ps-3 mb-0">
                <li><strong>Navegação Pública:</strong> Não é exigido nenhum tipo de cadastro, login ou identificação prévia para consultar matérias, leis ou sessões plenárias.</li>
                <li><strong>Formulário de Contato:</strong> Ao enviar uma mensagem, coletamos nome e e-mail exclusivamente com a finalidade de responder à sua solicitação.</li>
                <li><strong>Preferências de Acessibilidade:</strong> Suas configurações de alto contraste e tamanho de fonte são gravadas localmente no seu próprio navegador (LocalStorage), sem envio a servidores externos.</li>
              </ul>
            </section>

            <section className="mb-4">
              <h4 className="fw-bold text-dark fs-5 mb-3">3. Seus Direitos (Art. 18 da LGPD)</h4>
              <p className="text-muted small lh-lg mb-3">
                Você pode, a qualquer momento, confirmar a existência de tratamento, solicitar acesso, correção ou eliminação dos dados enviados por formulário através da nossa Central de Privacidade.
              </p>
              <div>
                <Link href="/privacidade/central" className="btn btn-outline-primary btn-sm">
                  Acessar Central de Privacidade LGPD &rarr;
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
