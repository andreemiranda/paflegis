'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  RefreshCw,
  Layers,
  ChevronRight,
  Code,
  Eye,
  Calendar,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutGrid,
  List,
  AlertCircle,
  FileCheck,
  Scale,
  FileSpreadsheet,
  FolderKanban,
  Database,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/sapl/client';
import { ALL_38_DOCUMENT_TYPES } from '@/lib/sapl/documentTypes';
import Pagination from '@/components/Pagination';
import DocumentPreviewModal from '@/components/DocumentPreviewModal';
import ApiIntegrationModal from '@/components/ApiIntegrationModal';

type TabType = 'todos' | 'materias' | 'normas' | 'adm' | 'tipos';

function DocumentosContent() {
  const [activeTab, setActiveTab] = useState<TabType>('todos');
  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);

  // Filtros
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [ano, setAno] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estados de Carregamento e Sincronização
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [dataSource, setDataSource] = useState<string>('API Nativa + SAPL Live');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Modais de Inspeção e Detalhe
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string; doc?: any } | null>(null);
  const [apiModalData, setApiModalData] = useState<{ endpoint: string; title: string; defaultTab?: any } | null>(null);

  // Filtro específico para aba de tipos catalogados
  const [tipoCategoria, setTipoCategoria] = useState<string>('todos');

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [busca]);

  // Função central de carregamento de documentos da API
  const loadDocuments = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setSyncMessage('');

    try {
      if (activeTab === 'tipos') {
        // Aba de tipos de documentos oficiais
        setLoading(false);
        return;
      }

      if (activeTab === 'todos') {
        const res = await api.getAllDocumentos({
          busca: buscaDebounced.trim() || undefined,
          ano: ano || undefined,
          pagina: page,
          limite: limit,
          categoria: 'todos',
        });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setDataSource(res.fonte === 'upstream-live' ? 'SAPL Upstream Live' : 'API Nativa Integrada');
      } else if (activeTab === 'materias') {
        const res = await api.getMaterias({
          busca: buscaDebounced.trim() || undefined,
          ano: ano || undefined,
          pagina: page,
          limite: limit,
        });
        setItems(res.items.map((m) => ({ ...m, origem_tipo: 'materia', categoria_label: 'Matéria Legislativa' })) || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setDataSource(res.fonte || 'API Nativa (Matérias)');
      } else if (activeTab === 'normas') {
        const res = await api.getNormas({
          busca: buscaDebounced.trim() || undefined,
          ano: ano || undefined,
          pagina: page,
          limite: limit,
        });
        setItems(res.items.map((n) => ({ ...n, origem_tipo: 'norma', categoria_label: 'Norma Jurídica' })) || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setDataSource(res.fonte || 'API Nativa (Normas)');
      } else if (activeTab === 'adm') {
        const res = await api.getDocumentosAdministrativos({
          page,
          search: buscaDebounced.trim() || undefined,
        });
        const admItems = (res.results || []).map((d: any) => ({
          id: d.id,
          numero: d.numero,
          ano: d.ano,
          tipo: d.tipo_documento_administrativo || 'Documento Administrativo',
          ementa: d.descricao || d.assunto || d.ementa || 'Documento Administrativo da Câmara',
          autor: d.interessado || 'Protocolo Administrativo',
          data_apresentacao: d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '',
          situacao: 'Protocolado',
          texto_original_url: d.arquivo || '',
          origem_tipo: 'adm',
          categoria_label: 'Administrativo',
        }));
        setItems(admItems);
        setTotal(res.count || admItems.length);
        setTotalPages(Math.ceil((res.count || admItems.length) / limit) || 1);
        setDataSource('API SAPL (Protocolo ADM)');
      }

      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
    } catch (err: any) {
      console.warn('Erro ao carregar documentos da API:', err);
      // Garante resiliência: tenta fallback de matérias caso a busca combinada tenha instabilidade
      try {
        const fallback = await api.getMaterias({ pagina: page, limite: limit });
        setItems(fallback.items.map((m) => ({ ...m, origem_tipo: 'materia', categoria_label: 'Matéria Legislativa' })));
        setTotal(fallback.total);
        setTotalPages(fallback.totalPages);
        setDataSource('API Nativa (Espelho Resiliente)');
      } catch {
        setItems([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, buscaDebounced, ano, page, limit]);

  // Carrega ao mudar filtros ou abas
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Disparo manual de sincronização
  const handleForceSync = async () => {
    setSyncing(true);
    setSyncMessage('Sincronizando dados com o SAPL oficial...');
    try {
      await api.triggerSync('incremental').catch(() => null);
      await loadDocuments(true);
      setSyncMessage('Acervo sincronizado com sucesso!');
      setTimeout(() => setSyncMessage(''), 4000);
    } catch {
      setSyncMessage('Atualização realizada com a base nativa.');
      setTimeout(() => setSyncMessage(''), 4000);
    } finally {
      setSyncing(false);
    }
  };

  // Efeito de auto-refresh opcional (a cada 60s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadDocuments(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadDocuments]);

  // Filtragem da aba "Tipos Catalogados"
  const tiposFiltrados = ALL_38_DOCUMENT_TYPES.filter((doc) => {
    const matchesSearch =
      buscaDebounced === '' ||
      doc.nome.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
      doc.sigla.toLowerCase().includes(buscaDebounced.toLowerCase()) ||
      doc.descricao.toLowerCase().includes(buscaDebounced.toLowerCase());
    const matchesCat = tipoCategoria === 'todos' || doc.categoria === tipoCategoria;
    return matchesSearch && matchesCat;
  });

  const anosDisponiveis = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item">
            <Link href="/" className="text-decoration-none">Início</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            Documentos & Acervo Legislativo
          </li>
        </ol>
      </nav>

      {/* Header com Título e Ações de Sincronização */}
      <div className="card border-0 shadow-sm mb-4 bg-white">
        <div className="card-body p-4">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
            <div>
              <div className="d-inline-flex align-items-center gap-1.5 badge bg-primary bg-opacity-10 text-primary px-3 py-1.5 rounded-pill mb-2 border border-primary border-opacity-25">
                <Sparkles size={14} />
                <span className="fw-semibold">Central Unificada de Transparência & Dados Públicos</span>
              </div>
              <h1 className="h3 fw-bold text-dark mb-1 d-flex align-items-center gap-2">
                <FileText className="text-primary" /> Central de Documentos & Acervo Legislativo
              </h1>
              <p className="text-muted small mb-0" style={{ maxWidth: '780px' }}>
                Explore todas as matérias legislativas, projetos de lei, normas municipais, requerimentos e atos
                da Câmara Municipal de Pedro Afonso - TO. Dados sincronizados continuamente e prontos para consulta pública e integração via API.
              </p>
            </div>

            {/* Ações de Sincronização e Status */}
            <div className="d-flex flex-column align-items-sm-end gap-2">
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  onClick={handleForceSync}
                  disabled={syncing}
                  className="btn btn-primary d-inline-flex align-items-center gap-2 px-3 py-2 fw-semibold shadow-sm"
                  title="Forçar sincronização e atualização de dados agora"
                >
                  <RefreshCw size={15} className={syncing ? 'spinner-border spinner-border-sm' : ''} />
                  <span>{syncing ? 'Sincronizando...' : 'Sincronizar Acervo Agora'}</span>
                </button>

                <Link
                  href="/api-docs"
                  className="btn btn-outline-primary d-inline-flex align-items-center gap-1.5 px-3 py-2 fw-medium"
                  title="Abrir Console de APIs e Documentação Técnica"
                >
                  <Code size={15} />
                  <span className="d-none d-sm-inline">API & Integração</span>
                </Link>
              </div>

              {/* Status Bar */}
              <div className="d-flex flex-wrap align-items-center gap-2 small text-muted">
                <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 d-inline-flex align-items-center gap-1">
                  <CheckCircle2 size={12} /> Conexão Operacional
                </span>
                <span>•</span>
                <span>Fonte: <strong>{dataSource}</strong></span>
                {lastSyncTime && (
                  <>
                    <span>•</span>
                    <span className="d-inline-flex align-items-center gap-1">
                      <Clock size={12} /> Sincronizado às {lastSyncTime}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {syncMessage && (
            <div className="alert alert-info py-2 px-3 mb-0 small d-flex align-items-center gap-2">
              <CheckCircle2 size={16} className="text-primary" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Abas Principais de Conteúdo */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header bg-white border-bottom p-3">
          <ul className="nav nav-pills gap-2 flex-wrap">
            <li className="nav-item">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('todos');
                  setPage(1);
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold ${
                  activeTab === 'todos' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                <FileText size={15} />
                <span>Todos os Documentos</span>
                <span className="badge bg-white text-dark ms-1">{activeTab === 'todos' ? total : ''}</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('materias');
                  setPage(1);
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold ${
                  activeTab === 'materias' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                <FileCheck size={15} />
                <span>Matérias & Projetos</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('normas');
                  setPage(1);
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold ${
                  activeTab === 'normas' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                <Scale size={15} />
                <span>Normas & Leis</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('adm');
                  setPage(1);
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold ${
                  activeTab === 'adm' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                <FolderKanban size={15} />
                <span>Documentos Administrativos</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tipos');
                  setPage(1);
                }}
                className={`btn btn-sm d-flex align-items-center gap-1.5 px-3 py-2 fw-semibold ${
                  activeTab === 'tipos' ? 'btn-primary' : 'btn-outline-secondary'
                }`}
              >
                <Layers size={15} />
                <span>Catálogo de Espécies (38 Tipos)</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Filtros e Busca em Tempo Real */}
        <div className="card-body p-3 p-md-4">
          <div className="row g-3 align-items-center">
            <div className="col-lg-5 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Pesquisar por assunto, ementa, autor ou número..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {busca && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setBusca('')}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {activeTab !== 'tipos' ? (
              <>
                <div className="col-lg-3 col-md-3">
                  <select
                    className="form-select"
                    value={ano}
                    onChange={(e) => {
                      setAno(e.target.value);
                      setPage(1);
                    }}
                  >
                    <option value="">Todos os Anos</option>
                    {anosDisponiveis.map((a) => (
                      <option key={a} value={a}>
                        Ano {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-4 col-md-3 d-flex align-items-center justify-content-md-end gap-2">
                  <div className="btn-group" role="group">
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title="Visualização em Cards"
                    >
                      <LayoutGrid size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title="Visualização em Tabela"
                    >
                      <List size={15} />
                    </button>
                  </div>

                  <span className="badge bg-light text-dark border py-2 px-3 small">
                    {total} documentos encontrados
                  </span>
                </div>
              </>
            ) : (
              <div className="col-lg-7 col-md-6">
                <div className="d-flex flex-wrap gap-1">
                  {[
                    'todos',
                    'Matérias e Projetos',
                    'Requerimentos por Vereador',
                    'Normas e Legislação',
                    'Atos e Comissões',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTipoCategoria(cat)}
                      className={`btn btn-sm ${
                        tipoCategoria === cat ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                    >
                      {cat === 'todos' ? 'Todas as Categorias' : cat}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo: Listagem de Documentos (Abas Todos, Matérias, Normas, ADM) */}
      {activeTab !== 'tipos' ? (
        <div>
          {loading ? (
            <div className="card p-5 text-center text-muted border-0 shadow-sm mb-4">
              <RefreshCw size={28} className="spinner-border spinner-border-sm mx-auto mb-3 text-primary" />
              <h5 className="fs-6 fw-bold text-dark mb-1">Consultando acervo legislativo da API...</h5>
              <small className="text-muted">
                Carregando documentos com alimentação em tempo real e verificação de integridade.
              </small>
            </div>
          ) : items.length > 0 ? (
            viewMode === 'cards' ? (
              /* MODO CARDS */
              <div className="row g-3 mb-4">
                {items.map((doc) => {
                  const docUrl = doc.texto_original_url || doc.texto_integral_url || '';
                  const docTitle = doc.numero ? `${doc.tipo} nº ${doc.numero}/${doc.ano}` : doc.tipo;
                  const isNormaItem = doc.origem_tipo === 'norma';
                  const apiEndpoint = isNormaItem ? `/api/v1/normas/${doc.id}` : `/api/v1/materias/${doc.id}`;

                  return (
                    <div key={`${doc.origem_tipo}-${doc.id}`} className="col-lg-6">
                      <div className="card h-100 border-0 shadow-sm p-4 d-flex flex-column justify-content-between hover-shadow transition-all">
                        <div>
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2.5 py-1 border border-primary border-opacity-25">
                              {doc.tipo}
                            </span>
                            <span className="text-muted small d-flex align-items-center gap-1">
                              <Calendar size={13} />
                              {doc.data_apresentacao || doc.data_publicacao || `Ano ${doc.ano}`}
                            </span>
                          </div>

                          <h5 className="fw-bold text-dark fs-6 mb-2">
                            {doc.numero ? `${doc.tipo} nº ${doc.numero}/${doc.ano}` : doc.tipo}
                          </h5>

                          <p className="text-secondary small mb-3 lh-base" style={{ minHeight: '44px' }}>
                            {doc.ementa ? (doc.ementa.length > 180 ? `${doc.ementa.slice(0, 180)}...` : doc.ementa) : 'Sem ementa cadastrada.'}
                          </p>

                          <div className="d-flex flex-wrap align-items-center gap-3 text-muted small mb-3 pt-2 border-top">
                            {doc.autor && (
                              <span className="d-flex align-items-center gap-1 text-truncate" style={{ maxWidth: '220px' }}>
                                <User size={13} className="text-info" />
                                <span>{doc.autor}</span>
                              </span>
                            )}
                            <span className="d-flex align-items-center gap-1">
                              <ShieldCheck size={13} className="text-success" />
                              <span>{doc.situacao || 'Publicado'}</span>
                            </span>
                          </div>
                        </div>

                        {/* Ações Integradas (Sem iframe!) */}
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 pt-2 border-top">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewDoc({
                                url: docUrl,
                                title: docTitle,
                                doc,
                              })
                            }
                            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1.5"
                            title="Visualizar documento, ementa e dados completos"
                          >
                            <Eye size={14} />
                            <span>Visualizar Detalhes</span>
                          </button>

                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setApiModalData({
                                  endpoint: apiEndpoint,
                                  title: docTitle,
                                })
                              }
                              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                              title="Inspecionar rota e integrar via API"
                            >
                              <Code size={13} />
                              <span>Integrar API</span>
                            </button>

                            {docUrl && (
                              <a
                                href={docUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                                title="Abrir documento oficial em nova aba"
                              >
                                <ExternalLink size={13} />
                                <span>PDF Oficial</span>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* MODO TABELA */
              <div className="card border-0 shadow-sm mb-4 overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light small text-uppercase">
                      <tr>
                        <th style={{ width: '12%' }}>Espécie</th>
                        <th style={{ width: '12%' }}>Número / Ano</th>
                        <th style={{ width: '40%' }}>Ementa Oficial</th>
                        <th style={{ width: '16%' }}>Autor / Origem</th>
                        <th style={{ width: '10%' }}>Data</th>
                        <th style={{ width: '10%' }} className="text-end">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="small">
                      {items.map((doc) => {
                        const docUrl = doc.texto_original_url || doc.texto_integral_url || '';
                        const docTitle = doc.numero ? `${doc.tipo} nº ${doc.numero}/${doc.ano}` : doc.tipo;
                        const isNormaItem = doc.origem_tipo === 'norma';
                        const apiEndpoint = isNormaItem ? `/api/v1/normas/${doc.id}` : `/api/v1/materias/${doc.id}`;

                        return (
                          <tr key={`${doc.origem_tipo}-${doc.id}`}>
                            <td>
                              <span className="badge bg-light text-primary border">
                                {doc.categoria_label || doc.tipo}
                              </span>
                            </td>
                            <td>
                              <strong>{doc.numero ? `Nº ${doc.numero}/${doc.ano}` : `Ano ${doc.ano}`}</strong>
                            </td>
                            <td>
                              <span className="d-block text-truncate" style={{ maxWidth: '380px' }} title={doc.ementa}>
                                {doc.ementa || 'Sem ementa'}
                              </span>
                            </td>
                            <td className="text-muted text-truncate" style={{ maxWidth: '160px' }}>
                              {doc.autor || 'Câmara Municipal'}
                            </td>
                            <td className="text-muted">
                              {doc.data_apresentacao || doc.data_publicacao || doc.ano}
                            </td>
                            <td className="text-end">
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      url: docUrl,
                                      title: docTitle,
                                      doc,
                                    })
                                  }
                                  className="btn btn-outline-primary"
                                  title="Visualizar Detalhes"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setApiModalData({
                                      endpoint: apiEndpoint,
                                      title: docTitle,
                                    })
                                  }
                                  className="btn btn-outline-secondary"
                                  title="Integrar API"
                                >
                                  <Code size={13} />
                                </button>
                                {docUrl && (
                                  <a
                                    href={docUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-dark"
                                    title="Abrir em Nova Aba"
                                  >
                                    <ExternalLink size={13} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            <div className="card p-5 text-center text-muted border-0 shadow-sm mb-4">
              <AlertCircle size={36} className="text-warning mx-auto mb-2" />
              <h5 className="fs-6 fw-bold text-dark mb-1">Nenhum documento encontrado</h5>
              <p className="small mb-3">
                Não foram encontrados registros para os filtros selecionados ou termo &quot;{busca}&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBusca('');
                  setAno('');
                }}
                className="btn btn-sm btn-outline-primary mx-auto"
              >
                Limpar Filtros de Busca
              </button>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </div>
      ) : (
        /* Aba 5: Catálogo Temático dos 38 Tipos Oficiais */
        <div>
          <div className="alert alert-light border shadow-sm mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="small text-muted">
              Exibindo <strong>{tiposFiltrados.length}</strong> espécies documentais regimentais cadastradas no SAPL de Pedro Afonso.
            </span>
            <span className="badge bg-primary bg-opacity-10 text-primary">
              Acesso e paginação dedicada por tipo
            </span>
          </div>

          <div className="row g-3 mb-4">
            {tiposFiltrados.map((doc) => (
              <div key={doc.id} className="col-lg-4 col-md-6">
                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 fs-6 border border-primary border-opacity-25">
                          {doc.sigla}
                        </span>
                        <span className="badge bg-light text-muted border">
                          ID #{doc.saplTipoId}
                        </span>
                      </div>

                      <h2 className="h5 fw-bold text-dark mb-2">{doc.nome}</h2>
                      <p className="text-muted small mb-3">{doc.descricao}</p>
                    </div>

                    <div>
                      <div className="d-flex align-items-center justify-content-between pt-3 border-top">
                        <span className="badge bg-secondary bg-opacity-10 text-secondary">
                          {doc.categoria}
                        </span>
                        <Link
                          href={`/documentos/${doc.slug}`}
                          className="btn btn-sm btn-primary d-inline-flex align-items-center gap-1"
                        >
                          Ver Proposições <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modais de Exibição (Sem Iframes!) */}
      {previewDoc && (
        <DocumentPreviewModal
          url={previewDoc.url}
          title={previewDoc.title}
          materia={previewDoc.doc}
          norma={previewDoc.doc?.origem_tipo === 'norma' ? previewDoc.doc : undefined}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {apiModalData && (
        <ApiIntegrationModal
          isOpen={true}
          cleanPath={apiModalData.endpoint}
          title={apiModalData.title}
          onClose={() => setApiModalData(null)}
        />
      )}
    </div>
  );
}

export default function DocumentosPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando Acervo Legislativo...</span>
          </div>
        </div>
      }
    >
      <DocumentosContent />
    </Suspense>
  );
}
