import React, { useEffect, useState } from 'react';
import {
  FileText,
  BookOpen,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Building2,
  Code2,
  WifiOff,
  Clock,
} from 'lucide-react';
import {
  MateriaLegislativa,
  NormaJuridica,
  SessaoPlenaria,
  EstatisticasLegislativas,
} from '../types';
import {
  getMaterias,
  getNormas,
  getSessoes,
  getEstatisticas,
} from '../lib/api/sapl';
import { MateriaCard } from '../components/MateriaCard';
import { NormaCard } from '../components/NormaCard';
import { SessaoCard } from '../components/SessaoCard';
import { SkeletonList } from '../components/SkeletonLoaders';
import { AdContainer } from '../components/AdContainer';

function formatAtualizadoEm(atualizado_em?: string, cache_age_s?: number): string | null {
  if (!atualizado_em) return null;
  try {
    const ageSec = typeof cache_age_s === 'number' ? cache_age_s : null;
    if (ageSec !== null) {
      if (ageSec < 60) return 'agora mesmo';
      const mins = Math.floor(ageSec / 60);
      if (mins < 60) return `há ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `há ${hrs}h`;
    }
    // Fall back to HH:MM from the timestamp string
    const d = new Date(atualizado_em);
    if (isNaN(d.getTime())) return null;
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `às ${hh}:${mm}`;
  } catch {
    return null;
  }
}

interface HomeViewProps {
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  const [stats, setStats] = useState<EstatisticasLegislativas | null>(null);
  const [materias, setMaterias] = useState<MateriaLegislativa[]>([]);
  const [normas, setNormas] = useState<NormaJuridica[]>([]);
  const [sessoes, setSessoes] = useState<SessaoPlenaria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [st, m, n, s] = await Promise.all([
          getEstatisticas(),
          getMaterias(),
          getNormas(),
          getSessoes(),
        ]);
        setStats(st);
        setMaterias(m.items.slice(0, 3));
        setNormas(n.items.slice(0, 2));
        setSessoes(s.items.slice(0, 1));
      } catch (e) {
        console.error('Erro ao carregar dados da Home:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Executive Welcome Banner */}
      <section className="bg-slate-900 text-white rounded-xl p-6 sm:p-8 border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-5 pointer-events-none text-white">
          <Building2 className="w-80 h-80" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-md text-xs font-semibold text-blue-400 border border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase tracking-wider text-[10px]">Facilitador de Consulta Pública</span>
          </div>

          <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-tight">
            Consulta às Informações Legislativas de Pedro Afonso - TO
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Aplicativo independente desenvolvido por Paflegis para simplificar o acesso a matérias em tramitação, leis, decretos e registros de sessões plenárias originados de dados públicos abertos.
          </p>

          {/* Search Trigger Bar */}
          <div className="pt-2">
            <div className="relative max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="Pesquisar projetos, leis, decretos por palavra-chave..."
                className="w-full bg-slate-800 text-slate-100 placeholder-slate-400 rounded-lg pl-10 pr-24 py-2.5 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <button
                onClick={() => onSelectTab('materias')}
                className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 rounded-md transition-colors flex items-center gap-1 shadow-sm"
              >
                <span>Buscar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Metric Stats Cards Banner */}
      {stats && (
        <section className="space-y-2">
          {stats.fonte === 'fallback' && (
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
              <WifiOff className="w-3.5 h-3.5 text-slate-400" />
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 uppercase tracking-wide text-[10px] font-semibold">
                dados offline
              </span>
              <span>- estatísticas estimadas, serviço externo indisponível</span>
            </div>
          )}
          {stats.fonte === 'sapl-live' && (() => {
            const label = formatAtualizadoEm(stats.atualizado_em, stats.cache_age_s);
            return label ? (
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Atualizado {label}</span>
              </div>
            ) : null;
          })()}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Matérias Registradas</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total_materias}</div>
            <div className="text-emerald-600 text-xs font-semibold pt-1">+ {stats.materias_ano_atual} este ano</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Normas Jurídicas</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total_normas}</div>
            <div className="text-emerald-600 text-xs font-semibold pt-1">+ {stats.normas_ano_atual} publicadas</div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <div className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Sessões Plenárias</div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stats.total_sessoes}</div>
            <div className="text-blue-600 text-xs font-semibold pt-1">{stats.sessoes_ano_atual} em 2026</div>
          </div>

        </div>
        </section>
      )}

      {/* Quick Access Modules Grid */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Acesso Rápido aos Módulos</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Module 1: Materias */}
          <div
            onClick={() => onSelectTab('materias')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 hover:border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                Matérias Legislativas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Projetos de lei, requerimentos, indicações e pareceres.
              </p>
            </div>
          </div>

          {/* Module 2: Normas */}
          <div
            onClick={() => onSelectTab('normas')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 hover:border-slate-800"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:bg-slate-800 group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-800 transition-colors">
                Normas Jurídicas
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Leis ordinárias, decretos e resoluções publicadas.
              </p>
            </div>
          </div>

          {/* Module 3: Sessoes */}
          <div
            onClick={() => onSelectTab('sessoes')}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group space-y-2 hover:border-emerald-600"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                Sessões Plenárias
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pautas, atas, presença de vereadores e áudios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Native Banner */}
      <AdContainer format="auto" />

      {/* Main Pillars Content Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Materias (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Matérias Legislativas Recentes</span>
            </h2>
            <button
              onClick={() => onSelectTab('materias')}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <SkeletonList count={2} />
          ) : (
            <div className="space-y-3">
              {materias.map(m => (
                <MateriaCard key={m.id} materia={m} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Sessao Plenaria & Normas Side Column */}
        <div className="space-y-6">
          {/* Next / Recent Sessao */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Sessão Plenária Destaque</span>
              </h2>
              <button
                onClick={() => onSelectTab('sessoes')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Ver pautas
              </button>
            </div>

            {loading ? (
              <SkeletonList count={1} />
            ) : sessoes.length > 0 ? (
              <SessaoCard sessao={sessoes[0]} />
            ) : null}
          </div>

          {/* Recent Normas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-700" />
                <span>Últimas Leis & Normas</span>
              </h2>
              <button
                onClick={() => onSelectTab('normas')}
                className="text-xs font-bold text-slate-700 hover:underline"
              >
                Ver acervo
              </button>
            </div>

            {loading ? (
              <SkeletonList count={2} />
            ) : (
              <div className="space-y-3">
                {normas.map(n => (
                  <NormaCard key={n.id} norma={n} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

