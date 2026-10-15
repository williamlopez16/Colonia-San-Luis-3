import React, { useState } from 'react';
import type { Team, Match, MatchScore, MatchState, PlayerMatchStats, MatchSubstitution } from '../types';
import { saveMatchStats, generateUUID } from '../services/dataService';
import { formatMatchDate } from '../services/whatsappService';
import { TeamCrest } from './TeamCrest';
import {
  X,
  Save,
  Trophy,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  User,
  ArrowRightLeft,
  Timer,
  Clock,
  Star,
  Trash2,
  Users,
  Sparkles,
  Award,
  Zap,
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

  // Active Tab inside modal: 'score' | 'substitutions'
  const [activeTab, setActiveTab] = useState<'score' | 'substitutions'>('score');

  // Match State
  const [matchState, setMatchState] = useState<MatchState>(
    match.matchState || (match.score?.isPlayed ? 'Finalizado' : 'Finalizado')
  );

  const [homeGoals, setHomeGoals] = useState<number>(match.score?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState<number>(match.score?.awayGoals ?? 0);

  // Match Duration (default 90 mins, or configured)
  const [matchDuration, setMatchDuration] = useState<number>(
    match.matchDurationMinutes || 90
  );

  // Substitutions list
  const [substitutions, setSubstitutions] = useState<MatchSubstitution[]>(
    match.substitutions || []
  );

  // New Substitution Form state
  const [newSubMinute, setNewSubMinute] = useState<number>(45);
  const [newSubOutPlayerId, setNewSubOutPlayerId] = useState<string>('');
  const [newSubInPlayerId, setNewSubInPlayerId] = useState<string>('');
  const [newSubReason, setNewSubReason] = useState<string>('');

  // Player Match Stats
  const [playerStats, setPlayerStats] = useState<PlayerMatchStats[]>(() => {
    if (match.playerStats && match.playerStats.length > 0) {
      return match.playerStats;
    }
    // Pre-populate with callup players. Default first 11 (or half) as starters
    const defaultStartersCount = Math.min(11, match.callups.length);
    return match.callups.map((c, index) => {
      const isStarter = index < defaultStartersCount;
      return {
        playerId: c.playerId,
        playerName: c.fullName,
        jerseyNumber: c.jerseyNumber,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        isStarter,
        minutesPlayed: isStarter ? (match.matchDurationMinutes || 90) : 0,
      };
    });
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Totals for scoreboard tab
  const totalPlayerGoals = playerStats.reduce((sum, p) => sum + (p.goals || 0), 0);
  const totalPlayerAssists = playerStats.reduce((sum, p) => sum + (p.assists || 0), 0);
  const totalYellowCards = playerStats.reduce((sum, p) => sum + (p.yellowCards || 0), 0);
  const totalRedCards = playerStats.reduce((sum, p) => sum + (p.redCards || 0), 0);

  // Starters and Bench counts
  const starters = playerStats.filter((p) => p.isStarter);
  const bench = playerStats.filter((p) => !p.isStarter);

  // Stat modifiers
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
        if (field === 'yellowCards') nextVal = Math.min(2, nextVal);
        if (field === 'redCards') nextVal = Math.min(1, nextVal);
        return { ...p, [field]: nextVal };
      })
    );
  };

  // Toggle Starter / Bench status
  const handleToggleStarter = (playerId: string) => {
    setPlayerStats((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const nextIsStarter = !p.isStarter;
        return {
          ...p,
          isStarter: nextIsStarter,
          minutesPlayed: nextIsStarter ? matchDuration : 0,
        };
      })
    );
  };

  const handleMarkAllStarters = (status: boolean) => {
    setPlayerStats((prev) =>
      prev.map((p) => ({
        ...p,
        isStarter: status,
        minutesPlayed: status ? matchDuration : 0,
      }))
    );
  };

  // Auto-calculate player minutes based on starters and substitutions
  const handleAutoCalculateMinutes = () => {
    const sortedSubs = [...substitutions].sort((a, b) => a.minute - b.minute);

    setPlayerStats((prev) =>
      prev.map((p) => {
        const isStarter = Boolean(p.isStarter);
        const outSub = sortedSubs.find((s) => s.playerOutId === p.playerId);
        const inSub = sortedSubs.find((s) => s.playerInId === p.playerId);

        let mins = 0;
        const subbedOutMin = outSub ? outSub.minute : undefined;
        const subbedInMin = inSub ? inSub.minute : undefined;

        if (isStarter) {
          if (outSub) {
            mins = Math.max(0, Math.min(matchDuration, outSub.minute));
          } else {
            mins = matchDuration;
          }
        } else {
          if (inSub) {
            if (outSub && outSub.minute > inSub.minute) {
              mins = Math.max(0, outSub.minute - inSub.minute);
            } else {
              mins = Math.max(0, matchDuration - inSub.minute);
            }
          } else {
            mins = 0;
          }
        }

        return {
          ...p,
          minutesPlayed: mins,
          subbedInMinute: subbedInMin,
          subbedOutMinute: subbedOutMin,
        };
      })
    );
  };

  // Add Substitution
  const handleAddSubstitution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubOutPlayerId || !newSubInPlayerId) {
      setError('Debes seleccionar quién sale y quién entra al terreno de juego');
      return;
    }
    if (newSubOutPlayerId === newSubInPlayerId) {
      setError('El jugador que sale y el que entra no pueden ser la misma persona');
      return;
    }

    const playerOut = playerStats.find((p) => p.playerId === newSubOutPlayerId);
    const playerIn = playerStats.find((p) => p.playerId === newSubInPlayerId);

    if (!playerOut || !playerIn) return;

    const newSub: MatchSubstitution = {
      id: generateUUID(),
      minute: Math.max(1, Math.min(matchDuration, Number(newSubMinute) || 1)),
      playerOutId: playerOut.playerId,
      playerOutName: playerOut.playerName,
      playerInId: playerIn.playerId,
      playerInName: playerIn.playerName,
      notes: newSubReason.trim() || undefined,
    };

    const nextSubs = [...substitutions, newSub].sort((a, b) => a.minute - b.minute);
    setSubstitutions(nextSubs);

    // Automatically recalculate minutes for both players
    setPlayerStats((prev) =>
      prev.map((p) => {
        if (p.playerId === playerOut.playerId) {
          const played = p.isStarter ? newSub.minute : Math.max(0, newSub.minute - (p.subbedInMinute || 0));
          return {
            ...p,
            minutesPlayed: Math.max(0, Math.min(matchDuration, played)),
            subbedOutMinute: newSub.minute,
          };
        }
        if (p.playerId === playerIn.playerId) {
          const played = Math.max(0, matchDuration - newSub.minute);
          return {
            ...p,
            minutesPlayed: played,
            subbedInMinute: newSub.minute,
          };
        }
        return p;
      })
    );

    // Reset form fields
    setNewSubOutPlayerId('');
    setNewSubInPlayerId('');
    setNewSubReason('');
    setError(null);
  };

  // Remove Substitution
  const handleRemoveSubstitution = (subId: string) => {
    const updated = substitutions.filter((s) => s.id !== subId);
    setSubstitutions(updated);
  };

  // Manual minute adjustment for a player
  const updatePlayerMinutes = (playerId: string, delta: number) => {
    setPlayerStats((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const current = p.minutesPlayed ?? (p.isStarter ? matchDuration : 0);
        const next = Math.max(0, Math.min(matchDuration, current + delta));
        return { ...p, minutesPlayed: next };
      })
    );
  };

  const handleSyncScoreWithGoals = () => {
    setHomeGoals(totalPlayerGoals);
  };

  const handleResetStats = () => {
    if (confirm('¿Deseas reiniciar a cero los goles, asistencias y tarjetas de todos los jugadores?')) {
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

      await saveMatchStats(
        match.id,
        score,
        matchState,
        playerStats,
        substitutions,
        matchDuration
      );

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar las estadísticas del partido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-900 text-white p-5 sm:p-6 relative">
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
          <div className="grid grid-cols-7 items-center gap-2 py-2">
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

          {/* Sub-tab Navigation (Marcador vs Cambios y Minutos) */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/15">
            <button
              type="button"
              onClick={() => setActiveTab('score')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'score'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900/90'
              }`}
            >
              <span>⚽ Marcador y Goles</span>
              {totalPlayerGoals > 0 && (
                <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                  {totalPlayerGoals}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('substitutions')}
              className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                activeTab === 'substitutions'
                  ? 'bg-white text-emerald-950 shadow-md'
                  : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-900/90'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
              <span>Control de Cambios y Minutos</span>
              {substitutions.length > 0 && (
                <span className="bg-emerald-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                  {substitutions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200 flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-semibold border border-emerald-200 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>¡Estadísticas del partido guardadas con éxito!</span>
            </div>
          )}

          {/* TAB 1: Marcador, Goles y Tarjetas */}
          {activeTab === 'score' && (
            <div className="space-y-5 animate-fade-in">
              {/* Match State & Score Stepper */}
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
                <div className="grid grid-cols-2 gap-4 pt-1">
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

                {/* Smart comparison */}
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

              {/* Individual Players Goals / Cards Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                      <span>Rendimiento Individual del Plantel</span>
                      <span className="text-xs font-normal text-gray-500">
                        ({playerStats.length} jugadores)
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Goles, asistencias, tarjetas amarillas y rojas
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
                          <span className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center flex-shrink-0">
                            <User className="w-3.5 h-3.5 text-emerald-200" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-xs text-gray-900 leading-tight">
                                {p.playerName}
                              </p>
                              {p.isStarter && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-md">
                                  Titular
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
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
                              {p.minutesPlayed !== undefined && p.minutesPlayed > 0 && (
                                <span className="text-gray-500 font-medium">⏱️ {p.minutesPlayed}'</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Stepper Controls */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {/* Goles */}
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-1.5 py-1">
                            <span className="text-[10px] text-gray-500 font-semibold mr-1.5">⚽</span>
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
                            <span className="text-[10px] text-gray-500 font-semibold mr-1.5">👟</span>
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
            </div>
          )}

          {/* TAB 2: Control de Cambios, Sustituciones y Minutos */}
          {activeTab === 'substitutions' && (
            <div className="space-y-6 animate-fade-in">
              {/* Top Configuration & Auto-calculate Bar */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider block">
                    Duración del Partido
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {[50, 60, 70, 80, 90].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setMatchDuration(dur)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer border ${
                          matchDuration === dur
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-emerald-100/50'
                        }`}
                      >
                        {dur}'
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-1 text-xs text-gray-600">
                      <span>Total:</span>
                      <input
                        type="number"
                        min="10"
                        max="150"
                        value={matchDuration}
                        onChange={(e) => setMatchDuration(Math.max(1, Number(e.target.value) || 90))}
                        className="w-14 px-2 py-0.5 rounded-lg border border-gray-300 text-center font-bold text-xs bg-white"
                      />
                      <span>min</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAutoCalculateMinutes}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  title="Calcular automáticamente los minutos de cada jugador según titulares y cambios"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Auto-calcular Minutos</span>
                </button>
              </div>

              {/* 1. Starters vs Bench Selection */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>Alineación Inicial ({starters.length} Titulares • {bench.length} Suplentes)</span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Haz clic en cada jugador para alternar si inició como titular o suplente
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleMarkAllStarters(true)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] cursor-pointer"
                    >
                      Todos Titulares
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkAllStarters(false)}
                      className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] cursor-pointer"
                    >
                      Todos Suplentes
                    </button>
                  </div>
                </div>

                {/* Player Chips */}
                <div className="flex flex-wrap gap-1.5">
                  {playerStats.map((p) => {
                    const isStarter = Boolean(p.isStarter);
                    return (
                      <button
                        key={p.playerId}
                        type="button"
                        onClick={() => handleToggleStarter(p.playerId)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                          isStarter
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-300 ring-1 ring-emerald-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span>{isStarter ? '⭐' : '🪑'}</span>
                        <span className="truncate max-w-[130px]">{p.playerName}</span>
                        <span className="text-[10px] opacity-75 font-mono">
                          {isStarter ? 'Titular' : 'Suplente'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Quick Substitution Registrar */}
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Registrar Sustitución / Cambio
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Player OUT */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-red-700 mb-1">
                      🔻 Sale del terreno:
                    </label>
                    <select
                      value={newSubOutPlayerId}
                      onChange={(e) => setNewSubOutPlayerId(e.target.value)}
                      className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-hidden"
                    >
                      <option value="">Selecciona quién sale...</option>
                      {playerStats.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.playerName} {p.isStarter ? '(Titular)' : '(En cancha)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Player IN */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                      🔺 Entra a la cancha:
                    </label>
                    <select
                      value={newSubInPlayerId}
                      onChange={(e) => setNewSubInPlayerId(e.target.value)}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                    >
                      <option value="">Selecciona quién entra...</option>
                      {playerStats.map((p) => (
                        <option key={p.playerId} value={p.playerId}>
                          {p.playerName} {!p.isStarter ? '(Suplente)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Minute & Action */}
                  <div className="sm:col-span-4 flex items-end gap-2">
                    <div className="w-24 flex-shrink-0">
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Minuto:
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          max={matchDuration}
                          value={newSubMinute}
                          onChange={(e) => setNewSubMinute(Math.max(1, Number(e.target.value) || 1))}
                          className="w-full rounded-xl border border-gray-300 bg-white pl-2 pr-6 py-2 text-xs font-mono font-bold text-gray-800"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-gray-400 font-bold pointer-events-none">
                          '
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddSubstitution}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar</span>
                    </button>
                  </div>
                </div>

                {/* Quick Minute Preset Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                  <span className="text-gray-500 font-medium">Minutos rápidos:</span>
                  {[25, 45, 60, 75, 85].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewSubMinute(m)}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        newSubMinute === m
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m === 45 ? "45' (Descanso)" : `${m}'`}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-gray-500 font-medium">Motivo:</span>
                    {['Táctico', 'Lesión', 'Rotación'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewSubReason(newSubReason === r ? '' : r)}
                        className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer text-[10px] ${
                          newSubReason === r
                            ? 'bg-purple-700 text-white'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-purple-50'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. List of Registered Substitutions */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden space-y-0">
                <div className="p-3 bg-gray-50/80 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Cronología de Cambios ({substitutions.length})</span>
                  </h4>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {substitutions.length === 0 ? 'Sin sustituciones' : 'Orden cronológico'}
                  </span>
                </div>

                {substitutions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No se han registrado sustituciones en este partido. Si no hubo cambios, los titulares juegan los {matchDuration} minutos completos.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {substitutions.map((sub, idx) => (
                      <div
                        key={sub.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-xl bg-emerald-800 text-white font-mono font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                            {sub.minute}'
                          </span>

                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <span className="font-bold text-red-700 flex items-center gap-1">
                              <span>🔻 Sale:</span>
                              <strong className="text-gray-900">{sub.playerOutName}</strong>
                            </span>
                            <span className="text-gray-400 font-bold">➔</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <span>🔺 Entra:</span>
                              <strong className="text-gray-900">{sub.playerInName}</strong>
                            </span>

                            {sub.notes && (
                              <span className="text-[10px] bg-purple-50 text-purple-800 px-2 py-0.5 rounded-md font-bold border border-purple-200">
                                {sub.notes}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveSubstitution(sub.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Eliminar esta sustitución"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Minutos Jugados por Jugador (Control & Ajuste Fino) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-emerald-600" />
                      <span>Control y Ajuste de Minutos Jugados</span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Calculado según titulares y sustituciones, con ajuste manual fino disponible (+ / -)
                    </p>
                  </div>

                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                    Total: {playerStats.reduce((s, p) => s + (p.minutesPlayed || 0), 0)} min repartidos
                  </span>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                  {playerStats.map((p) => {
                    const mins = p.minutesPlayed ?? (p.isStarter ? matchDuration : 0);
                    const pct = Math.min(100, Math.round((mins / matchDuration) * 100));

                    return (
                      <div
                        key={p.playerId}
                        className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/60 transition"
                      >
                        {/* Player name & condition */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                              p.isStarter
                                ? 'bg-emerald-700 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {p.isStarter ? '⭐' : '🪑'}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-gray-900 truncate">
                                {p.playerName}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                                  p.isStarter
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {p.isStarter ? 'Titular' : 'Suplente'}
                              </span>

                              {p.subbedOutMinute && (
                                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.2 rounded-md border border-red-200">
                                  🔻 Salió min {p.subbedOutMinute}'
                                </span>
                              )}
                              {p.subbedInMinute && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                                  🔺 Entró min {p.subbedInMinute}'
                                </span>
                              )}
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5 max-w-xs overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  pct >= 80
                                    ? 'bg-emerald-600'
                                    : pct >= 40
                                    ? 'bg-blue-600'
                                    : pct > 0
                                    ? 'bg-amber-500'
                                    : 'bg-gray-300'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Minutes Steppers & input */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePlayerMinutes(p.playerId, -5)}
                            className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition cursor-pointer"
                            title="Restar 5 minutos"
                          >
                            -5'
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePlayerMinutes(p.playerId, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-black text-xs flex items-center justify-center transition cursor-pointer"
                          >
                            -
                          </button>

                          <div className="w-16 text-center">
                            <span className="font-mono font-black text-sm text-gray-900 block">
                              {mins}'
                            </span>
                            <span className="text-[9px] text-gray-400 block">
                              {pct}% partido
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updatePlayerMinutes(p.playerId, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center transition cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePlayerMinutes(p.playerId, 5)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer border border-emerald-200"
                            title="Sumar 5 minutos"
                          >
                            +5'
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <div className="text-[11px] text-gray-400">
              {activeTab === 'score'
                ? 'Paso 1: Marcador y rendimiento individual'
                : 'Paso 2: Control de sustituciones y minutos jugados'}
            </div>

            <div className="flex items-center gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};
