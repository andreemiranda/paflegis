/**
 * DocumentTypeView — página unificada por tipo de documento.
 *
 * Busca simultaneamente em Matérias Legislativas e Normas Jurídicas pelo mesmo
 * tipo, mescla os resultados e os ordena por data decrescente (mais recente
 * primeiro). Usa uma única paginação combinada.
 *
 * Rota: tipo:both:<slug>  (todos os itens do menu apontam para 'both')
 * Mantém suporte a tipo:materia:<slug> e tipo:norma:<slug> para compatibilidade.
 */
import React, { useState, useEffect } from 'react';
import {
  FileText,
  BookOpen,
  Layers,
  Search,
  Filter,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { MateriaLegislativa, NormaJuridica, TipoFiltro } from '../types';
import { getMaterias, getNormas, getTiposMaterias, getTiposNormas } from '../lib/api/sapl';
import { MateriaCard } from '../components/MateriaCard';
import { NormaCard } from '../components/NormaCard';
import { SkeletonList } from '../components/SkeletonLoaders';
import { AdContainer } from '../components/AdContainer';
import { Pagination } from '../components/Pagination';
import { toSlug } from '../lib/slugUtils';

type Categoria = 'materia' | 'norma' | 'both';

export interface DocumentTypeViewProps {
  categoria: Categoria;
  slug: string;
}

// Item unificado com data normalizada para ordenação
type UnifiedItem =
  | { kind: 'materia'; data: MateriaLegislativa; date: string }
  | { kind: 'norma';   data: NormaJuridica;      date: string };

const ANOS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

// Converte "DD/MM/YYYY" → "YYYY-MM-DD" para ordenação lexicográfica correta
function brDateToISO(s: string | undefined): string {
  if (!s) return '0000-00-00';
  const p = s.split('/');
  if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
  return s;
}

// ── Seção pura Matéria (categoria='materia') ──────────────────────────────────
const MateriaOnlySection: React.FC<{
  tipoId: number; busca: string; ano: string;
  pagina: number; limite: number;
  onTotal: (t: number, tp: number) => void;
}> = ({ tipoId, busca, ano, pagina, limite, onTotal }) => {
  const [items, setItems]     = useState<MateriaLegislativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const res = await getMaterias({ busca, tipo: String(tipoId), ano, pagina, limite });
        if (!cancelled) { setItems(res.items); onTotal(res.total, res.totalPages); }
      } catch {
        if (!cancelled) { setError(true); setItems([]); onTotal(0, 0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [tipoId, busca, ano, pagina, limite]);

  if (error) return <ErrorBanner kind="materia" />;
  if (loading) return <SkeletonList count={3} />;
  if (items.length === 0) return <EmptyState kind="materia" />;
  return <div className="space-y-3">{items.map(m => <MateriaCard key={m.id} materia={m} />)}</div>;
};

// ── Seção pura Norma (categoria='norma') ──────────────────────────────────────
const NormaOnlySection: React.FC<{
  tipoId: number; busca: string; ano: string;
  pagina: number; limite: number;
  onTotal: (t: number, tp: number) => void;
}> = ({ tipoId, busca, ano, pagina, limite, onTotal }) => {
  const [items, setItems]     = useState<NormaJuridica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const res = await getNormas({ busca, tipo: String(tipoId), ano, pagina, limite });
        if (!cancelled) { setItems(res.items); onTotal(res.total, res.totalPages); }
      } catch {
        if (!cancelled) { setError(true); setItems([]); onTotal(0, 0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [tipoId, busca, ano, pagina, limite]);

  if (error) return <ErrorBanner kind="norma" />;
  if (loading) return <SkeletonList count={3} />;
  if (items.length === 0) return <EmptyState kind="norma" />;
  return <div className="space-y-3">{items.map(n => <NormaCard key={n.id} norma={n} />)}</div>;
};

// ── Seção unificada (categoria='both') ────────────────────────────────────────
const BothSection: React.FC<{
  tipoId: number; busca: string; ano: string;
  pagina: number; limite: number;
  onTotal: (total: number, totalPages: number) => void;
}> = ({ tipoId, busca, ano, pagina, limite, onTotal }) => {
  const [unified, setUnified]   = useState<UnifiedItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true); setError(false);
      try {
        const half = Math.ceil(limite / 2);
        const [rm, rn] = await Promise.allSettled([
          getMaterias({ busca, tipo: String(tipoId), ano, pagina, limite: half }),
          getNormas  ({ busca, tipo: String(tipoId), ano, pagina, limite: half }),
        ]);

        if (cancelled) return;

        const materias = rm.status === 'fulfilled' ? rm.value : { items: [], total: 0, totalPages: 0 };
        const normas   = rn.status === 'fulfilled' ? rn.value : { items: [], total: 0, totalPages: 0 };

        const merged: UnifiedItem[] = [
          ...materias.items.map(m => ({
            kind: 'materia' as const,
            data: m,
            date: brDateToISO(m.data_apresentacao),
          })),
          ...normas.items.map(n => ({
            kind: 'norma' as const,
            data: n,
            date: brDateToISO(n.data_publicacao),
          })),
        ];

        // Ordena por data decrescente (mais recente primeiro)
        merged.sort((a, b) => b.date.localeCompare(a.date));

        // Total combinado e páginas (baseado no maior dos dois)
        const totalCombined   = materias.total      + normas.total;
        const pagesCombined   = Math.ceil(totalCombined / limite);

        setUnified(merged);
        onTotal(totalCombined, pagesCombined);
      } catch {
        if (!cancelled) { setError(true); setUnified([]); onTotal(0, 0); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [tipoId, busca, ano, pagina, limite]);

  if (error) return <ErrorBanner kind="both" />;
  if (loading) return <SkeletonList count={4} />;
  if (unified.length === 0) return <EmptyState kind="both" />;

  return (
    <div className="space-y-3">
      {unified.map(item =>
        item.kind === 'materia'
          ? <MateriaCard key={`m-${item.data.id}`} materia={item.data} />
          : <NormaCard   key={`n-${item.data.id}`} norma={item.data}   />
      )}
    </div>
  );
};

// ── Helpers de UI ─────────────────────────────────────────────────────────────
const ErrorBanner: React.FC<{ kind: string }> = ({ kind }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
    <p className="text-sm text-red-700">
      Não foi possível carregar os {kind === 'norma' ? 'normas' : 'matérias'}. Tente novamente.
    </p>
  </div>
);

const EmptyState: React.FC<{ kind: string }> = ({ kind }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2">
    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
    <p className="font-bold text-slate-800 text-sm">
      Nenhum documento encontrado
    </p>
    <p className="text-xs text-slate-500">
      {kind === 'both'
        ? 'Nenhuma matéria nem norma encontrada para este tipo com os filtros selecionados.'
        : 'Tente remover alguns filtros ou alterar o ano de pesquisa.'}
    </p>
  </div>
);

// ── View principal ─────────────────────────────────────────────────────────────
export const DocumentTypeView: React.FC<DocumentTypeViewProps> = ({ categoria, slug }) => {
  const [nome, setNome]             = useState<string | null>(null);
  const [tipoId, setTipoId]         = useState<number | null>(null);
  const [resolving, setResolving]   = useState(true);
  const [busca, setBusca]           = useState('');
  const [anoSelecao, setAnoSelecao] = useState('');
  const [pagina, setPagina]         = useState(1);
  const [limite, setLimite]         = useState(10);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Reset de página ao mudar filtros
  useEffect(() => { setPagina(1); }, [busca, anoSelecao, slug]);

  // Resolve o nome completo a partir do slug
  useEffect(() => {
    let cancelled = false;
    setResolving(true);
    async function resolve() {
      try {
        const [tm, tn] = await Promise.all([getTiposMaterias(), getTiposNormas()]);
        const todos = [...tm, ...tn];
        const found = todos.find(t => t?.nome && toSlug(t.nome) === slug);
        if (!cancelled) {
          setNome(found ? found.nome : null);
          setTipoId(found ? found.id : null);
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    }
    resolve();
    return () => { cancelled = true; };
  }, [slug]);

  const handleTotal = (t: number, tp: number) => {
    setTotal(t);
    setTotalPages(tp || 1);
  };

  const handleResetFilters = () => {
    setBusca('');
    setAnoSelecao('');
    setPagina(1);
  };

  const IconComponent =
    categoria === 'materia' ? FileText  :
    categoria === 'norma'   ? BookOpen  : Layers;

  const iconBg =
    categoria === 'materia' ? 'bg-blue-50 text-blue-600'    :
    categoria === 'norma'   ? 'bg-slate-100 text-slate-700' : 'bg-purple-50 text-purple-600';

  const descricao =
    categoria === 'materia'
      ? 'Matérias legislativas deste tipo no acervo público de Pedro Afonso - TO.'
      : categoria === 'norma'
      ? 'Normas jurídicas deste tipo no acervo público de Pedro Afonso - TO.'
      : 'Matérias e normas deste tipo no acervo público de Pedro Afonso - TO, ordenadas da mais recente para a mais antiga.';

  if (resolving) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
          <div className="h-6 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-96 bg-slate-100 rounded animate-pulse" />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  if (nome === null) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-2">
        <AlertCircle className="w-9 h-9 text-amber-500 mx-auto" />
        <h2 className="font-bold text-slate-800">Tipo de documento não encontrado</h2>
        <p className="text-xs text-slate-500">
          O tipo <code className="bg-slate-100 px-1 rounded">{slug}</code> não existe no SAPL
          ou está temporariamente indisponível.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Cabeçalho */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 font-sans">{nome}</h1>
          {total > 0 && (
            <span className="text-xs font-mono text-slate-400 ml-1">
              {total} documento{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500">{descricao}</p>
      </div>

      {/* Filtros — sem filtro de tipo */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Filtros de Pesquisa
          </span>
          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Palavra-chave */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Palavra-chave / Nº
            </label>
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Ex: 42, iluminação pública…"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Ano
            </label>
            <select
              value={anoSelecao}
              onChange={e => setAnoSelecao(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 min-h-[42px] cursor-pointer"
            >
              <option value="">Todos os Anos</option>
              {ANOS.map(a => <option key={a} value={a}>Ano {a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de documentos — passa o ID numérico para o filtro da API SAPL */}
      {categoria === 'materia' && tipoId !== null && (
        <MateriaOnlySection
          tipoId={tipoId} busca={busca} ano={anoSelecao}
          pagina={pagina} limite={limite} onTotal={handleTotal}
        />
      )}
      {categoria === 'norma' && tipoId !== null && (
        <NormaOnlySection
          tipoId={tipoId} busca={busca} ano={anoSelecao}
          pagina={pagina} limite={limite} onTotal={handleTotal}
        />
      )}
      {categoria === 'both' && tipoId !== null && (
        <BothSection
          tipoId={tipoId} busca={busca} ano={anoSelecao}
          pagina={pagina} limite={limite} onTotal={handleTotal}
        />
      )}

      {/* Paginação única */}
      {total > 0 && (
        <Pagination
          currentPage={pagina}
          totalPages={totalPages}
          totalItems={total}
          itemsPerPage={limite}
          onPageChange={setPagina}
          onItemsPerPageChange={newLimite => { setLimite(newLimite); setPagina(1); }}
        />
      )}

      <AdContainer format="auto" />
    </div>
  );
};
