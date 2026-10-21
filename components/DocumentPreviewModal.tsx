'use client';

import React from 'react';
import { X, ExternalLink, Download, FileText } from 'lucide-react';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function DocumentPreviewModal({ url, title, onClose }: Props) {
  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-xl h-100 py-3">
        <div className="modal-content border-0 shadow h-100 d-flex flex-column">
          <div className="modal-header bg-primary text-white py-2">
            <h5 className="modal-title fs-6 d-flex align-items-center gap-2 text-truncate me-3">
              <FileText size={18} />
              <span className="text-truncate">{title}</span>
            </h5>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                title="Abrir em nova aba"
              >
                <ExternalLink size={14} />
                <span className="d-none d-sm-inline">Nova Guia</span>
              </a>
              <a
                href={url}
                download
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                title="Baixar arquivo"
              >
                <Download size={14} />
                <span className="d-none d-sm-inline">Baixar</span>
              </a>
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Fechar"
              ></button>
            </div>
          </div>
          <div className="modal-body p-0 flex-grow-1 bg-secondary bg-opacity-10 d-flex flex-column">
            <iframe
              src={url}
              title={title}
              className="w-100 h-100 border-0 flex-grow-1"
              allow="fullscreen"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
