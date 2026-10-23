'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na aplicação:', error);
  }, [error]);

  return (
    <div className="container py-5 text-center">
      <div className="card p-4 p-md-5 border-0 shadow-sm mx-auto my-5" style={{ maxWidth: 540 }}>
        <h2 className="h4 fw-bold text-danger mb-3">Ocorreu um erro inesperado</h2>
        <p className="text-muted small mb-4">
          Não foi possível carregar as informações solicitadas no momento.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <button onClick={() => reset()} className="btn btn-primary btn-sm px-3">
            Tentar novamente
          </button>
          <Link href="/" className="btn btn-outline-secondary btn-sm px-3">
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
}
