import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, RotateCcw, AlertCircle } from 'lucide-react';
import { NormaJuridica, TipoFiltro } from '../types';
import { getNormas, getTiposNormas } from '../lib/api/sapl';
import { NormaCard } from '../components/NormaCard';
import { SkeletonList } from '../components/SkeletonLoaders';
import { AdContainer } from '../components/AdContainer';
import { Pagination } from '../components/Pagination';

interface NormasViewProps {
  initialSearch?: string;
}

export const NormasView: React.FC<NormasViewProps> = ({ initialSearch = '' }) => {
  const [normas, setNormas] = useState<NormaJuridica[]>([]);
  const [tipos, setTipos] = useState<TipoFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [busca, setBusca] = useState(initialSearch);
  const [tipoSelecao, setTipoSelecao] = useState('');
  const [anoSelecao, setAnoSelecao] = useState('2026');

  // Pagination state
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const anosDisponiveis = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  useEffect(() => {
    async function init() {
      const t = await getTiposNormas();
      setTipos(t);
    }
    init();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPagina(1);
  }, [busca, tipoSelecao, anoSelecao]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const res = await getNormas({
          busca,
          tipo: tipoSelecao,
          ano: anoSelecao,
          pagina,
          limite,
        });
        setNormas(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Erro ao buscar normas:', err);
        setError(true);
        setNormas([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchData();
    }, 200);

    return () => clearTimeout(timer);
  }, [busca, tipoSelecao, anoSelecao, pagina, limite]);

  const handleResetFilters = () => {
    setBusca('');
    setTipoSelecao('');
    setAnoSelecao('2026');
    setPagina(1);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Error Banner */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-800">SAPL temporariamente indisponível</p>
            <p className="text-xs text-red-600 mt-0.5">
              Não foi possível carregar as normas jurídicas. Verifique sua conexão ou tente novamente.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 font-sans">
            Normas Jurídicas
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Acervo oficial de leis ordinárias, leis complementares, decretos legislativos e resoluções promulgadas no Município de Pedro Afonso - TO.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros de Normas</span>
          </span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Palavra-chave / Nº da Lei</label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Ex: Lei 1450, meio ambiente..."
                className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tipo de Norma</label>
            <select
              value={tipoSelecao}
              onChange={e => setTipoSelecao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos os Tipos</option>
              {tipos.map(t => (
                <option key={t.id} value={t.nome}>
                  {t.nome} ({t.sigla})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Ano de Publicação</label>
            <select
              value={anoSelecao}
              onChange={e => setAnoSelecao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos os Anos</option>
              {anosDisponiveis.map(a => (
                <option key={a} value={a}>
                  Ano {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : normas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma norma jurídica encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente redefinir os filtros ou buscar por outros termos no acervo.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-block mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors"
          >
            Ver Todas as Normas
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {normas.map(n => (
              <NormaCard key={n.id} norma={n} />
            ))}
          </div>

          <Pagination
            currentPage={pagina}
            totalPages={totalPages}
            totalItems={total}
            itemsPerPage={limite}
            onPageChange={setPagina}
            onItemsPerPageChange={setLimite}
          />
        </div>
      )}

      <AdContainer format="auto" />
    </div>
  );
};

