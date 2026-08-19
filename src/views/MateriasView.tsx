import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, RotateCcw, AlertCircle } from 'lucide-react';
import { MateriaLegislativa, TipoFiltro } from '../types';
import { getMaterias, getTiposMaterias } from '../lib/api/sapl';
import { MateriaCard } from '../components/MateriaCard';
import { SkeletonList } from '../components/SkeletonLoaders';
import { AdContainer } from '../components/AdContainer';
import { Pagination } from '../components/Pagination';

interface MateriasViewProps {
  initialSearch?: string;
}

export const MateriasView: React.FC<MateriasViewProps> = ({ initialSearch = '' }) => {
  const [materias, setMaterias] = useState<MateriaLegislativa[]>([]);
  const [tipos, setTipos] = useState<TipoFiltro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters state
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
      const t = await getTiposMaterias();
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
        const res = await getMaterias({
          busca: busca,
          tipo: tipoSelecao,
          ano: anoSelecao,
          pagina,
          limite,
        });
        setMaterias(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Erro ao buscar matérias:', err);
        setError(true);
        setMaterias([]);
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

      {/* Page Header Title */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 font-sans">
            Matérias Legislativas
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Consulta pública de projetos de lei, requerimentos, indicações, moções e pareceres com links diretos aos arquivos anexos.
        </p>
      </div>

      {/* Filter Controls Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros de Pesquisa</span>
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
          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Palavra-chave / Nº</label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Ex: PL 42, iluminação..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Type Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Tipo de Matéria</label>
            <select
              value={tipoSelecao}
              onChange={e => setTipoSelecao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px] cursor-pointer"
            >
              <option value="">Todos os Tipos</option>
              {tipos.map(t => (
                <option key={t.id} value={String(t.id)}>
                  {t.nome} ({t.sigla})
                </option>
              ))}
            </select>
          </div>

          {/* Year Select */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Ano de Apresentação</label>
            <select
              value={anoSelecao}
              onChange={e => setAnoSelecao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px] cursor-pointer"
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

      {/* List Output */}
      {loading ? (
        <SkeletonList count={3} />
      ) : materias.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma matéria legislativa encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente remover alguns filtros de busca ou pesquise por outros termos.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-block mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors"
          >
            Ver Todas as Matérias
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {materias.map(m => (
              <MateriaCard key={m.id} materia={m} />
            ))}
          </div>

          {/* Pagination Controls */}
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

      {/* Native Ad Container */}
      <AdContainer format="auto" />
    </div>
  );
};

