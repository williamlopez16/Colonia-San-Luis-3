import React, { useMemo, useState } from 'react';
import type { Team, Match, Player, Charge, Tournament, AttendanceStatus } from '../types';
import type { AppTab } from './Header';
import { useAccessMode } from '../context/AccessModeContext';
import { AdminAccessModal } from './AdminAccessModal';
import { formatMatchDate, formatDeadline } from '../services/whatsappService';
import { TeamCrest } from './TeamCrest';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit2,
  BarChart2,
  DollarSign,
  Plus,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Sparkles,
  Shield,
  Wallet,
  FileText,
  UserCheck,
  Timer,
  Bell,
  Backpack,
} from 'lucide-react';

interface DashboardViewProps {
  team: Team | null;
  teams?: Team[];
  matches: Match[];
  players: Player[];
  charges?: Charge[];
  tournaments: Tournament[];
  onProgramMatch: () => void;
  onEditMatch: (match: Match) => void;
  onViewMatchCallups: (matchId: string) => void;
  onOpenMatchdayGraphic: (match: Match) => void;
  onOpenMatchStats: (matchId: string) => void;
  onNavigateToTab: (tab: AppTab) => void;
  onOpenAIPrompt?: (match: Match) => void;
  onOpenPostMatch?: (match: Match) => void;
  onSelectTeam?: (teamId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  team,
  teams = [],
  matches,
  players,
  charges,
  tournaments,
  onProgramMatch,
  onEditMatch,
  onViewMatchCallups,
  onOpenMatchdayGraphic,
  onOpenMatchStats,
  onNavigateToTab,
  onOpenAIPrompt,
  onOpenPostMatch,
  onSelectTeam,
}) => {
  const { isAdminMode } = useAccessMode();
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<AttendanceStatus | null>(null);

  const handleEditClick = (m: Match) => {
    if (isAdminMode) {
      onEditMatch(m);
    } else {
      setPendingAction(() => () => onEditMatch(m));
      setShowAdminModal(true);
    }
  };

  const handleProgramClick = () => {
    if (isAdminMode) {
      onProgramMatch();
    } else {
      setPendingAction(() => () => onProgramMatch());
      setShowAdminModal(true);
    }
  };

  const handleStatsClick = (matchId: string, isPlayedOrFinal: boolean) => {
    if (isAdminMode || isPlayedOrFinal) {
      onOpenMatchStats(matchId);
    } else {
      setPendingAction(() => () => onOpenMatchStats(matchId));
      setShowAdminModal(true);
    }
  };

  const teamName = team?.name || 'Colonia San Luis F.C';
  const teamSlogan = team?.slogan || 'LA PERLA VERDE DE ANTIOQUIA';

  // Compute local today's date formatted as YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Filter scheduled future matches
  const { nextMatch, otherUpcomingMatches } = useMemo(() => {
    const isScheduled = (m: Match) => m.matchState !== 'Finalizado' && !m.score?.isPlayed;

    // Filter upcoming matches on or after today
    const upcoming = matches
      .filter((m) => isScheduled(m) && m.date >= todayStr)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });

    if (upcoming.length > 0) {
      return {
        nextMatch: upcoming[0],
        otherUpcomingMatches: upcoming.slice(1),
      };
    }

    return {
      nextMatch: null,
      otherUpcomingMatches: [],
    };
  }, [matches, todayStr]);

  // Attendance counters for the next match
  const attendance = useMemo(() => {
    if (!nextMatch) return null;
    const callups = nextMatch.callups || [];
    const confirmed = callups.filter((c) => c.status === 'Confirmado').length;
    const declined = callups.filter((c) => c.status === 'No asiste').length;
    const pending = callups.filter((c) => c.status === 'Pendiente').length;
    const total = callups.length;
    return { confirmed, declined, pending, total };
  }, [nextMatch]);

  // Lookup map of players by ID for fast name, position, and jersey resolution
  const playerMap = useMemo(() => {
    const map = new Map<string, Player>();
    players.forEach((p) => map.set(p.id, p));
    return map;
  }, [players]);

  // Filtered callups for the selected interactive status
  const filteredCallups = useMemo(() => {
    if (!nextMatch || !selectedStatusFilter) return [];
    return (nextMatch.callups || []).filter((c) => c.status === selectedStatusFilter);
  }, [nextMatch, selectedStatusFilter]);

  // Financial summary: total collected and total pending
  const financialSummary = useMemo(() => {
    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return null;
    }
    let collected = 0;
    let pending = 0;
    charges.forEach((c) => {
      if (c.status === 'Pagado') collected += c.amount || 0;
      else pending += c.amount || 0;
    });
    const total = collected + pending;
    const percentage = total > 0 ? Math.round((collected / total) * 100) : 0;
    return { collected, pending, total, percentage };
  }, [charges]);

  // Active players count
  const activePlayers = useMemo(
    () => players.filter((p) => p.status === 'Activo'),
    [players]
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 0. Quick Multi-Team Switcher Bar (1-tap switching for anyone) */}
      {teams && teams.length >= 1 && (
        <div className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-xs border border-gray-200 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar animate-fade-in">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 pl-1 flex-shrink-0">
              Equipos:
            </span>
            {teams.map((t) => {
              const isActive = t.id === team?.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeam?.(t.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex-shrink-0 active:scale-95 ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 border border-transparent'
                  }`}
                  title={`Cambiar a ${t.name}`}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-white/40">
                    <img
                      src={(!t.logoUrl || t.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : t.logoUrl}
                      alt=""
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/team_logo.png';
                      }}
                    />
                  </div>
                  <span>{t.name}</span>
                  {t.category && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                        isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {t.category}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => onNavigateToTab('team')}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-1 rounded-lg hover:bg-emerald-50 transition whitespace-nowrap flex-shrink-0 cursor-pointer"
          >
            + Ver todos
          </button>
        </div>
      )}

      {/* 1. Header Club Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-md relative overflow-hidden border border-emerald-700/60">
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none select-none text-white font-black text-9xl">
          ⚽
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <TeamCrest name={teamName} isOurTeam size="lg" className="flex-shrink-0" />
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Panel Principal
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                {teamName}
              </h1>
              <p className="text-xs text-emerald-200 font-semibold tracking-wide uppercase mt-0.5">
                {teamSlogan}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:self-center">
            <button
              onClick={onProgramMatch}
              className="flex items-center gap-2 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Programar Partido</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Hero: Tarjeta de Próximo Partido */}
      {nextMatch ? (
        <section className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Card Top Banner / Ribbon */}
          <div className="bg-emerald-50/80 px-6 py-3.5 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-900 bg-emerald-100 px-3 py-1 rounded-xl">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>PRÓXIMO PARTIDO</span>
              </span>

              {nextMatch.tournamentName && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                  <Trophy className="w-3 h-3 text-emerald-600" />
                  <span>{nextMatch.tournamentName}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl ${
                  nextMatch.status === 'Abierta'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                Convocatoria {nextMatch.status}
              </span>
            </div>
          </div>

          {/* Clash Area: Visual Shield vs Shield */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-7 items-center gap-3 sm:gap-6 py-2">
              {/* Home Team (Centered) */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <TeamCrest name={teamName} isOurTeam size="xl" className="flex-shrink-0" />
                <h2 className="text-sm sm:text-lg md:text-xl font-black text-gray-900 leading-snug mt-2.5 text-center line-clamp-2 max-w-[220px]">
                  {teamName}
                </h2>
              </div>

              {/* Center: Scoreboard or VS Badge */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                {nextMatch.score?.isPlayed || nextMatch.matchState === 'Finalizado' ? (
                  <div className="flex flex-col items-center">
                    <div className="relative bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-xl border-2 border-emerald-500/40 text-center ring-1 ring-emerald-500/20">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                        FINAL
                      </span>
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 font-mono font-black text-2xl sm:text-4xl tracking-tight">
                        <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
                          {nextMatch.score?.homeGoals ?? 0}
                        </span>
                        <span className="text-emerald-500 text-base sm:text-2xl font-sans">-</span>
                        <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
                          {nextMatch.score?.awayGoals ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-white flex flex-col items-center justify-center shadow-lg border-2 border-emerald-400/60 hover:scale-105 transition transform">
                      <span className="font-black text-sm sm:text-lg tracking-wider drop-shadow-sm">VS</span>
                    </div>
                    {nextMatch.time && (
                      <span className="text-[11px] font-bold text-gray-500 mt-1.5">
                        {nextMatch.time}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Away: Rival Team (Centered) */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <TeamCrest name={nextMatch.rival} isOurTeam={false} size="xl" className="flex-shrink-0" />
                <h2 className="text-sm sm:text-lg md:text-xl font-black text-gray-900 leading-snug mt-2.5 text-center line-clamp-2 max-w-[220px]">
                  {nextMatch.rival}
                </h2>
              </div>
            </div>

            {/* Date, Time, Location & Referee details */}
            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-gray-800">
                  {formatMatchDate(nextMatch.date)}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-gray-800">
                  Hora: {nextMatch.time || 'Por definir'}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 sm:col-span-2 md:col-span-1">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold text-gray-800 truncate" title={nextMatch.location}>
                  {nextMatch.location || 'Cancha Municipal'}
                </span>
              </div>

              {nextMatch.refereeCollectorName && (
                <div className="flex items-center gap-2 bg-purple-50/90 p-2.5 rounded-xl border border-purple-200 text-purple-950 sm:col-span-2 md:col-span-3">
                  <UserCheck className="w-4 h-4 text-purple-700 flex-shrink-0" />
                  <span className="font-bold text-xs">
                    Arbitraje recogido por: <strong className="text-purple-900 font-extrabold">{nextMatch.refereeCollectorName}</strong>
                  </span>
                </div>
              )}

              {/* Opciones clave de convocatoria: Llegada, Cierre e Implementos */}
              {(nextMatch.suggestedArrivalTime || nextMatch.confirmationDeadline || (nextMatch.itemsToBring && nextMatch.itemsToBring.length > 0)) && (
                <div className="flex items-center gap-2 flex-wrap sm:col-span-2 md:col-span-3 pt-1">
                  {nextMatch.suggestedArrivalTime && (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-950 border border-amber-200/90 px-2.5 py-1 rounded-xl font-bold text-xs shadow-2xs">
                      <Timer className="w-3.5 h-3.5 text-amber-600" />
                      <span>Llegada: {nextMatch.suggestedArrivalTime}</span>
                    </span>
                  )}
                  {nextMatch.confirmationDeadline && (
                    <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-950 border border-rose-200/90 px-2.5 py-1 rounded-xl font-bold text-xs shadow-2xs">
                      <Bell className="w-3.5 h-3.5 text-rose-600" />
                      <span>Cierre: {formatDeadline(nextMatch.confirmationDeadline)}</span>
                    </span>
                  )}
                  {nextMatch.itemsToBring && nextMatch.itemsToBring.length > 0 && (
                    <span
                      className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-950 border border-emerald-200/90 px-2.5 py-1 rounded-xl font-bold text-xs shadow-2xs"
                      title={nextMatch.itemsToBring.join(' • ')}
                    >
                      <Backpack className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{nextMatch.itemsToBring.length} implementos</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Compact Attendance Counter */}
            {attendance && (
              <div className="mt-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-gray-900">Estado de Convocatoria:</span>
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                      {attendance.total} Convocados
                    </span>
                  </div>

                  <button
                    onClick={() => onViewMatchCallups(nextMatch.id)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Ver lista completa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Proportional Segmented Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${attendance.total > 0 ? (attendance.confirmed / attendance.total) * 100 : 0}%` }}
                    className="bg-emerald-500 h-full transition-all"
                  />
                  <div
                    style={{ width: `${attendance.total > 0 ? (attendance.declined / attendance.total) * 100 : 0}%` }}
                    className="bg-red-500 h-full transition-all"
                  />
                  <div
                    style={{ width: `${attendance.total > 0 ? (attendance.pending / attendance.total) * 100 : 0}%` }}
                    className="bg-amber-400 h-full transition-all"
                  />
                </div>

                {/* 3 Status summary interactive buttons */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {/* Botón 1: Confirmados */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Confirmado' ? null : 'Confirmado')}
                    className={`border rounded-xl p-2 sm:p-2.5 text-center transition-all cursor-pointer relative active:scale-98 ${
                      selectedStatusFilter === 'Confirmado'
                        ? 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-500/40 shadow-xs'
                        : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100/70 hover:border-emerald-300'
                    }`}
                    title="Toca para ver la lista de jugadores confirmados"
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                      <span className="text-[10px] uppercase font-extrabold text-emerald-800 tracking-tight">Confirmados</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-950 font-mono block leading-none my-0.5">
                      {attendance.confirmed}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-700 block mt-0.5">
                      {selectedStatusFilter === 'Confirmado' ? '▲ Ocultar' : '▼ Ver lista'}
                    </span>
                  </button>

                  {/* Botón 2: No van */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'No asiste' ? null : 'No asiste')}
                    className={`border rounded-xl p-2 sm:p-2.5 text-center transition-all cursor-pointer relative active:scale-98 ${
                      selectedStatusFilter === 'No asiste'
                        ? 'bg-red-100 border-red-600 ring-2 ring-red-500/40 shadow-xs'
                        : 'bg-red-50/80 border-red-200 hover:bg-red-100/70 hover:border-red-300'
                    }`}
                    title="Toca para ver los jugadores que no asistirán"
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <XCircle className="w-3.5 h-3.5 text-red-700 flex-shrink-0" />
                      <span className="text-[10px] uppercase font-extrabold text-red-800 tracking-tight">No van</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-red-950 font-mono block leading-none my-0.5">
                      {attendance.declined}
                    </span>
                    <span className="text-[9px] font-bold text-red-700 block mt-0.5">
                      {selectedStatusFilter === 'No asiste' ? '▲ Ocultar' : '▼ Ver lista'}
                    </span>
                  </button>

                  {/* Botón 3: Pendientes */}
                  <button
                    type="button"
                    onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Pendiente' ? null : 'Pendiente')}
                    className={`border rounded-xl p-2 sm:p-2.5 text-center transition-all cursor-pointer relative active:scale-98 ${
                      selectedStatusFilter === 'Pendiente'
                        ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-500/40 shadow-xs'
                        : 'bg-amber-50/80 border-amber-200 hover:bg-amber-100/70 hover:border-amber-300'
                    }`}
                    title="Toca para ver los jugadores pendientes por responder"
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span className="text-[10px] uppercase font-extrabold text-amber-800 tracking-tight">Pendientes</span>
                    </div>
                    <span className="text-lg sm:text-xl font-black text-amber-950 font-mono block leading-none my-0.5">
                      {attendance.pending}
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 block mt-0.5">
                      {selectedStatusFilter === 'Pendiente' ? '▲ Ocultar' : '▼ Ver lista'}
                    </span>
                  </button>
                </div>

                {/* Resumen desplegable de jugadores filtrados */}
                {selectedStatusFilter && (
                  <div className="mt-3 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm animate-fade-in space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        {selectedStatusFilter === 'Confirmado' && (
                          <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        )}
                        {selectedStatusFilter === 'No asiste' && (
                          <span className="w-6 h-6 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                            <XCircle className="w-4 h-4" />
                          </span>
                        )}
                        {selectedStatusFilter === 'Pendiente' && (
                          <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-4 h-4" />
                          </span>
                        )}
                        <div>
                          <h5 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight">
                            {selectedStatusFilter === 'Confirmado' && `Jugadores Confirmados (${filteredCallups.length})`}
                            {selectedStatusFilter === 'No asiste' && `Jugadores que No Van (${filteredCallups.length})`}
                            {selectedStatusFilter === 'Pendiente' && `Jugadores Pendientes (${filteredCallups.length})`}
                          </h5>
                          <span className="text-[10px] text-gray-400 block">
                            {selectedStatusFilter === 'Confirmado' && 'Asistirán al partido'}
                            {selectedStatusFilter === 'No asiste' && 'Reportaron que no asistirán'}
                            {selectedStatusFilter === 'Pendiente' && 'Aún no han confirmado su asistencia'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedStatusFilter(null)}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                        title="Cerrar resumen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Lista de convocados filtrados */}
                    {filteredCallups.length === 0 ? (
                      <div className="py-5 text-center text-xs text-gray-400 font-medium">
                        No hay jugadores registrados con este estado actualmente.
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-gray-50 no-scrollbar">
                        {filteredCallups.map((c) => {
                          const p = playerMap.get(c.playerId);
                          const num = c.jerseyNumber ?? p?.jerseyNumber;
                          return (
                            <div
                              key={c.playerId}
                              className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-800 font-black text-[11px] flex items-center justify-center flex-shrink-0 border border-emerald-200">
                                  {num ? `#${num}` : '—'}
                                </span>
                                <div className="truncate">
                                  <span className="font-bold text-gray-900 truncate block">
                                    {c.fullName || p?.fullName}
                                  </span>
                                  {c.phone && (
                                    <span className="text-[10px] text-gray-400 block -mt-0.5">{c.phone}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {selectedStatusFilter === 'No asiste' && c.reason && (
                                  <span
                                    className="text-[10px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md max-w-[150px] truncate"
                                    title={`Motivo: ${c.reason}`}
                                  >
                                    Motivo: {c.reason}
                                  </span>
                                )}
                                {selectedStatusFilter === 'Confirmado' && (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Confirmado</span>
                                  </span>
                                )}
                                {selectedStatusFilter === 'Pendiente' && (
                                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <HelpCircle className="w-3 h-3 text-amber-600" />
                                    <span>Por responder</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Pie del resumen con botón de acceso directo */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-gray-400 font-medium">
                        {filteredCallups.length} de {attendance.total} convocados
                      </span>
                      <button
                        type="button"
                        onClick={() => onViewMatchCallups(nextMatch.id)}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Abrir lista completa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Action Buttons for this Match (Optimized for Mobile) */}
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                  Acciones Rápidas del Partido
                </h4>
                {nextMatch.postMatchDone && (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    ✓ Finanzas registradas
                  </span>
                )}
              </div>

              {/* Row 1: High-Priority Matchday Operations */}
              <div className={`grid gap-2.5 ${isAdminMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                {/* 1. Cartelera Matchday (solo modo administrador) */}
                {isAdminMode && (
                  <button
                    onClick={() => onOpenMatchdayGraphic(nextMatch)}
                    className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
                    title="Cartelera oficial Matchday para redes sociales y WhatsApp"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
                    <span>Cartelera Matchday</span>
                  </button>
                )}

                {/* 2. Tesorería y Arbitrajes */}
                <button
                  onClick={() => onOpenPostMatch?.(nextMatch)}
                  className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98"
                  title="Tesorería, recaudo de arbitrajes y cuotas de este partido"
                >
                  <DollarSign className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                  <span>Tesorería y Arbitrajes</span>
                </button>
              </div>

              {/* Row 2: Confirmaciones, Estadísticas y Edición */}
              <div className={`grid gap-2.5 pt-0.5 ${isAdminMode ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {/* 3. Confirmaciones */}
                <button
                  onClick={() => onViewMatchCallups(nextMatch.id)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 text-emerald-950 font-extrabold text-xs transition-all cursor-pointer shadow-2xs active:scale-98"
                  title="Ver y gestionar lista de confirmaciones de asistencia del plantel"
                >
                  <Users className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                  <span>Confirmaciones</span>
                </button>

                {/* 4. Estadísticas del Partido */}
                <button
                  onClick={() => handleStatsClick(nextMatch.id, Boolean(nextMatch.matchState === 'Finalizado' || nextMatch.score?.isPlayed))}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs transition-all cursor-pointer shadow-xs hover:shadow-sm active:scale-98"
                  title="Cargar resultado final, goles, cambios y minutos jugados"
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>Estadísticas del Partido</span>
                </button>

                {/* 5. Editar Partido (solo admin) */}
                {isAdminMode && (
                  <button
                    onClick={() => handleEditClick(nextMatch)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-98"
                    title="Editar fecha, cancha, rival o convocados"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <span>Editar Partido</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* Empty State: No upcoming matches */
        <section className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-dashed border-gray-300 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-2xs">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 mb-1">
            No hay partidos programados a futuro
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-6">
            Programa el siguiente encuentro de tu equipo para convocar a los jugadores, generar automáticamente los cobros de arbitraje y compartir el enlace de confirmación.
          </p>
          <button
            onClick={handleProgramClick}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Partido Ahora</span>
          </button>
        </section>
      )}

      {/* 4. Secondary Row: Resumen Financiero + Resumen de Plantel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resumen Financiero Compacto */}
        {financialSummary ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900">Estado Financiero</h3>
                    <p className="text-[11px] text-gray-400 font-medium">Arbitrajes y cobros esporádicos</p>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab('finance')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ver Finanzas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Amounts Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Recaudado
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-emerald-900 block mt-0.5">
                    {formatCurrency(financialSummary.collected)}
                  </span>
                </div>

                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                    Por Cobrar
                  </span>
                  <span className="text-base sm:text-lg font-mono font-black text-amber-900 block mt-0.5">
                    {formatCurrency(financialSummary.pending)}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500">
                  <span>Efectividad de recaudo</span>
                  <span className="font-mono font-bold text-gray-800">{financialSummary.percentage}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, financialSummary.percentage))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Módulo Financiero</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Control de deudas y pagos</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 my-4">
              Administra el pago de arbitrajes de cada partido y crea cobros de uniformes o inscripciones con seguimiento en tiempo real.
            </p>

            <button
              onClick={() => onNavigateToTab('finance')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start hover:underline cursor-pointer"
            >
              <span>Ir al Panel de Finanzas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Resumen Rápido de Equipo / Plantel */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Plantilla del Equipo</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Roster oficial y dorsales</p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab('players')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Ver Plantilla</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Jugadores Activos
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-800 block mt-0.5">
                  {activePlayers.length}
                </span>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Total Registrados
                </span>
                <span className="text-base sm:text-lg font-black text-gray-800 block mt-0.5">
                  {players.length}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Los jugadores activos están habilitados para ser convocados en los próximos partidos y recibir recordatorios de asistencia.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Lista Compacta de Otros Próximos Partidos (si hay más de 1 programado) */}
      {otherUpcomingMatches.length > 0 && (
        <section className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-black text-gray-900">
                Otros Próximos Partidos ({otherUpcomingMatches.length})
              </h3>
            </div>

            <button
              onClick={() => onNavigateToTab('matches')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span>Ver todos los partidos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-gray-100">
            {otherUpcomingMatches.map((m) => (
              <div
                key={m.id}
                onClick={() => onViewMatchCallups(m.id)}
                className="py-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 px-2 rounded-xl transition cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TeamCrest name={m.rival} isOurTeam={false} size="sm" className="flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                      vs. {m.rival}
                    </h4>
                    <p className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{formatMatchDate(m.date)}</span>
                      {m.time && <span>• {m.time}</span>}
                      {m.tournamentName && <span>• {m.tournamentName}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline">
                    Ver Convocatoria
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Admin Access Modal for shortcuts */}
      <AdminAccessModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setPendingAction(null);
        }}
        onSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
};
