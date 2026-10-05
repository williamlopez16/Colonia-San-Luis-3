import React, { useMemo, useState } from 'react';
import type { Team, Match, Player, Charge, Tournament } from '../types';
import type { AppTab } from './Header';
import { useAccessMode } from '../context/AccessModeContext';
import { AdminAccessModal } from './AdminAccessModal';
import { formatMatchDate } from '../services/whatsappService';
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
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  Sparkles,
  Shield,
  Wallet,
} from 'lucide-react';

interface DashboardViewProps {
  team: Team | null;
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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  team,
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
}) => {
  const { isAdminMode } = useAccessMode();
  const [showAdminModal, setShowAdminModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  const teamName = team?.name || 'Club San Luis';
  const teamSlogan = team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA';

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
              {/* Home: Our Team */}
              <div className="col-span-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
                <TeamCrest name={teamName} isOurTeam size="xl" className="flex-shrink-0" />
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight truncate">
                    {teamName}
                  </h2>
                  <span className="text-[10px] sm:text-[11px] text-emerald-700 font-bold uppercase tracking-wider block mt-0.5">
                    Nuestro Equipo
                  </span>
                </div>
              </div>

              {/* Center: VS Badge */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-700 text-white font-black text-sm sm:text-base flex items-center justify-center shadow-md border-2 border-emerald-500">
                  VS
                </div>
              </div>

              {/* Away: Rival Team */}
              <div className="col-span-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4 text-center sm:text-right">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight truncate">
                    {nextMatch.rival}
                  </h2>
                  <span className="text-[10px] sm:text-[11px] text-gray-400 font-bold uppercase tracking-wider block mt-0.5">
                    Rival
                  </span>
                </div>
                <TeamCrest name={nextMatch.rival} isOurTeam={false} size="xl" className="flex-shrink-0" />
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
            </div>

            {/* Compact Attendance Counter */}
            {attendance && (
              <div className="mt-4 bg-emerald-50/60 rounded-2xl p-3.5 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950">Convocatoria:</span>
                  <span className="text-xs font-semibold text-emerald-900">
                    <strong className="text-emerald-700">{attendance.confirmed}</strong> confirmados ·{' '}
                    <strong className="text-red-600">{attendance.declined}</strong> no van ·{' '}
                    <strong className="text-amber-600">{attendance.pending}</strong> pendientes
                  </span>
                </div>

                <button
                  onClick={() => onViewMatchCallups(nextMatch.id)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Ver lista completa ({attendance.total})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 3. Four Direct Action Buttons for this Match */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-3">
                Acciones Rápidas del Partido
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Editar partido */}
                <button
                  onClick={() => handleEditClick(nextMatch)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer hover:border-gray-300 shadow-2xs"
                  title="Editar fecha, cancha, rival o convocados"
                >
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  <span>Editar Partido</span>
                </button>

                {/* 2. Ver confirmaciones */}
                <button
                  onClick={() => onViewMatchCallups(nextMatch.id)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs transition cursor-pointer shadow-2xs"
                  title="Ver y gestionar asistencia de jugadores"
                >
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Confirmaciones</span>
                </button>

                {/* 3. Cartelera */}
                <button
                  onClick={() => onOpenMatchdayGraphic(nextMatch)}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs transition cursor-pointer shadow-2xs"
                  title="Generar imagen para estados de WhatsApp y redes"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>Cartelera Gráfica</span>
                </button>

                {/* 4. Marcador / Estadísticas */}
                <button
                  onClick={() => handleStatsClick(nextMatch.id, Boolean(nextMatch.matchState === 'Finalizado' || nextMatch.score?.isPlayed))}
                  className="flex flex-col sm:flex-row items-center justify-center gap-2 p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs hover:shadow-sm"
                  title="Cargar resultado final, goles, asistencias y tarjetas"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Marcador / Stats</span>
                </button>
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
