import React from 'react';
import type { Match, Team } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { formatMatchDate, getConfirmationUrl, copyToClipboard } from '../services/whatsappService';
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
} from 'lucide-react';

interface MatchListProps {
  team: Team | null;
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  onNewMatch: () => void;
  onEditMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onOpenMatchStats: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  team,
  matches,
  onSelectMatch,
  onNewMatch,
  onEditMatch,
  onDeleteMatch,
  onOpenMatchStats,
}) => {
  const { isAdminMode } = useAccessMode();
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const teamName = team?.name || 'Club San Luis';

  const handleCopyLink = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    const url = getConfirmationUrl(matchId);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(matchId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este partido y su convocatoria?')) {
      onDeleteMatch(matchId);
    }
  };

  const handleOpenStats = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    onOpenMatchStats(matchId);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Partidos y Convocatorias
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Visualiza tus partidos, controla la asistencia de jugadores y carga las estadísticas de goles y tarjetas
          </p>
        </div>

        {isAdminMode && (
          <button
            onClick={onNewMatch}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Partido</span>
          </button>
        )}
      </div>

      {/* Match Cards */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No hay partidos programados</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Comienza creando un partido con fecha, hora, rival y los convocados de tu equipo.
          </p>
          <button
            onClick={onNewMatch}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Partido</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {matches.map((match) => {
            const confirmedCount = match.callups.filter((c) => c.status === 'Confirmado').length;
            const declinedCount = match.callups.filter((c) => c.status === 'No asiste').length;
            const pendingCount = match.callups.filter((c) => c.status === 'Pendiente').length;
            const totalCount = match.callups.length;

            const isFinished = match.matchState === 'Finalizado' || (match.score && match.score.isPlayed);
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
                {/* 1. Header Ribbon */}
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

                    {isFinished && (
                      <span className="inline-flex items-center gap-1 font-black text-[10px] uppercase tracking-wider bg-emerald-700 text-white px-2 py-0.5 rounded-md shadow-2xs">
                        Finalizado
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

                {/* 2. Visual Clash / Scoreboard Card */}
                <div className="p-5 sm:p-6 bg-gradient-to-b from-white via-gray-50/40 to-white">
                  <div className="grid grid-cols-7 items-center gap-2 sm:gap-4">
                    {/* Left: Our Team */}
                    <div className="col-span-3 flex items-center gap-3 sm:gap-4">
                      <TeamCrest name={teamName} isOurTeam size="lg" className="flex-shrink-0" />
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-emerald-700 transition">
                          {teamName}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-emerald-700 font-bold uppercase tracking-wider truncate">
                          {team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}
                        </p>
                      </div>
                    </div>

                    {/* Center: VS Emblem or Scoreboard */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      {isFinished ? (
                        <div className="bg-gray-950 text-white font-mono font-black text-lg sm:text-2xl px-3 sm:px-4 py-1.5 rounded-2xl shadow-md border border-gray-800 tracking-tight text-center">
                          {homeScore} - {awayScore}
                        </div>
                      ) : (
                        <div className="relative flex items-center justify-center">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-md border-2 border-emerald-500 group-hover:scale-105 transition transform">
                            VS
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Rival Team */}
                    <div className="col-span-3 flex items-center justify-end gap-3 sm:gap-4 text-right">
                      <div className="min-w-0">
                        <h3 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-emerald-700 transition">
                          {match.rival}
                        </h3>
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-semibold uppercase">
                          Rival
                        </p>
                      </div>
                      <TeamCrest name={match.rival} isOurTeam={false} size="lg" className="flex-shrink-0" />
                    </div>
                  </div>

                  {/* Location & Referee Details */}
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
                    </div>

                    {/* Stats summary badge if recorded */}
                    {(totalGoalsScored > 0 || totalAssists > 0 || totalCards > 0 || isFinished) && (
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
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Footer Bar: Attendance Counters & Action Buttons */}
                <div className="bg-gray-50/80 px-5 py-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Attendance Pills */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-xl font-bold shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{confirmedCount}</span>
                      <span className="text-[10px] font-medium text-emerald-600">Confirmados</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-red-200 text-red-800 px-2.5 py-1 rounded-xl font-bold shadow-2xs">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>{declinedCount}</span>
                      <span className="text-[10px] font-medium text-red-600">No</span>
                    </div>

                    <div className="flex items-center gap-1 bg-white border border-amber-200 text-amber-800 px-2.5 py-1 rounded-xl font-bold shadow-2xs">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{pendingCount}</span>
                      <span className="text-[10px] font-medium text-amber-600">Pend.</span>
                    </div>

                    <span className="text-[11px] text-gray-400 font-medium">
                      Total: {totalCount}
                    </span>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center gap-2 justify-end">
                    {/* Botón Cargar/Ver Estadísticas */}
                    {(isAdminMode || isFinished) && (
                      <button
                        onClick={(e) => handleOpenStats(e, match.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs hover:shadow-sm transition cursor-pointer"
                        title={isAdminMode ? 'Cargar o editar goles, asistencias y tarjetas' : 'Ver estadísticas del partido'}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span>{isAdminMode ? (isFinished ? 'Estadísticas' : 'Cargar Estadísticas') : 'Ver Estadísticas'}</span>
                      </button>
                    )}

                    {/* Copiar enlace */}
                    <button
                      onClick={(e) => handleCopyLink(e, match.id)}
                      className="p-1.5 sm:px-2.5 sm:py-1.5 text-gray-600 hover:text-emerald-700 hover:bg-white bg-gray-100 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold border border-gray-200 shadow-2xs"
                      title="Copiar enlace de confirmación"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {copiedId === match.id ? '¡Copiado!' : 'Enlace'}
                      </span>
                    </button>

                    {/* Editar Partido (solo admin) */}
                    {isAdminMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditMatch(match);
                        }}
                        className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                        title="Editar datos del partido y convocados"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Eliminar (solo admin) */}
                    {isAdminMode && (
                      <button
                        onClick={(e) => handleDelete(e, match.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Eliminar partido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Ver Convocatoria Flecha */}
                    <div className="p-1 text-emerald-600 group-hover:translate-x-0.5 transition transform">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
