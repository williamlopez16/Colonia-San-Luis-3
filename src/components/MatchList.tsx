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
  Sparkles,
  FileText,
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
}

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
                  <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 py-1">
                    {/* Left: Home Team (Centered) */}
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
                              <span className="text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]">{homeScore}</span>
                              <span className="text-emerald-500 text-sm sm:text-lg font-sans">-</span>
                              <span className="text-white drop-shadow-[0_1px_4px_rgba(255,255,255,0.25)]">{awayScore}</span>
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

                    {/* Right: Rival Team (Centered) */}
                    <div className="col-span-3 flex flex-col items-center justify-center text-center">
                      <TeamCrest name={match.rival} isOurTeam={false} size="lg" className="flex-shrink-0" />
                      <h3 className="font-black text-gray-900 text-xs sm:text-base leading-tight mt-2 text-center group-hover:text-emerald-700 transition line-clamp-2 max-w-[200px]">
                        {match.rival}
                      </h3>
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
                  <div className="flex items-center gap-1.5 sm:gap-2 justify-end flex-wrap">
                    {/* Botón Cartelera */}
                    {onOpenMatchdayGraphic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMatchdayGraphic(match);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        title="Ver o descargar cartelera matchday"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Cartelera</span>
                      </button>
                    )}

                    {/* Botón Prompt IA */}
                    {onOpenAIPrompt && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAIPrompt(match);
                        }}
                        className="px-2 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                        title="Copiar prompt para IA"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-700" />
                        <span className="hidden sm:inline">Prompt IA</span>
                      </button>
                    )}

                    {/* Botón Control Post-Partido */}
                    {onOpenPostMatch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenPostMatch(match);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        title="Re-validar asistencia real y pago de arbitraje"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Post-Partido</span>
                      </button>
                    )}

                    {/* Botón Cargar/Ver Estadísticas */}
                    {(isAdminMode || isFinished) && (
                      <button
                        onClick={(e) => handleOpenStats(e, match.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs flex items-center gap-1 shadow-xs hover:shadow-sm transition cursor-pointer"
                        title={isAdminMode ? 'Cargar o editar goles, asistencias y tarjetas' : 'Ver estadísticas del partido'}
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Stats</span>
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
