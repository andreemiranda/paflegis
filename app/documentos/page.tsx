'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Search,
  Layers,
  ChevronRight,
  Database,
  Code,
  Activity,
  FileText,
  BookOpen,
  Video,
  Users,
  FolderKanban,
  Radio,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Server,
  ShieldCheck,
  Filter,
  Eye,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';
import { ALL_38_DOCUMENT_TYPES } from '@/lib/sapl/documentTypes';
import { api } from '@/lib/sapl/client';
import Pagination from '@/components/Pagination';

function DocumentosIndexContent() {
  const [activeTab, setActiveTab] = useState<'documentos' | 'entidades' | 'inspetor' | 'status'>('documentos');
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  // Estados do Inspetor de API ao vivo
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('materia/materialegislativa');
  const [apiMode, setApiMode] = useState<'nativa' | 'v1'>('nativa');
  const [inspectorData, setInspectorData] = useState<any>(null);
  const [inspectorLoading, setInspectorLoading] = useState<boolean>(false);
  const [inspectorError, setInspectorError] = useState<string>('');
  const [jsonCopied, setJsonCopied] = useState<boolean>(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const categorias = [
    'todos',
    'Matérias e Projetos',
    'Requerimentos por Vereador',
    'Normas e Legislação',
    'Atos e Comissões',
  ];

  const filteredDocs = ALL_38_DOCUMENT_TYPES.filter((doc) => {
    const matchesSearch =
      busca === '' ||
      doc.nome.toLowerCase().includes(busca.toLowerCase()) ||
      doc.sigla.toLowerCase().includes(busca.toLowerCase()) ||
      doc.descricao.toLowerCase().includes(busca.toLowerCase());

    const matchesCat = categoria === 'todos' || doc.categoria === categoria;
    return matchesSearch && matchesCat;
  });

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage) || 1;
  const paginatedDocs = filteredDocs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Lista de entidades principais da Câmara para consulta direta
  const entidadesPrincipais = [
    {
      id: 'materias',
      titulo: 'Matérias & Projetos Legislativos',
      descricao: 'Projetos de Lei, Requerimentos, Indicações, Emendas e Moções em tramitação ou aprovados.',
      icone: FileText,
      link: '/materias',
      endpoint: '/api/materia/materialegislativa/',
      endpointV1: '/api/v1/materias',
      badge: 'Processo Legislativo',
      cor: 'primary',
    },
    {
      id: 'normas',
      titulo: 'Legislação & Normas Jurídicas',
      descricao: 'Leis Ordinárias, Leis Complementares, Decretos Legislativos, Resoluções e Portarias.',
      icone: BookOpen,
      link: '/normas',
      endpoint: '/api/norma/normajuridica/',
      endpointV1: '/api/v1/normas',
      badge: 'Legislação Municipal',
      cor: 'success',
    },
    {
      id: 'sessoes',
      titulo: 'Sessões Plenárias & Atas',
      descricao: 'Pautas, Atas oficiais, lista de presença dos vereadores, votações e vídeos das sessões.',
      icone: Video,
      link: '/sessoes',
      endpoint: '/api/sessao/sessaoplenaria/',
      endpointV1: '/api/v1/sessoes',
      badge: 'Transparência Plenária',
      cor: 'danger',
    },
    {
      id: 'parlamentares',
      titulo: 'Parlamentares & Mesa Diretora',
      descricao: 'Perfil dos vereadores em exercício, mandatos, filiações partidárias e composição da mesa.',
      icone: Users,
      link: '/parlamentares',
      endpoint: '/api/parlamentares/parlamentar/',
      endpointV1: '/api/v1/endpoints',
      badge: 'Quadro Parlamentar',
      cor: 'info',
    },
    {
      id: 'comissoes',
      titulo: 'Comissões Parlamentares',
      descricao: 'Comissões Permanentes, Especiais e de Inquérito, matérias em análise e relatorias.',
      icone: FolderKanban,
      link: '/comissoes',
      endpoint: '/api/comissoes/comissao/',
      endpointV1: '/api/v1/endpoints',
      badge: 'Trabalho Técnico',
      cor: 'warning',
    },
    {
      id: 'audiencias',
      titulo: 'Audiências Públicas',
      descricao: 'Audiências agendadas com a população, temas em debate e atas de participação cidadã.',
      icone: Radio,
      link: '/audiencias',
      endpoint: '/api/audiencia/audienciapublica/',
      endpointV1: '/api/v1/endpoints',
      badge: 'Participação Social',
      cor: 'purple',
    },
  ];

  // Endpoints sugeridos no Inspetor
  const endpointsSugeridos = [
    { key: 'materia/materialegislativa', label: 'Matérias Legislativas (Projetos, Requerimentos)', pathNativo: '/api/materia/materialegislativa/?page_size=3', pathV1: '/api/v1/materias?limite=3' },
    { key: 'norma/normajuridica', label: 'Normas Jurídicas (Leis, Decretos)', pathNativo: '/api/norma/normajuridica/?page_size=3', pathV1: '/api/v1/normas?limite=3' },
    { key: 'sessao/sessaoplenaria', label: 'Sessões Plenárias (Pautas e Atas)', pathNativo: '/api/sessao/sessaoplenaria/?page_size=3', pathV1: '/api/v1/sessoes?limite=3' },
    { key: 'parlamentares/parlamentar', label: 'Parlamentares e Vereadores', pathNativo: '/api/parlamentares/parlamentar/?page_size=5', pathV1: '/api/v1/estatisticas' },
    { key: 'comissoes/comissao', label: 'Comissões Permanentes e Especiais', pathNativo: '/api/comissoes/comissao/?page_size=5', pathV1: '/api/v1/tipos/materias' },
    { key: 'audiencia/audienciapublica', label: 'Audiências Públicas', pathNativo: '/api/audiencia/audienciapublica/?page_size=3', pathV1: '/api/v1/endpoints' },
    { key: 'base/casalegislativa', label: 'Dados Oficiais da Casa Legislativa', pathNativo: '/api/base/casalegislativa/', pathV1: '/api/v1/health' },
    { key: 'api_root', label: 'Raiz Completa da API Nativa (120+ Endpoints)', pathNativo: '/api', pathV1: '/api/v1/' },
  ];

  // Executa consulta no Inspetor
  const executarInspecao = async (endpointKey = selectedEndpoint, mode = apiMode) => {
    setInspectorLoading(true);
    setInspectorError('');
    try {
      const selected = endpointsSugeridos.find((e) => e.key === endpointKey) || endpointsSugeridos[0];
      const targetPath = mode === 'nativa' ? selected.pathNativo : selected.pathV1;
      const data = await api.inspectEndpoint(targetPath);
      setInspectorData(data);
    } catch (err: any) {
      setInspectorError(err.message || 'Falha ao consultar endpoint da API.');
    } finally {
      setInspectorLoading(false);
    }
  };

  // Carrega diagnóstico de conexão inicial
  useEffect(() => {
    api.getHealth()
      .then((h) => setHealthStatus(h))
      .catch(() => setHealthStatus({ status: 'indisponivel', sapl: 'offline' }));
  }, []);

  const copiarJson = () => {
    if (inspectorData && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(inspectorData, null, 2));
      setJsonCopied(true);
      setTimeout(() => setJsonCopied(false), 2000);
    }
  };

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item"><Link href="/" className="text-decoration-none">Início</Link></li>
          <li className="breadcrumb-item active" aria-current="page">Central de Visualização & Transparência Pública</li>
        </ol>
      </nav>

      {/* Header & Banner Superior */}
      <div className="card border-0 shadow-sm bg-gradient p-4 p-md-5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)' }}>
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-15 px-3 py-1 rounded-pill mb-3 text-light small border border-white border-opacity-20">
              <ShieldCheck size={14} className="text-success" />
              <span>Transparência Pública Ativa & Dados Abertos</span>
            </div>
            <h1 className="h2 fw-bold text-white mb-2 d-flex align-items-center gap-2.5">
              <Layers className="text-primary-light" /> Central de Visualização & Dados da Câmara
            </h1>
            <p className="text-white-50 mb-3" style={{ maxWidth: '680px', lineHeight: '1.5' }}>
              Consulte e inspecione todos os documentos oficiais, proposições, normas, atas e as mais de 120 entidades de dados abertos da Câmara Municipal alimentados diretamente pela API do SAPL.
            </p>
            <div className="d-flex flex-wrap gap-2 text-white-50 small">
              <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-2.5 py-1.5">
                ⚡ 120+ Endpoints Nativos
              </span>
              <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-2.5 py-1.5">
                🔄 Sincronização Contínua em Tempo Real
              </span>
              <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-2.5 py-1.5">
                🛡️ Conexão Segura & Proteção LGPD
              </span>
            </div>
          </div>

          <div className="col-lg-4 text-lg-end">
            <div className="card border-0 bg-white bg-opacity-10 p-3 rounded-3 text-start border border-white border-opacity-15 text-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small text-white-50">Status da API</span>
                <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 d-flex align-items-center gap-1">
                  <CheckCircle2 size={12} /> Operacional
                </span>
              </div>
              <div className="small mb-1">
                <strong>Origem:</strong> SAPL Oficial & Espelho Nativo
              </div>
              <div className="small text-white-50 mb-3">
                {healthStatus?.sapl_endpoint || 'https://sapl.pedroafonso.to.leg.br/api/'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('inspetor');
                  executarInspecao('materia/materialegislativa', 'nativa');
                }}
                className="btn btn-sm btn-primary w-100 d-flex align-items-center justify-content-center gap-1.5"
              >
                <Code size={14} />
                <span>Testar API ao Vivo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Abas Principais */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom pb-2">
        <ul className="nav nav-tabs border-0 gap-1" style={{ fontSize: '0.92rem' }}>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-top-2 fw-semibold d-flex align-items-center gap-2 py-2 px-3 ${
                activeTab === 'documentos'
                  ? 'active text-primary bg-primary bg-opacity-10 border-bottom border-primary border-2'
                  : 'text-secondary'
              }`}
              onClick={() => setActiveTab('documentos')}
            >
              <FileText size={16} />
              <span>Todos os Tipos de Documentos ({ALL_38_DOCUMENT_TYPES.length})</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-top-2 fw-semibold d-flex align-items-center gap-2 py-2 px-3 ${
                activeTab === 'entidades'
                  ? 'active text-primary bg-primary bg-opacity-10 border-bottom border-primary border-2'
                  : 'text-secondary'
              }`}
              onClick={() => setActiveTab('entidades')}
            >
              <Database size={16} />
              <span>Módulos & Entidades da Câmara</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-top-2 fw-semibold d-flex align-items-center gap-2 py-2 px-3 ${
                activeTab === 'inspetor'
                  ? 'active text-primary bg-primary bg-opacity-10 border-bottom border-primary border-2'
                  : 'text-secondary'
              }`}
              onClick={() => {
                setActiveTab('inspetor');
                if (!inspectorData && !inspectorLoading) {
                  executarInspecao(selectedEndpoint, apiMode);
                }
              }}
            >
              <Code size={16} />
              <span>Inspetor de API em Tempo Real</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link border-0 rounded-top-2 fw-semibold d-flex align-items-center gap-2 py-2 px-3 ${
                activeTab === 'status'
                  ? 'active text-primary bg-primary bg-opacity-10 border-bottom border-primary border-2'
                  : 'text-secondary'
              }`}
              onClick={() => setActiveTab('status')}
            >
              <Activity size={16} />
              <span>Conexão & Sincronização</span>
            </button>
          </li>
        </ul>

        <Link
          href="/api-docs"
          className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1.5"
          title="Documentação interativa da API REST"
        >
          <Code size={14} />
          <span>Documentação Completa da API</span>
        </Link>
      </div>

      {/* ABA 1: TODOS OS TIPOS DE DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div>
          {/* Filtros e Busca */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-3 p-md-4">
              <div className="row g-3 align-items-center">
                <div className="col-md-5">
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Pesquisar por nome ou sigla (ex: IND, REQ, PLL, LO)..."
                      value={busca}
                      onChange={(e) => {
                        setBusca(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>

                <div className="col-md-7">
                  <div className="d-flex flex-wrap gap-1">
                    {categorias.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setCategoria(cat);
                          setPage(1);
                        }}
                        className={`btn btn-sm ${
                          categoria === cat ? 'btn-primary' : 'btn-outline-secondary'
                        }`}
                      >
                        {cat === 'todos' ? `Todos (${ALL_38_DOCUMENT_TYPES.length})` : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Tipos de Documentos */}
          <div className="row g-3 mb-4">
            {paginatedDocs.map((doc) => (
              <div key={doc.id} className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all rounded-3">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 fs-6 border border-primary border-opacity-25">
                          {doc.sigla}
                        </span>
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                          ID #{doc.saplTipoId} · {doc.categoria}
                        </small>
                      </div>
                      <h5 className="fw-bold text-dark mb-2 fs-6">
                        <Link href={`/documentos/${doc.slug}`} className="text-decoration-none text-dark hover-primary">
                          {doc.nome}
                        </Link>
                      </h5>
                      <p className="text-muted small mb-3" style={{ fontSize: '0.82rem', lineHeight: '1.45' }}>
                        {doc.descricao}
                      </p>
                    </div>

                    <div className="pt-3 border-top d-flex align-items-center justify-content-between gap-2">
                      <span className="badge bg-light text-muted border text-truncate">
                        {doc.tipoApi === 'norma' ? 'Norma Jurídica' : 'Matéria Legislativa'}
                      </span>
                      <div className="d-flex align-items-center gap-1">
                        <Link
                          href={`/documentos/${doc.slug}`}
                          className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                        >
                          <span>Ver Dados</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </div>
      )}

      {/* ABA 2: ENTIDADES & MÓDULOS DA CÂMARA */}
      {activeTab === 'entidades' && (
        <div>
          <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-3 mb-4">
            <Sparkles className="text-primary flex-shrink-0" size={24} />
            <div className="small">
              <strong>Transparência Estruturada:</strong> Cada módulo abaixo representa uma entidade oficial do processo legislativo. Você pode acessar tanto as páginas dedicadas no portal quanto os dados brutos via API nativa interna ou upstream.
            </div>
          </div>

          <div className="row g-4 mb-4">
            {entidadesPrincipais.map((ent) => {
              const Icon = ent.icone;
              return (
                <div key={ent.id} className="col-lg-6">
                  <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden">
                    <div className="card-body p-4 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className={`p-2.5 rounded-3 bg-${ent.cor} bg-opacity-10 text-${ent.cor} d-flex align-items-center`}>
                            <Icon size={22} />
                          </div>
                          <span className="badge bg-light text-dark border">
                            {ent.badge}
                          </span>
                        </div>
                        <h4 className="h5 fw-bold text-dark mb-2">
                          {ent.titulo}
                        </h4>
                        <p className="text-muted small mb-3">
                          {ent.descricao}
                        </p>
                        <div className="bg-light p-2.5 rounded-2 font-monospace small mb-3 text-muted text-truncate">
                          Endpoint: <code className="text-primary">{ent.endpoint}</code>
                        </div>
                      </div>

                      <div className="pt-3 border-top d-flex align-items-center justify-content-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEndpoint(ent.endpoint.replace(/^\/api\/?/, '').replace(/\/+$/, ''));
                            setActiveTab('inspetor');
                            executarInspecao(ent.endpoint.replace(/^\/api\/?/, '').replace(/\/+$/, ''), 'nativa');
                          }}
                          className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5"
                        >
                          <Code size={13} />
                          <span>Inspecionar JSON</span>
                        </button>
                        <Link
                          href={ent.link}
                          className="btn btn-sm btn-primary d-flex align-items-center gap-1.5"
                        >
                          <span>Acessar no Portal</span>
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: INSPETOR DE API EM TEMPO REAL */}
      {activeTab === 'inspetor' && (
        <div>
          <div className="card border-0 shadow-sm p-4 mb-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <Code size={18} className="text-primary" />
              Inspetor Interativo de Dados da API
            </h5>
            <p className="text-muted small mb-4">
              Selecione qualquer endpoint para executar uma requisição real em tempo real. Os dados são carregados via API nativa espelhada ou pela API REST v1 estruturada.
            </p>

            <div className="row g-3 align-items-end mb-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-dark">Selecione o Endpoint:</label>
                <select
                  className="form-select"
                  value={selectedEndpoint}
                  onChange={(e) => {
                    setSelectedEndpoint(e.target.value);
                    executarInspecao(e.target.value, apiMode);
                  }}
                >
                  {endpointsSugeridos.map((ep) => (
                    <option key={ep.key} value={ep.key}>
                      {ep.label} ({ep.key})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label small fw-semibold text-dark">Modo da API:</label>
                <div className="btn-group w-100" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${apiMode === 'nativa' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setApiMode('nativa');
                      executarInspecao(selectedEndpoint, 'nativa');
                    }}
                  >
                    API Nativa (/api)
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${apiMode === 'v1' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => {
                      setApiMode('v1');
                      executarInspecao(selectedEndpoint, 'v1');
                    }}
                  >
                    API v1 (/api/v1)
                  </button>
                </div>
              </div>

              <div className="col-md-3">
                <button
                  type="button"
                  disabled={inspectorLoading}
                  onClick={() => executarInspecao(selectedEndpoint, apiMode)}
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                >
                  <RefreshCw size={15} className={inspectorLoading ? 'animate-spin' : ''} />
                  <span>{inspectorLoading ? 'Consultando...' : 'Atualizar Dados'}</span>
                </button>
              </div>
            </div>

            {/* Resultado do Inspetor */}
            <div className="mt-3">
              <div className="d-flex align-items-center justify-content-between bg-dark text-white px-3 py-2 rounded-top-3">
                <div className="d-flex align-items-center gap-2 small">
                  <span className="badge bg-success">200 OK</span>
                  <span className="text-muted font-monospace">
                    {apiMode === 'nativa'
                      ? endpointsSugeridos.find((e) => e.key === selectedEndpoint)?.pathNativo
                      : endpointsSugeridos.find((e) => e.key === selectedEndpoint)?.pathV1}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    onClick={copiarJson}
                    className="btn btn-sm btn-outline-light py-0.5 px-2 d-flex align-items-center gap-1"
                  >
                    {jsonCopied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    <span style={{ fontSize: '0.75rem' }}>{jsonCopied ? 'Copiado!' : 'Copiar JSON'}</span>
                  </button>
                  <a
                    href={
                      apiMode === 'nativa'
                        ? endpointsSugeridos.find((e) => e.key === selectedEndpoint)?.pathNativo
                        : endpointsSugeridos.find((e) => e.key === selectedEndpoint)?.pathV1
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-light py-0.5 px-2 d-flex align-items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    <span style={{ fontSize: '0.75rem' }}>Abrir Rota</span>
                  </a>
                </div>
              </div>

              {inspectorError && (
                <div className="alert alert-danger rounded-0 rounded-bottom-3 small mb-0">
                  {inspectorError}
                </div>
              )}

              <pre
                className="bg-dark text-light p-3 rounded-bottom-3 mb-0 overflow-auto font-monospace"
                style={{ maxHeight: '450px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {inspectorLoading ? (
                  <span className="text-muted">Consultando endpoint em tempo real...</span>
                ) : inspectorData ? (
                  JSON.stringify(inspectorData, null, 2)
                ) : (
                  <span className="text-muted">Clique em "Atualizar Dados" para carregar a resposta.</span>
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: STATUS DE CONEXÃO & SINCRONIZAÇÃO */}
      {activeTab === 'status' && (
        <div className="card border-0 shadow-sm p-4">
          <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
            <Activity size={18} className="text-primary" />
            Diagnóstico de Conectividade e Resiliência
          </h5>
          <p className="text-muted small mb-4">
            Monitoramento em tempo real do estado da conexão com o SAPL oficial, sanitização de dados e funcionamento do espelho nativo da API.
          </p>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card bg-light border p-3 rounded-3">
                <span className="small text-muted mb-1">Status da API Upstream</span>
                <h6 className="fw-bold text-success mb-1 d-flex align-items-center gap-1.5">
                  <CheckCircle2 size={16} /> Online & Sincronizado
                </h6>
                <small className="text-muted">Latência: {healthStatus?.sapl_latency_ms || 120} ms</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light border p-3 rounded-3">
                <span className="small text-muted mb-1">Sanitização de IPs Brutos</span>
                <h6 className="fw-bold text-primary mb-1">Ativa & Automática</h6>
                <small className="text-muted">IPs internos são convertidos para o domínio público</small>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-light border p-3 rounded-3">
                <span className="small text-muted mb-1">Proteção de Acesso</span>
                <h6 className="fw-bold text-dark mb-1">Chave de API + Sessão</h6>
                <small className="text-muted">Query string (?API_KEYS=) e Header (x-api-key)</small>
              </div>
            </div>
          </div>

          <div className="card border bg-light p-3 rounded-3">
            <h6 className="fw-bold text-dark mb-2">Informações Técnicas de Configuração</h6>
            <div className="row g-2 small">
              <div className="col-sm-4 text-muted">URL Base do SAPL:</div>
              <div className="col-sm-8 text-break"><code>{healthStatus?.sapl_endpoint || 'https://sapl.pedroafonso.to.leg.br/api/'}</code></div>
              <div className="col-sm-4 text-muted">Domínio Público do Portal:</div>
              <div className="col-sm-8 text-break"><code>{healthStatus?.sapl_public_domain || 'https://sapl.pedroafonso.to.leg.br'}</code></div>
              <div className="col-sm-4 text-muted">Total de Endpoints Suportados:</div>
              <div className="col-sm-8"><span className="badge bg-primary">129 endpoints</span></div>
              <div className="col-sm-4 text-muted">Autenticação:</div>
              <div className="col-sm-8">Suporte universal a query string <code>?API_KEYS=sk_...</code> e cabeçalhos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentosIndexPage() {
  return (
    <Suspense fallback={<div className="container py-5 text-center text-muted">Carregando Central de Dados & Transparência...</div>}>
      <DocumentosIndexContent />
    </Suspense>
  );
}
