'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Award,
  Calendar,
  Users,
  Shield,
  ChevronRight,
  RefreshCw,
  User,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { normalizePhotoUrl } from '@/lib/urlUtils';
import {
  ApiMesaDiretora,
  ApiComposicaoMesa,
  ApiCargoMesa,
  ApiParlamentar,
} from '@/lib/sapl/parlamentaresData';

interface MesaCompleta {
  mesa: ApiMesaDiretora;
  membros: {
    composicaoId: number;
    cargoNome: string;
    parlamentarId: number;
    nome: string;
    nomeCompleto?: string;
    fotografia?: string;
    ativo: boolean;
  }[];
}

export default function MesaDiretoraPage() {
  const [mesas, setMesas] = useState<ApiMesaDiretora[]>([]);
  const [cargos, setCargos] = useState<ApiCargoMesa[]>([]);
  const [parlamentares, setParlamentares] = useState<ApiParlamentar[]>([]);
  const [composicoes, setComposicoes] = useState<ApiComposicaoMesa[]>([]);
  const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [mesasRes, cargosRes, parlRes, compRes] = await Promise.all([
        api.getMesasDiretoras(),
        api.getCargosMesa(),
        api.getAllParlamentares(),
        api.getComposicaoMesa(),
      ]);

      // Ordena mesas da mais recente para a mais antiga (pelo ID decrescente ou nome)
      const sortedMesas = [...mesasRes].sort((a, b) => b.id - a.id);
      setMesas(sortedMesas);
      setCargos(cargosRes);
      setParlamentares(parlRes);
      setComposicoes(compRes);

      if (sortedMesas.length > 0) {
        // Seleciona preferencialmente a mesa com "Atual" ou a primeira
        const atual = sortedMesas.find((m) => m.__str__?.includes('Atual')) || sortedMesas[0];
        setSelectedMesaId(atual.id);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar dados da Mesa Diretora da API SAPL.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mapas rápidos para junção
  const cargosMap = new Map<number, ApiCargoMesa>();
  cargos.forEach((c) => cargosMap.set(c.id, c));

  const parlMap = new Map<number, ApiParlamentar>();
  parlamentares.forEach((p) => parlMap.set(p.id, p));

  const activeMesa = mesas.find((m) => m.id === selectedMesaId) || mesas[0];

  // Membros da mesa ativa
  const membrosAtivos = composicoes
    .filter((c) => c.mesa_diretora === selectedMesaId)
    .map((c) => {
      const p = parlMap.get(c.parlamentar);
      const cargoObj = cargosMap.get(c.cargo);

      // Extrai nome do cargo
      let cargoNome = cargoObj?.descricao || cargoObj?.__str__ || 'Cargo Diretivo';
      if (!cargoNome && c.__str__) {
        const parts = c.__str__.split(' - ');
        if (parts.length > 1) cargoNome = parts[1];
      }

      // Extrai nome do parlamentar
      const nome = p?.nome_parlamentar || p?.nome_completo || (c.__str__ ? c.__str__.split(' - ')[0] : 'Vereador');

      return {
        composicaoId: c.id,
        cargoNome,
        parlamentarId: c.parlamentar,
        nome,
        nomeCompleto: p?.nome_completo,
        fotografia: p?.fotografia,
        ativo: p?.ativo ?? true,
        cargoOrdem: cargoObj?.id_ordenacao || 99,
      };
    })
    .sort((a, b) => a.cargoOrdem - b.cargoOrdem);

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small">
          <li className="breadcrumb-item">
            <Link href="/" className="text-decoration-none">Início</Link>
          </li>
          <li className="breadcrumb-item">
            <Link href="/parlamentares" className="text-decoration-none">Parlamentares</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Mesa Diretora
          </li>
        </ol>
      </nav>

      {/* Header Banner */}
      <div className="bg-white rounded-3 shadow-sm border p-4 mb-4">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary text-white px-2.5 py-1">Direção dos Trabalhos Legislativos</span>
              <span className="badge bg-light text-muted border">Mandato Anual Oficial (SAPL)</span>
            </div>
            <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <Award className="text-primary" /> Mesa Diretora da Câmara Municipal
            </h1>
            <p className="text-muted small mb-0">
              Composições anuais por sessão legislativa sincronizadas diretamente da API pública oficial.
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
              href="/parlamentares"
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2 text-nowrap"
            >
              <Users size={16} />
              <span>Ver Todos os Vereadores</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Seletor de Sessões Legislativas Anuais (Mesas Oficiais da API) */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-3">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <div className="small fw-semibold text-muted text-uppercase tracking-wider d-flex align-items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              <span>Selecione a Sessão Legislativa Anual (Mesa Oficial da API):</span>
            </div>
            <div className="small text-muted">
              {mesas.length} composição(ões) anual(is) registradas na API
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {mesas.map((m) => {
              const active = selectedMesaId === m.id;
              const isAtual = m.__str__?.includes('Atual');
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMesaId(m.id)}
                  className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5 transition ${
                    active
                      ? 'btn-primary shadow-sm text-white'
                      : 'btn-outline-secondary bg-white'
                  }`}
                >
                  <span>{m.__str__}</span>
                  {isAtual && (
                    <span className="badge bg-success ms-1 px-1.5 py-0.5 text-white" style={{ fontSize: '0.65rem' }}>
                      Em Exercício
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card p-5 text-center text-muted border-0 shadow-sm my-4">
          <RefreshCw size={32} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
          <span>Carregando composição oficial da Mesa Diretora da API SAPL...</span>
        </div>
      ) : activeMesa ? (
        <>
          {/* Destaque da Mesa Ativa */}
          <div className="card border-0 shadow-sm mb-4 bg-primary text-white">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                <div>
                  <span className="badge bg-white bg-opacity-25 text-white mb-2 fs-7 px-2.5 py-1">
                    {activeMesa.__str__?.includes('Atual') ? 'Mesa Diretora Atual' : 'Composição Registrada'}
                  </span>
                  <h2 className="h4 fw-bold mb-1 text-white">{activeMesa.__str__}</h2>
                  <p className="text-white-50 mb-0 small">
                    Mandato Anual Oficial conforme Regimento Interno da Câmara Municipal
                  </p>
                </div>
                <div className="bg-white bg-opacity-10 px-3 py-2 rounded-2 text-center">
                  <div className="h4 fw-bold mb-0">{membrosAtivos.length}</div>
                  <div className="small text-white-50">Membros da Mesa</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid com os Membros da Mesa Diretora e fotos oficiais Next.js Image */}
          {membrosAtivos.length > 0 ? (
            <div className="row g-4 mb-4">
              {membrosAtivos.map((membro) => {
                const photoSrc = normalizePhotoUrl(membro.fotografia);

                return (
                  <div key={membro.composicaoId} className="col-md-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100 overflow-hidden d-flex flex-column transition-hover">
                      {/* Foto oficial com Next.js Image otimizada /_next/image?url=... */}
                      <div className="position-relative w-100 bg-dark" style={{ height: 270 }}>
                        {photoSrc ? (
                          <Image
                            src={photoSrc}
                            alt={`${membro.cargoNome} - ${membro.nome}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            className="object-fit-cover"
                            referrerPolicy="no-referrer"
                            priority
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
                            background:
                              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)',
                          }}
                        />

                        {/* Cargo no topo */}
                        <div className="position-absolute top-0 start-0 p-2.5">
                          <span className="badge bg-primary text-white shadow-sm fw-semibold">
                            {membro.cargoNome}
                          </span>
                        </div>

                        {/* Nome do vereador na base */}
                        <div className="position-absolute bottom-0 start-0 w-100 p-3 text-white">
                          <h3 className="h6 fw-bold mb-0 text-white text-shadow">
                            {membro.nome}
                          </h3>
                          {membro.nomeCompleto && membro.nomeCompleto !== membro.nome && (
                            <div className="small text-white-50">{membro.nomeCompleto}</div>
                          )}
                        </div>
                      </div>

                      {/* Ação */}
                      <div className="card-body p-3 d-flex flex-column justify-content-between flex-grow-1">
                        <div className="small text-muted mb-2">
                          <strong>Cargo Regimental:</strong> {membro.cargoNome}
                        </div>

                        <Link
                          href={`/parlamentares/${membro.parlamentarId}`}
                          className="btn btn-sm btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
                        >
                          <span>Ver Perfil & Biografia Oficial</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card p-5 text-center text-muted border-0 shadow-sm mb-4">
              <Users size={36} className="mx-auto mb-2 text-muted" />
              <h5 className="fw-semibold text-dark">Nenhum membro vinculado a esta Mesa Diretora</h5>
              <p className="small mb-0">Os registros regimentais desta sessão estão em processamento no SAPL.</p>
            </div>
          )}
        </>
      ) : null}

      {/* Competências da Mesa Diretora */}
      <div className="card border-0 shadow-sm p-4 bg-light rounded-3 mb-4">
        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
          <Shield className="text-primary" size={20} /> Competências Regimentais da Mesa Diretora
        </h5>
        <div className="row g-3 small text-secondary">
          <div className="col-md-4">
            <div className="bg-white p-3 rounded-2 border h-100">
              <strong className="text-dark d-block mb-1">Representação Institucional</strong>
              Representar formalmente o Poder Legislativo perante as demais instituições democráticas e munícipes.
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white p-3 rounded-2 border h-100">
              <strong className="text-dark d-block mb-1">Direção das Sessões</strong>
              Presidir as sessões plenárias, organizar a pauta do expediente e a ordem do dia das matérias e leis.
            </div>
          </div>
          <div className="col-md-4">
            <div className="bg-white p-3 rounded-2 border h-100">
              <strong className="text-dark d-block mb-1">Gestão Administrativa</strong>
              Ordenar despesas orçamentárias, zelar pelos atos oficiais e garantir o cumprimento do Regimento Interno.
            </div>
          </div>
        </div>
      </div>

      {/* Nota Oficial */}
      <div className="card border-0 bg-white p-3 rounded-3 text-muted small border">
        <div className="d-flex align-items-center gap-2">
          <ShieldCheck size={16} className="text-success flex-shrink-0" />
          <div>
            Dados da Mesa Diretora organizados estritamente pelo mandato anual da respectiva Sessão Legislativa, alimentados em tempo real pela API do SAPL.
          </div>
        </div>
      </div>
    </div>
  );
}
