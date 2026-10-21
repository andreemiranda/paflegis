'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | string)[] = [];
  const maxButtons = 5;

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Navegação de páginas" className="d-flex justify-content-center my-4">
      <ul className="pagination pagination-sm flex-wrap justify-content-center shadow-sm">
        <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
          <button
            className="page-link d-flex align-items-center gap-1"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Página anterior"
          >
            <ChevronLeft size={16} />
            <span className="d-none d-sm-inline">Anterior</span>
          </button>
        </li>

        {pages.map((p, idx) =>
          p === '...' ? (
            <li key={`ellipsis-${idx}`} className="page-item disabled">
              <span className="page-link">...</span>
            </li>
          ) : (
            <li key={`page-${p}`} className={`page-item ${p === currentPage ? 'active' : ''}`}>
              <button
                className="page-link"
                onClick={() => onPageChange(Number(p))}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </button>
            </li>
          )
        )}

        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link d-flex align-items-center gap-1"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Próxima página"
          >
            <span className="d-none d-sm-inline">Próxima</span>
            <ChevronRight size={16} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
