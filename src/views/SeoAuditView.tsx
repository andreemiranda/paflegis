import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle2, AlertCircle, FileText, Key, Calendar, ExternalLink, Database, ShieldCheck } from 'lucide-react';
import { paflegisFetch } from '../lib/api/client';

interface SeoAuditItem {
  id: string | number;
  type: 'materias' | 'normas' | 'sessoes';
  title: string;
  description: string;
  keywords: string[];
  date: string;
  originalUrl: string;
  lastUpdated: string;
}

interface SyncLog {
  timestamp: string;
  materiasCount: number;
  normasCount: number;
  sessoesCount: number;
  totalProcessed: number;
  errorsCount: number;
  details: string[];
}

export const SeoAuditView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [items, setItems] = useState<SeoAuditItem[]>([]);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [stats, setStats] = useState({ total: 0, materias: 0, normas: 0, sessoes: 0 });
  const [filterType, setFilterType] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await paflegisFetch('/api/v1/seo-audit');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setLastSync(data.lastSync || null);
        setStats(data.stats || { total: 0, materias: 0, normas: 0, sessoes: 0 });
      }
    } catch (e) {
      console.error('Erro ao carregar dados do SEO Audit:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    setStatusMsg('Sincronizando metadados SEO com o SAPL...');
    try {
      const res = await paflegisFetch('/api/v1/sync-seo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatusMsg(`Sincronização concluída! ${data.log?.totalProcessed || 0} itens processados.`);
        await loadData();
      } else {
        setStatusMsg('Falha ao executar sincronização.');
      }
    } catch {
      setStatusMsg('Erro ao conectar com a API de sincronização.');
    } finally {
      setSyncing(false);
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'todos' || item.type === filterType;
    const matchesSearch = !search.trim() ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header / Intro */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-sans">
                Painel de Auditoria de SEO & Metadados
              </h1>
            </div>
            <p className="text-sm text-slate-300">
              Estância Editorial do Paflegis — Monitoramento de indexação, ementas, tags e palavras-chave.
            </p>
          </div>

          <button
            onClick={handleManualSync}
            disabled={syncing}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-all shadow disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Sincronizando...' : 'Forçar Sincronização SAPL'}</span>
          </button>
        </div>

        {statusMsg && (
          <div className="mt-4 p-3 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Indexado</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Matérias</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.materias}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Normas</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.normas}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Sessões</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.sessoes}</p>
        </div>
      </div>

      {/* Sync Log Box */}
      {lastSync && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Último Log de Sincronização
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(lastSync.timestamp).toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono">
            <p>• Itens processados: <strong>{lastSync.totalProcessed}</strong> ({lastSync.materiasCount} matérias, {lastSync.normasCount} normas, {lastSync.sessoesCount} sessões)</p>
            {lastSync.details.map((d, i) => (
              <p key={i}>• {d}</p>
            ))}
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por palavra-chave ou título..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'materias', label: 'Matérias' },
            { id: 'normas', label: 'Normas' },
            { id: 'sessoes', label: 'Sessões' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterType === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Document SEO Items */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Carregando metadados de auditoria...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Nenhum metadado SEO encontrado para os filtros selecionados. Clique em "Forçar Sincronização SAPL" acima.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-bold text-[10px] text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Tipo / ID</th>
                  <th className="px-4 py-3">Título Pre-renderizado</th>
                  <th className="px-4 py-3">Ementa / Resumo</th>
                  <th className="px-4 py-3">Palavras-chave Extraídas (5-8)</th>
                  <th className="px-4 py-3 text-right">Link Oficial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        item.type === 'materias' ? 'bg-blue-100 text-blue-800' :
                        item.type === 'normas' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.type}
                      </span>
                      <div className="mt-0.5 text-slate-400">#{item.id}</div>
                    </td>

                    <td className="px-4 py-3 font-bold text-slate-900 max-w-xs">
                      <a
                        href={`/${item.type}/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-blue-600 transition-colors"
                      >
                        {item.title}
                      </a>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.date}</div>
                    </td>

                    <td className="px-4 py-3 max-w-sm text-slate-700 leading-relaxed">
                      <p className="line-clamp-3">{item.description}</p>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {item.keywords.map((kw, idx) => (
                          <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-mono px-1.5 py-0.5 rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      {item.originalUrl ? (
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold text-[11px]"
                        >
                          <span>Abrir</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
