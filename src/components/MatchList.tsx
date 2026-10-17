import React, { useState, useMemo } from 'react';
import type { Match, Team, AttendanceStatus } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { formatMatchDate, formatDeadline, getConfirmationUrl, copyToClipboard } from '../services/whatsappService';
import { TeamCrest } from './TeamCrest';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Plus,
  Share2,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  BarChart2,
  DollarSign,
  Award,
  Edit2,
  Sparkles,
  Filter,
  ChevronDown,
  Search,
  ArrowUpDown,
  X,
  RotateCcw,
  UserCheck,
  Timer,
  Bell,
  Backpack,
} from 'lucide-react';

interface MatchListProps {
  team: Team | null;
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  onNewMatch: () => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchStats: (matchId: string) => void;
  onOpenMatchdayGraphic?: (match: Match) => void;
  onOpenAIPrompt?: (match: Match) => void;
  onOpenPostMatch?: (match: Match) => void;
  onOpenTacticalBoard?: (matchId: string) => void;
}

type TabFilter = 'all' | 'scheduled' | 'played';
type SortOrder = 'smart' | 'asc' | 'desc';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Helper to determine if a match has finished / played
 */
const isMatchPlayed = (m: Match): boolean => {
  return m.matchState === 'Finalizado' || Boolean(m.score?.isPlayed);
};

/**
 * Extracts year and month key "YYYY-MM" from date string "YYYY-MM-DD"
 */
const getMonthKey = (dateStr: string): string => {
  if (!dateStr) return 'sin-fecha';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    return `${parts[0]}-${parts[1]}`;
  }
  return 'sin-fecha';
};

/**
 * Formats "YYYY-MM" to readable Spanish label "Octubre 2026"
 */
const formatMonthLabel = (monthKey: string): string => {
  if (monthKey === 'sin-fecha') return 'Sin fecha';
  const parts = monthKey.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthName = MONTH_NAMES[monthNum - 1] || parts[1];
    return `${monthName} ${year}`;
  }
  return monthKey;
};

export const MatchList: React.FC<MatchListProps> = ({
  team,
  matches,
  onSelectMatch,
  onNewMatch,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchStats,
  onOpenMatchdayGraphic,
  onOpenAIPrompt,
  onOpenPostMatch,
  onOpenTacticalBoard,
}) => {
  const { isAdminMode } = useAccessMode();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const teamName = team?.name || 'Colonia San Luis F.C';

  // Filters & Sorting state
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('smart');

  // Interactive status filter drawer state per match
  const [expandedStatusByMatch, setExpandedStatusByMatch] = useState<Record<string, AttendanceStatus | null>>({});

  const handleToggleStatusFilter = (e: React.MouseEvent, matchId: string, status: AttendanceStatus) => {
    e.stopPropagation();
    setExpandedStatusByMatch((prev) => {
      const current = prev[matchId];
      return {
        ...prev,
        [matchId]: current === status ? null : status,
      };
    });
  };

  // Clipboard copy handler
  const handleCopyLink = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    const url = getConfirmationUrl(matchId);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(matchId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Delete match handler
  const handleDelete = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este partido y su convocatoria?')) {
      onDeleteMatch(matchId);
    }
  };

  // Open stats handler
  const handleOpenStats = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    onOpenMatchStats(matchId);
  };

  // Global counts
  const totalCount = matches.length;
  const scheduledTotalCount = useMemo(() => matches.filter((m) => !isMatchPlayed(m)).length, [matches]);
  const playedTotalCount = useMemo(() => matches.filter((m) => isMatchPlayed(m)).length, [matches]);

  // Aggregate stats from played matches
  const totalGoalsTeam = useMemo(() => {
    return matches.reduce((sum, m) => {
      const statsSum = (m.playerStats || []).reduce((s, p) => s + (p.goals || 0), 0);
      const scoreGoals = m.score?.homeGoals || 0;
      return sum + Math.max(statsSum, scoreGoals);
    }, 0);
  }, [matches]);

  // Extract available months from matches
  const availableMonths = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        total: number;
        scheduled: number;
        played: number;
      }
    >();

    matches.forEach((m) => {
      const key = getMonthKey(m.date);
      const existing = map.get(key) || {
        key,
        label: formatMonthLabel(key),
        total: 0,
        scheduled: 0,
        played: 0,
      };
      existing.total += 1;
      if (isMatchPlayed(m)) {
        existing.played += 1;
      } else {
        existing.scheduled += 1;
      }
      map.set(key, existing);
    });

    // Sort months in descending order (most recent first)
    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'sin-fecha') return 1;
      if (b.key === 'sin-fecha') return -1;
      return b.key.localeCompare(a.key);
    });
  }, [matches]);

  // Filtered and sorted matches
  const filteredMatches = useMemo(() => {
    return matches
      .filter((m) => {
        // 1. Status Filter
        const played = isMatchPlayed(m);
        if (activeTab === 'scheduled' && played) return false;
        if (activeTab === 'played' && !played) return false;

        // 2. Month Filter
        if (selectedMonth !== 'all') {
          const mKey = getMonthKey(m.date);
          if (mKey !== selectedMonth) return false;
        }

        // 3. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const rival = (m.rival || '').toLowerCase();
          const tournament = (m.tournamentName || '').toLowerCase();
          const location = (m.location || '').toLowerCase();
          if (!rival.includes(q) && !tournament.includes(q) && !location.includes(q)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateTimeA = `${a.date || ''}T${a.time || '00:00'}`;
        const dateTimeB = `${b.date || ''}T${b.time || '00:00'}`;

        if (sortOrder === 'asc') {
          return dateTimeA.localeCompare(dateTimeB);
        }
        if (sortOrder === 'desc') {
          return dateTimeB.localeCompare(dateTimeA);
        }

        // Smart sorting:
        // When showing scheduled: nearest upcoming first (chronological asc)
        if (activeTab === 'scheduled') {
          return dateTimeA.localeCompare(dateTimeB);
        }
        // When showing played: most recent finished first (chronological desc)
        if (activeTab === 'played') {
          return dateTimeB.localeCompare(dateTimeA);
        }

        // When showing all: Scheduled first (nearest upcoming first), then Played (most recent first)
        const aPlayed = isMatchPlayed(a);
        const bPlayed = isMatchPlayed(b);
        if (!aPlayed && bPlayed) return -1;
        if (aPlayed && !bPlayed) return 1;
        if (!aPlayed && !bPlayed) return dateTimeA.localeCompare(dateTimeB);
        return dateTimeB.localeCompare(dateTimeA);
      });
  }, [matches, activeTab, selectedMonth, searchQuery, sortOrder]);

  // Group filtered matches by month for structured display
  const groupedMatches = useMemo(() => {
    const groups: { [key: string]: { key: string; label: string; matches: Match[] } } = {};
    filteredMatches.forEach((m) => {
      const key = getMonthKey(m.date);
      if (!groups[key]) {
        groups[key] = {
          key,
          label: formatMonthLabel(key),
          matches: [],
        };
      }
      groups[key].matches.push(m);
    });
    return Object.values(groups);
  }, [filteredMatches]);

  // Reset all filters
  const handleResetFilters = () => {
    setActiveTab('all');
    setSelectedMonth('all');
    setSearchQuery('');
    setSortOrder('smart');
  };

  const hasActiveFilters =
    activeTab !== 'all' || selectedMonth !== 'all' || searchQuery.trim() !== '' || sortOrder !== 'smart';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <Calendar className="w-4 h-4 text-emerald-700" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Partidos y Convocatorias
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Organiza tus partidos programados y jugados, filtra por mes y gestiona convocatorias, arbitraje y marcadores
          </p>
        </div>

        {isAdminMode && (
          <button
            onClick={onNewMatch}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex-shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Partido</span>
          </button>
        )}
      </div>

      {/* 2. Control Zone: Tabs (Programados vs Jugados) + Dropdown por Mes + Búsqueda */}
      {totalCount > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Primary Segmented Control: Programados vs Jugados vs Todos */}
            <div className="inline-flex p-1 bg-gray-100/90 rounded-2xl border border-gray-200/80 max-w-full overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('scheduled')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'scheduled'
                    ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-black/5 font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Clock className={`w-3.5 h-3.5 ${activeTab === 'scheduled' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>Programados</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'scheduled'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {scheduledTotalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('played')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'played'
                    ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-black/5 font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Trophy className={`w-3.5 h-3.5 ${activeTab === 'played' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>Jugados</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'played'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {playedTotalCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'all'
                    ? 'bg-white text-emerald-900 shadow-xs ring-1 ring-black/5 font-black'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${activeTab === 'all' ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span>Todos</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    activeTab === 'all'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {totalCount}
                </span>
              </button>
            </div>

            {/* Dropdown de Meses + Ordenación */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dropdown por Mes */}
              <div className="relative flex-1 sm:flex-initial min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-700">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-50 hover:bg-gray-100/80 border border-gray-300 focus:border-emerald-600 rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition appearance-none cursor-pointer"
                  title="Filtrar partidos por mes"
                >
                  <option value="all">📅 Todos los meses ({totalCount})</option>
                  {availableMonths.map((m) => {
                    const countForCurrentTab =
                      activeTab === 'scheduled'
                        ? m.scheduled
                        : activeTab === 'played'
                        ? m.played
                        : m.total;
                    return (
                      <option key={m.key} value={m.key}>
                        {m.label} ({countForCurrentTab} {countForCurrentTab === 1 ? 'partido' : 'partidos'})
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Selector de Orden */}
              <div className="relative">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="pl-3 pr-7 py-2 bg-gray-50 hover:bg-gray-100/80 border border-gray-300 focus:border-emerald-600 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none transition appearance-none cursor-pointer"
                  title="Ordenar por fecha"
                >
                  <option value="smart">
                    {activeTab === 'scheduled'
                      ? '⚡ Próximos primero'
                      : activeTab === 'played'
                      ? '⚡ Recientes primero'
                      : '⚡ Orden inteligente'}
                  </option>
                  <option value="desc">⬇️ Más recientes a antiguos</option>
                  <option value="asc">⬆️ Más antiguos a recientes</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-gray-400">
                  <ChevronDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Filter Row: Quick Search + Active Tags */}
          <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por rival, cancha o torneo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 focus:border-emerald-500 rounded-xl text-xs text-gray-800 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick Metrics & Reset */}
            <div className="flex items-center gap-2 flex-wrap text-gray-500 text-[11px]">
              <span className="font-semibold">
                Mostrando <strong className="text-gray-800">{filteredMatches.length}</strong> de {totalCount} partidos
              </span>

              {selectedMonth !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px]">
                  <span>Mes: {formatMonthLabel(selectedMonth)}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('all')}
                    className="hover:text-emerald-950 cursor-pointer ml-0.5"
                    title="Quitar filtro de mes"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer ml-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar filtros</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Empty State: No matches in database */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No hay partidos creados</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Comienza programando el primer partido con fecha, hora, rival y los convocados de tu equipo.
          </p>
          <button
            onClick={onNewMatch}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Partido</span>
          </button>
        </div>
      ) : filteredMatches.length === 0 ? (
        /* Empty State: Filter yielded no matches */
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="font-black text-gray-900 text-sm">
            {activeTab === 'scheduled'
              ? 'No hay partidos programados para este filtro'
              : activeTab === 'played'
              ? 'No hay partidos jugados en esta selección'
              : 'No se encontraron partidos con los filtros aplicados'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Intenta seleccionar otro mes en la lista desplegable o borra el término de búsqueda para ver todos los encuentros.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              Restablecer Filtros
            </button>
            {isAdminMode && (
              <button
                onClick={onNewMatch}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                + Programar Partido
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 4. Match Groups by Month or Sequential List */
        <div className="space-y-7">
          {groupedMatches.map((group) => {
            return (
              <div key={group.key} className="space-y-3.5">
                {/* Visual Month Header Ribbon (shown when multiple months or in 'all' view) */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h3 className="text-sm font-black text-gray-800 tracking-tight flex items-center gap-2">
                      <span>{group.label}</span>
                      <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                        {group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}
                      </span>
                    </h3>
                  </div>

                  <span className="text-[11px] font-semibold text-gray-400">
                    {group.matches.filter((m) => !isMatchPlayed(m)).length} programados •{' '}
                    {group.matches.filter((m) => isMatchPlayed(m)).length} jugados
                  </span>
                </div>

                {/* Match Cards for this Month */}
                <div className="grid grid-cols-1 gap-4">
                  {group.matches.map((match) => {
                    const confirmedCount = match.callups.filter((c) => c.status === 'Confirmado').length;
                    const declinedCount = match.callups.filter((c) => c.status === 'No asiste').length;
                    const pendingCount = match.callups.filter((c) => c.status === 'Pendiente').length;
                    const totalCallups = match.callups.length;

                    const isFinished = isMatchPlayed(match);
                    const homeScore = match.score?.homeGoals ?? 0;
                    const awayScore = match.score?.awayGoals ?? 0;

                    const totalGoalsScored = (match.playerStats || []).reduce((s, p) => s + (p.goals || 0), 0);
                    const totalAssists = (match.playerStats || []).reduce((s, p) => s + (p.assists || 0), 0);
                    const totalCards = (match.playerStats || []).reduce(
                      (s, p) => s + (p.yellowCards || 0) + (p.redCards || 0),
                      0
                    );

                    return (
                      <div
                        key={match.id}
                        onClick={() => onSelectMatch(match.id)}
                        className="bg-white rounded-3xl border border-gray-200 hover:border-emerald-500 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
                      >
                        {/* Header Ribbon */}
                        <div className="bg-gray-50 px-5 py-2.5 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                          <div className="flex items-center gap-2">
                            {match.tournamentName && (
                              <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-lg text-[11px]">
                                <Trophy className="w-3 h-3 text-emerald-600" />
                                {match.tournamentName}
                              </span>
                            )}

                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                match.status === 'Abierta'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {match.status === 'Cerrada' && <Lock className="w-3 h-3 text-gray-500" />}
                              Convocatoria {match.status}
                            </span>

                            {isFinished ? (
                              <span className="inline-flex items-center gap-1 font-black text-[10px] uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md shadow-2xs">
                                Finalizado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-black text-[10px] uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                                Programado
                              </span>
                            )}
                          </div>

                          {/* Match Date & Time */}
                          <div className="flex items-center gap-3 text-gray-500 text-[11px] font-medium">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                              {formatMatchDate(match.date)}
                            </span>
                            {match.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                                {match.time}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Visual Scoreboard / Clash Section */}
                        <div className="p-5 sm:p-6 bg-gradient-to-b from-white via-gray-50/40 to-white">
                          <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 py-1">
                            {/* Left: Home Team */}
                            <div className="col-span-3 flex flex-col items-center justify-center text-center">
                              <TeamCrest name={teamName} isOurTeam size="lg" className="flex-shrink-0" />
                              <h3 className="font-black text-gray-900 text-xs sm:text-base leading-tight mt-2 text-center group-hover:text-emerald-700 transition line-clamp-2 max-w-[200px]">
                                {teamName}
                              </h3>
                            </div>

                            {/* Center: Marcador / Scoreboard or VS */}
                            <div className="col-span-1 flex flex-col items-center justify-center">
                              {isFinished ? (
                                <div className="flex flex-col items-center">
                                  <div className="relative bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-2xl shadow-lg border border-emerald-500/40 text-center ring-1 ring-emerald-500/20">
                                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                                      FINAL
                                    </span>
                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono font-black text-xl sm:text-3xl tracking-tight">
                                      <span className="text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]">
                                        {homeScore}
                                      </span>
                                      <span className="text-emerald-500 text-sm sm:text-lg font-sans">-</span>
                                      <span className="text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]">
                                        {awayScore}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-white flex flex-col items-center justify-center shadow-md border-2 border-emerald-400/60 group-hover:scale-105 group-hover:border-emerald-300 transition transform">
                                    <span className="font-black text-xs sm:text-sm tracking-wider drop-shadow-sm">VS</span>
                                  </div>
                                  {match.time && (
                                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 mt-1">
                                      {match.time}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Right: Rival Team */}
                            <div className="col-span-3 flex flex-col items-center justify-center text-center">
                              <TeamCrest name={match.rival} isOurTeam={false} size="lg" className="flex-shrink-0" />
                              <h3 className="font-black text-gray-900 text-xs sm:text-base leading-tight mt-2 text-center group-hover:text-emerald-700 transition line-clamp-2 max-w-[200px]">
                                {match.rival}
                              </h3>
                            </div>
                          </div>

                          {/* Location, Referee & Stats bar */}
                          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
                            <div className="flex items-center gap-3 flex-wrap">
                              {match.location && (
                                <span className="flex items-center gap-1 font-medium text-gray-700">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                  {match.location}
                                </span>
                              )}
                              {match.refereeFee && (
                                <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                                  <DollarSign className="w-3 h-3 text-emerald-600" />
                                  Arbitraje: {match.refereeFee}
                                </span>
                              )}
                              {match.refereeCollectorName && (
                                <span
                                  className="flex items-center gap-1 font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]"
                                  title={`Arbitraje recogido por: ${match.refereeCollectorName}`}
                                >
                                  <UserCheck className="w-3 h-3 text-purple-600" />
                                  Recogió: {match.refereeCollectorName}
                                </span>
                              )}
                              {match.suggestedArrivalTime && (
                                <span
                                  className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold text-[11px]"
                                  title={`Llegada sugerida a la cancha: ${match.suggestedArrivalTime}`}
                                >
                                  <Timer className="w-3 h-3 text-amber-600" />
                                  Llegada: {match.suggestedArrivalTime}
                                </span>
                              )}
                              {match.confirmationDeadline && (
                                <span
                                  className="inline-flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200 px-2 py-0.5 rounded-md font-bold text-[11px]"
                                  title={`Cierre de convocatoria: ${formatDeadline(match.confirmationDeadline)}`}
                                >
                                  <Bell className="w-3 h-3 text-rose-600" />
                                  Cierre: {formatDeadline(match.confirmationDeadline)}
                                </span>
                              )}
                              {match.itemsToBring && match.itemsToBring.length > 0 && (
                                <span
                                  className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold text-[11px]"
                                  title={`Implementos requeridos: ${match.itemsToBring.join(' • ')}`}
                                >
                                  <Backpack className="w-3 h-3 text-emerald-700" />
                                  {match.itemsToBring.length} implementos
                                </span>
                              )}
                            </div>

                            {/* Stats summary badge if recorded */}
                            {(totalGoalsScored > 0 || totalAssists > 0 || totalCards > 0 || (match.substitutions && match.substitutions.length > 0) || isFinished) && (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                                <span>⚽ {totalGoalsScored} Goles</span>
                                <span>•</span>
                                <span>👟 {totalAssists} Asist.</span>
                                {totalCards > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>🟨 {totalCards} Tarjetas</span>
                                  </>
                                )}
                                {match.substitutions && match.substitutions.length > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>🔄 {match.substitutions.length} Cambios</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer Bar: Attendance Counters & Action Buttons */}
                        <div className="bg-gray-50/90 px-4 sm:px-5 py-3.5 border-t border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                          {/* Attendance Summary Group */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                            {/* Micro Progress Bar */}
                            <div
                              className="w-full sm:w-28 bg-gray-200 rounded-full h-2 overflow-hidden flex shadow-inner flex-shrink-0"
                              title={`Confirmados: ${confirmedCount}, No van: ${declinedCount}, Pendientes: ${pendingCount}`}
                            >
                              <div
                                style={{
                                  width: `${totalCallups > 0 ? (confirmedCount / totalCallups) * 100 : 0}%`,
                                }}
                                className="bg-emerald-500 h-full transition-all"
                              />
                              <div
                                style={{
                                  width: `${totalCallups > 0 ? (declinedCount / totalCallups) * 100 : 0}%`,
                                }}
                                className="bg-rose-500 h-full transition-all"
                              />
                              <div
                                style={{
                                  width: `${totalCallups > 0 ? (pendingCount / totalCallups) * 100 : 0}%`,
                                }}
                                className="bg-amber-400 h-full transition-all"
                              />
                            </div>

                            {/* Status Badges Row (Botones interactivos para ver resumen de jugadores) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* Confirmados */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatusFilter(e, match.id, 'Confirmado')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  expandedStatusByMatch[match.id] === 'Confirmado'
                                    ? 'bg-emerald-200 text-emerald-950 border border-emerald-600 ring-2 ring-emerald-500/40'
                                    : 'bg-emerald-50 text-emerald-900 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300'
                                }`}
                                title="Toca para ver los jugadores confirmados"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                <span>{confirmedCount}</span>
                                <span className="text-[10px] font-bold text-emerald-700">Confirmados</span>
                                <span className="text-[9px] font-bold text-emerald-800 ml-0.5">
                                  {expandedStatusByMatch[match.id] === 'Confirmado' ? '▲' : '▼'}
                                </span>
                              </button>

                              {/* No Asisten */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatusFilter(e, match.id, 'No asiste')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  expandedStatusByMatch[match.id] === 'No asiste'
                                    ? 'bg-rose-200 text-rose-950 border border-rose-600 ring-2 ring-rose-500/40'
                                    : 'bg-rose-50 text-rose-900 border border-rose-200/90 hover:bg-rose-100 hover:border-rose-300'
                                }`}
                                title="Toca para ver los jugadores que no van"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                                <span>{declinedCount}</span>
                                <span className="text-[10px] font-bold text-rose-700">No van</span>
                                <span className="text-[9px] font-bold text-rose-800 ml-0.5">
                                  {expandedStatusByMatch[match.id] === 'No asiste' ? '▲' : '▼'}
                                </span>
                              </button>

                              {/* Pendientes */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatusFilter(e, match.id, 'Pendiente')}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-black text-xs transition-all cursor-pointer shadow-2xs active:scale-95 ${
                                  expandedStatusByMatch[match.id] === 'Pendiente'
                                    ? 'bg-amber-200 text-amber-950 border border-amber-600 ring-2 ring-amber-500/40'
                                    : 'bg-amber-50 text-amber-950 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300'
                                }`}
                                title="Toca para ver los jugadores pendientes"
                              >
                                <HelpCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>{pendingCount}</span>
                                <span className="text-[10px] font-bold text-amber-800">Pendientes</span>
                                <span className="text-[9px] font-bold text-amber-800 ml-0.5">
                                  {expandedStatusByMatch[match.id] === 'Pendiente' ? '▲' : '▼'}
                                </span>
                              </button>

                              <span className="text-[11px] text-gray-500 font-bold ml-1">
                                / {totalCallups} conv.
                              </span>
                            </div>
                          </div>

                          {/* Actions Toolbar */}
                          <div className="flex items-center gap-2 justify-end flex-wrap">
                            {/* Botón Cartelera Matchday (solo admin) */}
                            {isAdminMode && onOpenMatchdayGraphic && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenMatchdayGraphic(match);
                                }}
                                className="px-3 py-2 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                title="Cartelera oficial Matchday para redes sociales y WhatsApp"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                                <span>Cartelera Matchday</span>
                              </button>
                            )}

                            {/* Botón Pizarra & Alineación */}
                            {onOpenTacticalBoard && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTacticalBoard(match.id);
                                }}
                                className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                title="Pizarra táctica y alineación de este partido"
                              >
                                <span>📋</span>
                                <span>Alineación</span>
                              </button>
                            )}

                            {/* Botón Tesorería y Arbitrajes */}
                            {onOpenPostMatch && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenPostMatch(match);
                                }}
                                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                title="Tesorería, recaudo de arbitrajes y cuotas de este partido"
                              >
                                <DollarSign className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                                <span>Tesorería y Arbitrajes</span>
                              </button>
                            )}

                            {/* Botón Confirmaciones */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectMatch(match.id);
                              }}
                              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-extrabold text-xs flex items-center gap-1.5 border border-emerald-200 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                              title="Ver y gestionar confirmaciones de asistencia del plantel"
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                              <span>Confirmaciones</span>
                            </button>

                            {/* Botón Cargar/Ver Estadísticas del Partido */}
                            {(isAdminMode || isFinished) && (
                              <button
                                onClick={(e) => handleOpenStats(e, match.id)}
                                className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                                title={
                                  isAdminMode
                                    ? 'Cargar o editar resultado, goles, cambios y minutos'
                                    : 'Ver estadísticas del partido'
                                }
                              >
                                <BarChart2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                <span>Estadísticas del Partido</span>
                              </button>
                            )}

                            {/* Botón Copiar enlace */}
                            <button
                              onClick={(e) => handleCopyLink(e, match.id)}
                              className="px-3 py-2 text-gray-700 hover:text-emerald-800 hover:bg-emerald-50 bg-white rounded-xl transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-gray-200 shadow-2xs active:scale-95"
                              title="Copiar enlace de confirmación pública"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                              <span>{copiedId === match.id ? '¡Copiado!' : 'Enlace'}</span>
                            </button>

                            {/* Botón Editar Partido (solo admin) */}
                            {isAdminMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditMatch(match);
                                }}
                                className="px-2.5 py-2 text-gray-700 hover:text-emerald-800 hover:bg-emerald-50 bg-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold border border-gray-200 shadow-2xs active:scale-95"
                                title="Editar datos del partido y convocados"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                                <span>Editar</span>
                              </button>
                            )}

                            {/* Botón Eliminar (solo admin) */}
                            {isAdminMode && (
                              <button
                                onClick={(e) => handleDelete(e, match.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 bg-white rounded-xl transition-all cursor-pointer border border-gray-200 shadow-2xs active:scale-95"
                                title="Eliminar partido"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Flecha Convocatoria */}
                            <div
                              className="p-1 text-emerald-700 group-hover:translate-x-1 transition-transform"
                              title="Abrir convocatoria"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </div>
                          </div>
                        </div>

                        {/* Expandable filtered players summary for this match */}
                        {expandedStatusByMatch[match.id] && (() => {
                          const currentFilter = expandedStatusByMatch[match.id]!;
                          const filteredList = (match.callups || []).filter((c) => c.status === currentFilter);
                          return (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="bg-white px-4 sm:px-5 py-3.5 border-t border-gray-200 space-y-2.5 animate-fade-in text-xs"
                            >
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                  {currentFilter === 'Confirmado' && (
                                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  {currentFilter === 'No asiste' && (
                                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0">
                                      <XCircle className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  {currentFilter === 'Pendiente' && (
                                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                                      <HelpCircle className="w-3.5 h-3.5" />
                                    </span>
                                  )}
                                  <div>
                                    <span className="font-extrabold text-xs text-gray-900 block leading-tight">
                                      {currentFilter === 'Confirmado' && `Jugadores Confirmados (${filteredList.length})`}
                                      {currentFilter === 'No asiste' && `Jugadores que No Van (${filteredList.length})`}
                                      {currentFilter === 'Pendiente' && `Jugadores Pendientes (${filteredList.length})`}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {currentFilter === 'Confirmado' && 'Asistirán al partido'}
                                      {currentFilter === 'No asiste' && 'Reportaron que no asistirán'}
                                      {currentFilter === 'Pendiente' && 'Aún no han confirmado su asistencia'}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedStatusByMatch((prev) => ({ ...prev, [match.id]: null }))
                                  }
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                                  title="Cerrar resumen"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {filteredList.length === 0 ? (
                                <div className="py-3 text-center text-xs text-gray-400 font-medium">
                                  No hay jugadores en este estado para este partido.
                                </div>
                              ) : (
                                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50 no-scrollbar">
                                   {filteredList.map((c) => (
                                    <div
                                      key={c.playerId}
                                      className="pt-1.5 first:pt-0 flex items-center justify-between gap-2"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        {c.photoUrl ? (
                                          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-emerald-600 flex-shrink-0 bg-emerald-100 shadow-2xs">
                                            <img src={c.photoUrl} alt={c.fullName} className="w-full h-full object-cover" />
                                            <div className="absolute bottom-0 right-0 bg-emerald-950 text-white font-black text-[6px] min-w-[10px] h-2.5 px-0.5 rounded-full flex items-center justify-center border border-white">
                                              {c.jerseyNumber}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-800 font-black text-[10px] flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                            {c.jerseyNumber ? `#${c.jerseyNumber}` : '—'}
                                          </span>
                                        )}
                                        <span className="font-bold text-gray-900 truncate">
                                          {c.fullName}
                                        </span>
                                        {c.phone && (
                                          <span className="text-[10px] text-gray-400 truncate hidden sm:inline">
                                            ({c.phone})
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {currentFilter === 'No asiste' && c.reason && (
                                          <span
                                            className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md max-w-[150px] truncate"
                                            title={`Motivo: ${c.reason}`}
                                          >
                                            Motivo: {c.reason}
                                          </span>
                                        )}
                                        {currentFilter === 'Confirmado' && (
                                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                            ✓ Listo
                                          </span>
                                        )}
                                        {currentFilter === 'Pendiente' && (
                                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                                            ⏳ Por responder
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-[11px] text-gray-400">
                                  {filteredList.length} de {(match.callups || []).length} convocados
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onSelectMatch(match.id)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Gestionar convocatoria completa</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
