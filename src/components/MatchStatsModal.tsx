import React, { useState } from 'react';
import type { Team, Match, MatchScore, MatchState, PlayerMatchStats } from '../types';
import { saveMatchStats } from '../services/dataService';
import { formatMatchDate } from '../services/whatsappService';
import { TeamCrest } from './TeamCrest';
import {
  X,
  Save,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
} from 'lucide-react';

interface MatchStatsModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
}

export const MatchStatsModal: React.FC<MatchStatsModalProps> = ({
  team,
  match,
  onClose,
}) => {
  const teamName = team?.name || 'Club San Luis';

  // 1. Initial State Setup
  const [matchState, setMatchState] = useState<MatchState>(
    match.matchState || (match.score?.isPlayed ? 'Finalizado' : 'Finalizado')
  );

  const [homeGoals, setHomeGoals] = useState<number>(match.score?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState<number>(match.score?.awayGoals ?? 0);

  // Initialize player stats from existing or build from callups
  const [playerStats, setPlayerStats] = useState<PlayerMatchStats[]>(() => {
    if (match.playerStats && match.playerStats.length > 0) {
      return match.playerStats;
    }
    // Pre-populate with callup players
    return match.callups.map((c) => ({
      playerId: c.playerId,
      playerName: c.fullName,
      jerseyNumber: c.jerseyNumber,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    }));
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Calculate sum of individual player goals
  const totalPlayerGoals = playerStats.reduce((sum, p) => sum + (p.goals || 0), 0);
  const totalPlayerAssists = playerStats.reduce((sum, p) => sum + (p.assists || 0), 0);
  const totalYellowCards = playerStats.reduce((sum, p) => sum + (p.yellowCards || 0), 0);
  const totalRedCards = playerStats.reduce((sum, p) => sum + (p.redCards || 0), 0);

  // Player stat modifiers
  const updateStat = (
    playerId: string,
    field: 'goals' | 'assists' | 'yellowCards' | 'redCards',
    delta: number
  ) => {
    setPlayerStats((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const currentVal = p[field] || 0;
        let nextVal = Math.max(0, currentVal + delta);
        // Yellow cards limit 2, Red cards limit 1
        if (field === 'yellowCards') nextVal = Math.min(2, nextVal);
        if (field === 'redCards') nextVal = Math.min(1, nextVal);
        return { ...p, [field]: nextVal };
      })
    );
  };

  const handleSyncScoreWithGoals = () => {
    setHomeGoals(totalPlayerGoals);
  };

  const handleResetStats = () => {
    if (confirm('¿Deseas reiniciar a cero las estadísticas de todos los jugadores de este partido?')) {
      setPlayerStats((prev) =>
        prev.map((p) => ({
          ...p,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
        }))
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const score: MatchScore = {
        homeGoals: Math.max(0, Number(homeGoals) || 0),
        awayGoals: Math.max(0, Number(awayGoals) || 0),
        isPlayed: matchState === 'Finalizado',
      };

      await saveMatchStats(match.id, score, matchState, playerStats);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar las estadísticas');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-emerald-700/80 px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-200">
              <Trophy className="w-3.5 h-3.5 text-emerald-300" />
              {match.tournamentName || 'Torneo Oficial'}
            </span>
            <span className="text-xs text-emerald-200">
              {formatMatchDate(match.date)} {match.time ? `• ${match.time}` : ''}
            </span>
          </div>

          {/* Match Clash Banner */}
          <div className="grid grid-cols-7 items-center gap-2 py-3">
            {/* Home Team */}
            <div className="col-span-3 flex flex-col items-center justify-center text-center">
              <TeamCrest name={teamName} isOurTeam size="lg" />
              <h3 className="font-black text-xs sm:text-base mt-2 leading-tight line-clamp-2 text-center max-w-[180px]">
                {teamName}
              </h3>
            </div>

            {/* Scoreboard / VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-emerald-400/40 text-center shadow-lg ring-1 ring-white/10">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                  {matchState === 'Finalizado' ? 'FINAL' : 'EN VIVO'}
                </span>
                <div className="flex items-center justify-center gap-1.5 font-mono font-black text-xl sm:text-3xl text-white tracking-tight">
                  <span>{homeGoals}</span>
                  <span className="text-emerald-400 text-sm font-sans">-</span>
                  <span>{awayGoals}</span>
                </div>
              </div>
            </div>

            {/* Rival Team */}
            <div className="col-span-3 flex flex-col items-center justify-center text-center">
              <TeamCrest name={match.rival} isOurTeam={false} size="lg" />
              <h3 className="font-black text-xs sm:text-base mt-2 leading-tight line-clamp-2 text-center max-w-[180px]">
                {match.rival}
              </h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>¡Estadísticas y marcador guardados con éxito!</span>
            </div>
          )}

          {/* Match State & Score Selector */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Estado del Partido
              </label>

              <div className="inline-flex bg-gray-200 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMatchState('Programado')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    matchState === 'Programado'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Programado
                </button>
                <button
                  type="button"
                  onClick={() => setMatchState('Finalizado')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    matchState === 'Finalizado'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Finalizado (Con Resultado)
                </button>
              </div>
            </div>

            {/* Score Steppers */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              {/* Home Goals */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center">
                <span className="text-[11px] font-bold text-gray-600 truncate max-w-full">
                  Goles {teamName}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setHomeGoals((g) => Math.max(0, g - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-black text-emerald-700 w-8 text-center font-mono">
                    {homeGoals}
                  </span>
                  <button
                    type="button"
                    onClick={() => setHomeGoals((g) => g + 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Away Goals */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-col items-center">
                <span className="text-[11px] font-bold text-gray-600 truncate max-w-full">
                  Goles {match.rival}
                </span>
                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setAwayGoals((g) => Math.max(0, g - 1))}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-2xl font-black text-gray-800 w-8 text-center font-mono">
                    {awayGoals}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAwayGoals((g) => g + 1)}
                    className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-900 text-white font-black text-lg flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Smart helper comparison */}
            {totalPlayerGoals !== homeGoals && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900">
                <span>
                  Goles individuales registrados: <b>{totalPlayerGoals}</b> (Marcador: {homeGoals})
                </span>
                <button
                  type="button"
                  onClick={handleSyncScoreWithGoals}
                  className="font-bold text-amber-800 underline hover:text-amber-950 cursor-pointer text-[11px]"
                >
                  Ajustar marcador a {totalPlayerGoals}
                </button>
              </div>
            )}
          </div>

          {/* Individual Players Stats Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <span>Estadísticas Individuales del Plantel</span>
                  <span className="text-xs font-normal text-gray-500">
                    ({playerStats.length} jugadores)
                  </span>
                </h4>
                <p className="text-[11px] text-gray-500">
                  Registra goles, asistencias, tarjetas amarillas y rojas
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetStats}
                className="text-[11px] text-gray-400 hover:text-red-600 flex items-center gap-1 transition cursor-pointer"
                title="Reiniciar estadísticas a cero"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar</span>
              </button>
            </div>

            {/* Overall Totals Ribbon */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <div>
                <span className="text-gray-500 text-[10px] block">Goles ⚽</span>
                <span className="font-extrabold text-emerald-800 text-sm">{totalPlayerGoals}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Asistencias 👟</span>
                <span className="font-extrabold text-blue-700 text-sm">{totalPlayerAssists}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Amarillas 🟨</span>
                <span className="font-extrabold text-amber-600 text-sm">{totalYellowCards}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block">Rojas 🟥</span>
                <span className="font-extrabold text-red-600 text-sm">{totalRedCards}</span>
              </div>
            </div>

            {/* Players List with Steppers */}
            {playerStats.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                No hay jugadores registrados en la convocatoria de este partido.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                {playerStats.map((p) => (
                  <div
                    key={p.playerId}
                    className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition"
                  >
                    {/* Player Info */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-emerald-800 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                        {p.jerseyNumber}
                      </span>
                      <div>
                        <p className="font-bold text-xs text-gray-900 leading-tight">
                          {p.playerName}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                          {p.goals > 0 && (
                            <span className="text-emerald-700 font-bold">{p.goals} ⚽</span>
                          )}
                          {p.assists > 0 && (
                            <span className="text-blue-700 font-bold">{p.assists} 👟</span>
                          )}
                          {p.yellowCards > 0 && (
                            <span className="text-amber-600 font-bold">{p.yellowCards} 🟨</span>
                          )}
                          {p.redCards > 0 && (
                            <span className="text-red-600 font-bold">{p.redCards} 🟥</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stepper Controls */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      {/* Goles */}
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1.5 py-1">
                        <span className="text-[10px] text-gray-500 font-semibold mr-1.5">⚽ Goles</span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'goals', -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-emerald-800">
                          {p.goals}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'goals', 1)}
                          className="w-5 h-5 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Asistencias */}
                      <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1.5 py-1">
                        <span className="text-[10px] text-gray-500 font-semibold mr-1.5">👟 Asist.</span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'assists', -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-blue-700">
                          {p.assists}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'assists', 1)}
                          className="w-5 h-5 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Tarjeta Amarilla */}
                      <div className="flex items-center bg-amber-50/60 rounded-lg border border-amber-200 px-1.5 py-1">
                        <span className="text-[10px] text-amber-800 font-semibold mr-1">🟨</span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'yellowCards', -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-amber-100 text-gray-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-amber-700">
                          {p.yellowCards}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'yellowCards', 1)}
                          className="w-5 h-5 rounded bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Tarjeta Roja */}
                      <div className="flex items-center bg-red-50/60 rounded-lg border border-red-200 px-1.5 py-1">
                        <span className="text-[10px] text-red-800 font-semibold mr-1">🟥</span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'redCards', -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-red-100 text-gray-700 flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-black text-red-700">
                          {p.redCards}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateStat(p.playerId, 'redCards', 1)}
                          className="w-5 h-5 rounded bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Estadísticas'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
