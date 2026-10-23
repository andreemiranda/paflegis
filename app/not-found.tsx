import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <h1 className="display-4 fw-bold text-primary mb-3">404</h1>
        <h2 className="h4 fw-semibold text-dark mb-3">Página Não Encontrada</h2>
        <p className="text-muted mx-auto mb-4" style={{ maxWidth: 500 }}>
          O recurso ou página legislativa solicitada não foi encontrada ou foi movida.
        </p>
        <Link href="/" className="btn btn-primary px-4">
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
