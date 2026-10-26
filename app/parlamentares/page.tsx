'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  Search,
  Award,
  Calendar,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  FileText,
  User,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { normalizePhotoUrl } from '@/lib/urlUtils';
import { stripHtml } from '@/lib/stripMarkdown';
import {
  ApiParlamentar,
  ApiLegislatura,
  ApiMandato,
} from '@/lib/sapl/parlamentaresData';

export default function ParlamentaresPage() {
  const [parlamentares, setParlamentares] = useState<ApiParlamentar[]>([]);
  const [legislaturas, setLegislaturas] = useState<ApiLegislatura[]>([]);
  const [mandatos, setMandatos] = useState<ApiMandato[]>([]);
  const [selectedLegislaturaId, setSelectedLegislaturaId] = useState<string>('todas');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [legRes, mandRes, parlRes] = await Promise.all([
        api.getLegislaturas(),
        api.getMandatos(),
        api.getAllParlamentares(),
      ]);

      // Ordena legislaturas da mais recente para a mais antiga
      const sortedLeg = [...legRes].sort((a, b) => (b.numero || b.id) - (a.numero || a.id));
      setLegislaturas(sortedLeg);
      setMandatos(mandRes);
      setParlamentares(parlRes);

      // Define por padrão a legislatura mais recente (ou com "Atual")
      if (sortedLeg.length > 0 && selectedLegislaturaId === 'todas') {
        const atual = sortedLeg.find((l) => l.__str__?.includes('Atual') || l.data_fim?.startsWith('2028')) || sortedLeg[0];
        setSelectedLegislaturaId(String(atual.id));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados oficiais dos parlamentares da API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mapeia quais parlamentares pertencem a cada legislatura via tabela de mandatos
  const parlamentarMandatosMap = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const m of mandatos) {
      if (!map.has(m.parlamentar)) {
        map.set(m.parlamentar, new Set());
      }
      map.get(m.parlamentar)!.add(m.legislatura);
    }
    return map;
  }, [mandatos]);

  // Filtragem combinada por Legislatura e Busca
  const filteredVereadores = useMemo(() => {
    return parlamentares.filter((p) => {
      // Filtro de Legislatura
      if (selectedLegislaturaId !== 'todas') {
        const targetLegId = Number(selectedLegislaturaId);
        const legislaturasDoParlamentar = parlamentarMandatosMap.get(p.id);
        const temMandato = legislaturasDoParlamentar && legislaturasDoParlamentar.has(targetLegId);
        // Se a lista de mandatos ainda estiver vazia e for legislatura atual, checa p.ativo
        if (!temMandato && mandatos.length === 0) {
          if (!p.ativo) return false;
        } else if (!temMandato) {
          return false;
        }
      }

      // Filtro de Busca
      const termo = busca.trim().toLowerCase();
      if (!termo) return true;

      const nomeP = (p.nome_parlamentar || '').toLowerCase();
      const nomeC = (p.nome_completo || '').toLowerCase();
      const str = (p.__str__ || '').toLowerCase();
      const prof = (p.profissao || '').toLowerCase();

      return nomeP.includes(termo) || nomeC.includes(termo) || str.includes(termo) || prof.includes(termo);
    });
  }, [parlamentares, selectedLegislaturaId, busca, parlamentarMandatosMap, mandatos]);

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link href="/" className="text-decoration-none">Início</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Parlamentares
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white px-2.5 py-1">Poder Legislativo Municipal</span>
              <span className="badge bg-light text-muted border">Dados Oficiais da API SAPL</span>
            </div>
            <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <Users className="text-primary" /> Vereadores Municipais
            </h1>
            <p className="text-muted small mb-0">
              Galeria oficial alimentada em tempo real pela API de dados abertos da Câmara Municipal.
            </p>
          </div>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
              title="Atualizar dados da API"
            >
              <RefreshCw size={14} className={loading ? 'spinner-border spinner-border-sm' : ''} />
              <span>Atualizar</span>
            </button>
            <Link
              href="/mesa-diretora"
              className="btn btn-primary btn-sm d-flex align-items-center gap-1.5 text-nowrap"
            >
              <Award size={16} />
              <span>Ver Mesa Diretora Anual</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navegação por Legislaturas Oficiais da API */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div className="small fw-semibold text-muted text-uppercase tracking-wider d-flex align-items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              <span>Filtrar por Legislatura (API):</span>
            </div>
            <div className="small text-muted">
              Mostrando <strong className="text-primary">{filteredVereadores.length}</strong> parlamentar(es)
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {legislaturas.map((leg) => {
              const active = selectedLegislaturaId === String(leg.id);
              const isAtual = leg.__str__?.includes('Atual') || leg.data_fim?.startsWith('2028');
              return (
                <button
                  key={leg.id}
                  type="button"
                  onClick={() => setSelectedLegislaturaId(String(leg.id))}
                  className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5 transition ${
                    active
                      ? 'btn-primary shadow-sm text-white'
                      : 'btn-outline-secondary bg-white'
                  }`}
                >
                  <span>{leg.__str__ || `${leg.numero}ª Legislatura`}</span>
                  {isAtual && (
                    <span className="badge bg-success ms-1 px-1.5 py-0.5 text-white" style={{ fontSize: '0.65rem' }}>
                      Atual
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setSelectedLegislaturaId('todas')}
              className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5 transition ${
                selectedLegislaturaId === 'todas'
                  ? 'btn-primary shadow-sm text-white'
                  : 'btn-outline-secondary bg-white'
              }`}
            >
              <span>Todos os Parlamentares</span>
            </button>
          </div>
        </div>
      </div>

      {/* Busca */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white text-muted border-end-0">
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Pesquisar por nome do vereador ou profissão..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => setBusca('')}
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={32} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <span>Carregando dados oficiais e fotografias da API SAPL...</span>
        </div>
      ) : filteredVereadores.length > 0 ? (
        <div className="row g-4 mb-4">
          {filteredVereadores.map((p: ApiParlamentar) => {
            const photoSrc = normalizePhotoUrl(p.fotografia);
            const bioText = stripHtml(p.biografia || '');
            const nomeExibicao = p.nome_parlamentar || p.nome_completo || p.__str__;

            return (
              <div key={p.id} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 overflow-hidden d-flex flex-column transition-hover">
                  {/* Foto com Next.js Image otimizada /_next/image?url=... */}
                  <div className="position-relative w-100 bg-dark" style={{ height: 270 }}>
                    {photoSrc ? (
                      <Image
                        src={photoSrc}
                        alt={nomeExibicao}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-fit-cover"
                        referrerPolicy="no-referrer"
                        priority={p.id <= 4}
                      />
                    ) : (
                      <div className="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-primary bg-opacity-25 text-white">
                        <User size={64} className="opacity-50 mb-2" />
                        <span className="small text-white-50">Foto Oficial Não Cadastrada</span>
                      </div>
                    )}

                    <div
                      className="position-absolute top-0 start-0 w-100 h-100"
                      style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                      }}
                    />

                    {/* Status Badge */}
                    <div className="position-absolute top-0 end-0 p-2.5">
                      <span className={`badge ${p.ativo ? 'bg-success' : 'bg-secondary'} text-white shadow-sm small`}>
                        {p.ativo ? 'Em Exercício' : 'Mandato Anterior'}
                      </span>
                    </div>

                    {/* Nome sobreposto na foto */}
                    <div className="position-absolute bottom-0 start-0 w-100 p-3 text-white">
                      <div className="small text-white-50 mb-0 d-flex align-items-center gap-1">
                        <UserCheck size={14} className="text-success" />
                        <span>Câmara Municipal</span>
                      </div>
                      <h3 className="h5 fw-bold mb-0 text-white text-shadow">
                        {nomeExibicao}
                      </h3>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="card-body p-3.5 d-flex flex-column flex-grow-1">
                    {p.nome_completo && p.nome_completo !== nomeExibicao && (
                      <div className="small text-muted mb-2">
                        <strong>Nome civil:</strong> {p.nome_completo}
                      </div>
                    )}

                    {p.profissao && (
                      <div className="small text-muted mb-2">
                        <strong>Profissão:</strong> {p.profissao}
                      </div>
                    )}

                    {/* Biografia Oficial da API */}
                    <p className="text-secondary small mb-3 flex-grow-1 line-clamp-3">
                      {bioText || 'Biografia parlamentar oficial cadastrada no processo legislativo.'}
                    </p>

                    {/* Botões */}
                    <div className="pt-2 border-top d-flex gap-2 justify-content-between align-items-center">
                      <Link
                        href={`/parlamentares/${p.id}`}
                        className="btn btn-sm btn-primary d-flex align-items-center gap-1 flex-grow-1 justify-content-center"
                      >
                        <span>Biografia Oficial</span>
                        <ChevronRight size={15} />
                      </Link>
                      <Link
                        href={`/materias?busca=${encodeURIComponent(nomeExibicao)}`}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                        title="Ver matérias apresentadas"
                      >
                        <FileText size={14} />
                        <span className="d-none d-sm-inline">Matérias</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <Users size={36} className="mx-auto mb-2 text-muted" />
          <h5 className="fw-semibold text-dark">Nenhum parlamentar encontrado</h5>
          <p className="small mb-3">Tente ajustar o termo de busca ou selecione outra legislatura.</p>
        </div>
      )}

      {/* Nota de Governança e Transparência */}
      <div className="card border-0 bg-light p-3 rounded-3 text-muted small">
        <div className="d-flex align-items-center gap-2">
          <ShieldCheck size={16} className="text-success flex-shrink-0" />
          <div>
            Todas as fotos, biografias e mandatos são importados exclusivamente da API REST pública do SAPL, garantindo transparência pública com dados 100% autênticos e oficiais.
          </div>
        </div>
      </div>
    </div>
  );
}
