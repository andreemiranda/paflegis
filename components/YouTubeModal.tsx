'use client';

import React from 'react';
import { X, ExternalLink, Video } from 'lucide-react';
import { getYouTubeVideoId, getYouTubeWatchUrl } from '@/lib/urlUtils';

interface Props {
  url: string;
  title: string;
  onClose: () => void;
}

export default function YouTubeModal({ url, title, onClose }: Props) {
  const videoId = getYouTubeVideoId(url);
  const watchUrl = getYouTubeWatchUrl(url) || url;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow">
          <div className="modal-header bg-dark text-white py-2">
            <h5 className="modal-title fs-6 d-flex align-items-center gap-2 text-truncate me-3">
              <Video size={18} className="text-danger" />
              <span className="text-truncate">{title}</span>
            </h5>
            <div className="d-flex align-items-center gap-2 ms-auto">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-light d-flex align-items-center gap-1"
                title="Assistir no YouTube"
              >
                <ExternalLink size={14} />
                <span className="d-none d-sm-inline">YouTube</span>
              </a>
              <button
                type="button"
                className="btn-close btn-close-white ms-2"
                onClick={onClose}
                aria-label="Fechar"
              ></button>
            </div>
          </div>
          <div className="modal-body p-0 bg-black">
            {videoId ? (
              <div className="ratio ratio-16x9">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-4 text-center text-white">
                <p className="mb-3">Não foi possível carregar o player integrado para este link.</p>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-danger d-inline-flex align-items-center gap-2"
                >
                  <ExternalLink size={16} /> Abrir vídeo em nova guia
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
