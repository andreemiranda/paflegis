import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, RotateCcw, AlertCircle } from 'lucide-react';
import { SessaoPlenaria } from '../types';
import { getSessoes } from '../lib/api/sapl';
import { SessaoCard } from '../components/SessaoCard';
import { SkeletonList } from '../components/SkeletonLoaders';
import { AdContainer } from '../components/AdContainer';
import { YouTubeModal } from '../components/YouTubeModal';
import { Pagination } from '../components/Pagination';

interface SessoesViewProps {
  initialSearch?: string;
}

export const SessoesView: React.FC<SessoesViewProps> = ({ initialSearch = '' }) => {
  const [sessoes, setSessoes] = useState<SessaoPlenaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [busca, setBusca] = useState(initialSearch);
  const [anoSelecao, setAnoSelecao] = useState('2026');

  // Pagination state
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // YouTube modal state
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [selectedSessao, setSelectedSessao] = useState<SessaoPlenaria | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');
  const [selectedVideoTitle, setSelectedVideoTitle] = useState('');

  const anosDisponiveis = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  // Reset page when filters change
  useEffect(() => {
    setPagina(1);
  }, [busca, anoSelecao]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const res = await getSessoes({
          busca,
          ano: anoSelecao,
          pagina,
          limite,
        });
        setSessoes(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Erro ao buscar sessões:', err);
        setError(true);
        setSessoes([]);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchData();
    }, 200);

    return () => clearTimeout(timer);
  }, [busca, anoSelecao, pagina, limite]);

  const handleResetFilters = () => {
    setBusca('');
    setAnoSelecao('2026');
    setPagina(1);
  };

  const handleOpenYouTube = (sessaoOrUrl: SessaoPlenaria | string, title?: string) => {
    if (typeof sessaoOrUrl === 'object' && sessaoOrUrl !== null) {
      setSelectedSessao(sessaoOrUrl);
      setSelectedVideoUrl(sessaoOrUrl.youtube_url || '');
      setSelectedVideoTitle(`${sessaoOrUrl.tipo} nº ${sessaoOrUrl.numero}/${sessaoOrUrl.ano}`);
    } else {
      setSelectedSessao(null);
      setSelectedVideoUrl(sessaoOrUrl);
      setSelectedVideoTitle(title || 'Gravação da Sessão');
    }
    setYoutubeModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 font-sans">
            Sessões Plenárias
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Acompanhe pautas, atas de reunião, presença dos vereadores, deliberações e assista às transmissões em vídeo (YouTube) das sessões da Câmara.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filtros de Sessões</span>
          </span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Filtros</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Buscar por Número ou Tipo</label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Ex: Ordinária, 14..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Ano da Sessão</label>
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

      {loading ? (
        <SkeletonList count={2} />
      ) : sessoes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma sessão encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente modificar a busca para localizar a sessão desejada.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {sessoes.map(s => (
              <SessaoCard key={s.id} sessao={s} onOpenYouTube={handleOpenYouTube} />
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

      {/* YouTube Video Embed Modal */}
      <YouTubeModal
        isOpen={youtubeModalOpen}
        onClose={() => setYoutubeModalOpen(false)}
        sessao={selectedSessao}
        videoUrl={selectedVideoUrl}
        title={selectedVideoTitle}
      />
    </div>
  );
};
