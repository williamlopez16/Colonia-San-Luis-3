import React, { useState, useMemo } from 'react';
import type { Team, Match, Player, Tournament } from '../types';
import { TeamCrest } from './TeamCrest';
import { formatMatchDate } from '../services/whatsappService';
import {
  Trophy,
  Target,
  Award,
  ShieldAlert,
  Calendar,
  Filter,
  TrendingUp,
  ArrowRightLeft,
  Timer,
  Clock,
  Star,
  Zap,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

interface StatsViewProps {
  team: Team | null;
  matches: Match[];
  players: Player[];
  tournaments: Tournament[];
  onOpenMatchStats: (matchId: string) => void;
  onSelectMatch: (matchId: string) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  team,
  matches,
  players,
  tournaments,
  onOpenMatchStats,
  onSelectMatch,
}) => {
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<
    'scorers' | 'assists' | 'minutes' | 'substitutions' | 'discipline' | 'matches'
  >('scorers');

  const teamName = team?.name || 'Club San Luis';

  // 1. Filtered Matches
  const filteredMatches = useMemo(() => {
    if (selectedTournamentId === 'all') return matches;
    return matches.filter((m) => m.tournamentId === selectedTournamentId);
  }, [matches, selectedTournamentId]);

  // Played Matches (those marked as 'Finalizado' or having a valid recorded score)
  const playedMatches = useMemo(() => {
    return filteredMatches.filter(
      (m) => m.matchState === 'Finalizado' || (m.score && m.score.isPlayed)
    );
  }, [filteredMatches]);

  // 2. Compute Team Record / Table Summary
  const teamRecord = useMemo(() => {
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    playedMatches.forEach((m) => {
      played += 1;
      const hg = m.score?.homeGoals ?? 0;
      const ag = m.score?.awayGoals ?? 0;
      goalsFor += hg;
      goalsAgainst += ag;

      if (hg > ag) won += 1;
      else if (hg === ag) drawn += 1;
      else lost += 1;
    });

    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn * 1;
    const maxPossiblePoints = played * 3;
    const effectiveness = maxPossiblePoints > 0 ? Math.round((points / maxPossiblePoints) * 100) : 0;

    return {
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      effectiveness,
    };
  }, [playedMatches]);

  // 3. Compute Individual Player Totals from played matches (goals, assists, cards, minutes, substitutions)
  const playerStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        playerId: string;
        name: string;
        jerseyNumber: number;
        matchesCount: number;
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
        starterCount: number;
        subbedInCount: number;
        subbedOutCount: number;
        minutesPlayed: number;
      }
    >();

    // Seed with all squad players
    players.forEach((p) => {
      map.set(p.id, {
        playerId: p.id,
        name: p.fullName,
        jerseyNumber: p.jerseyNumber,
        matchesCount: 0,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        starterCount: 0,
        subbedInCount: 0,
        subbedOutCount: 0,
        minutesPlayed: 0,
      });
    });

    // Accumulate stats from played matches
    playedMatches.forEach((match) => {
      const matchDuration = match.matchDurationMinutes || 90;
      const statsList = match.playerStats || [];

      statsList.forEach((stat) => {
        const existing = map.get(stat.playerId) || {
          playerId: stat.playerId,
          name: stat.playerName,
          jerseyNumber: stat.jerseyNumber,
          matchesCount: 0,
          goals: 0,
          assists: 0,
          yellowCards: 0,
          redCards: 0,
          starterCount: 0,
          subbedInCount: 0,
          subbedOutCount: 0,
          minutesPlayed: 0,
        };

        const callupItem = match.callups.find((c) => c.playerId === stat.playerId);
        const playedInMatch =
          stat.goals > 0 ||
          stat.assists > 0 ||
          stat.yellowCards > 0 ||
          stat.redCards > 0 ||
          stat.isStarter ||
          Boolean(stat.minutesPlayed && stat.minutesPlayed > 0) ||
          Boolean(callupItem && (callupItem.attended !== undefined ? callupItem.attended : callupItem.status === 'Confirmado'));

        if (playedInMatch) {
          existing.matchesCount += 1;
        }

        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        existing.yellowCards += stat.yellowCards || 0;
        existing.redCards += stat.redCards || 0;

        if (stat.isStarter) {
          existing.starterCount += 1;
        }
        if (stat.subbedInMinute !== undefined) {
          existing.subbedInCount += 1;
        }
        if (stat.subbedOutMinute !== undefined) {
          existing.subbedOutCount += 1;
        }

        if (stat.minutesPlayed !== undefined) {
          existing.minutesPlayed += stat.minutesPlayed;
        } else if (stat.isStarter) {
          existing.minutesPlayed += matchDuration;
        }

        map.set(stat.playerId, existing);
      });
    });

    return Array.from(map.values());
  }, [players, playedMatches]);

  // Top Scorers Ranking
  const topScorers = useMemo(() => {
    return [...playerStatsMap]
      .filter((p) => p.goals > 0)
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));
  }, [playerStatsMap]);

  // Top Assists Ranking
  const topAssists = useMemo(() => {
    return [...playerStatsMap]
      .filter((p) => p.assists > 0)
      .sort((a, b) => b.assists - a.assists || a.name.localeCompare(b.name));
  }, [playerStatsMap]);

  // Discipline Ranking
  const disciplineRanking = useMemo(() => {
    return [...playerStatsMap]
      .filter((p) => p.yellowCards > 0 || p.redCards > 0)
      .sort((a, b) => {
        const penaltyA = a.redCards * 3 + a.yellowCards;
        const penaltyB = b.redCards * 3 + b.yellowCards;
        return penaltyB - penaltyA;
      });
  }, [playerStatsMap]);

  // Minutes Ranking (Control de Minutos Jugados)
  const minutesRanking = useMemo(() => {
    return [...playerStatsMap]
      .filter((p) => p.minutesPlayed > 0 || p.matchesCount > 0)
      .sort((a, b) => b.minutesPlayed - a.minutesPlayed || b.matchesCount - a.matchesCount);
  }, [playerStatsMap]);

  // Substitutions / Changes Ranking
  const substitutionsRanking = useMemo(() => {
    return [...playerStatsMap]
      .filter((p) => p.subbedInCount > 0 || p.subbedOutCount > 0)
      .sort((a, b) => (b.subbedInCount + b.subbedOutCount) - (a.subbedInCount + a.subbedOutCount));
  }, [playerStatsMap]);

  // Total Team Substitutions across played matches
  const totalSubstitutionsCount = useMemo(() => {
    return playedMatches.reduce((sum, m) => sum + (m.substitutions?.length || 0), 0);
  }, [playedMatches]);

  // Maximum team possible minutes
  const totalTeamPossibleMinutes = useMemo(() => {
    return playedMatches.reduce((sum, m) => sum + (m.matchDurationMinutes || 90), 0);
  }, [playedMatches]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Estadísticas del Equipo
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Goleadores, asistencias, control de minutos jugados, cambios y rendimiento de {teamName}
          </p>
        </div>

        {/* Tournament Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3.5 py-2 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition cursor-pointer"
          >
            <option value="all">🏆 Todos los Torneos</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.year ? `(${t.year})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Record KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">PJ</span>
          <span className="text-2xl font-black text-gray-900 font-mono">{teamRecord.played}</span>
          <span className="text-[10px] text-gray-400 block">Jugados</span>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">PG</span>
          <span className="text-2xl font-black text-emerald-700 font-mono">{teamRecord.won}</span>
          <span className="text-[10px] text-emerald-600 font-medium block">Ganados</span>
        </div>

        <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">PE</span>
          <span className="text-2xl font-black text-amber-700 font-mono">{teamRecord.drawn}</span>
          <span className="text-[10px] text-amber-600 font-medium block">Empates</span>
        </div>

        <div className="bg-red-50/70 p-3.5 rounded-2xl border border-red-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">PP</span>
          <span className="text-2xl font-black text-red-700 font-mono">{teamRecord.lost}</span>
          <span className="text-[10px] text-red-600 font-medium block">Perdidos</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">GF</span>
          <span className="text-2xl font-black text-gray-900 font-mono">{teamRecord.goalsFor}</span>
          <span className="text-[10px] text-gray-400 block">A favor</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">GC</span>
          <span className="text-2xl font-black text-gray-900 font-mono">{teamRecord.goalsAgainst}</span>
          <span className="text-[10px] text-gray-400 block">En contra</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DIF</span>
          <span
            className={`text-2xl font-black font-mono ${
              teamRecord.goalDifference > 0
                ? 'text-emerald-700'
                : teamRecord.goalDifference < 0
                ? 'text-red-700'
                : 'text-gray-900'
            }`}
          >
            {teamRecord.goalDifference > 0 ? `+${teamRecord.goalDifference}` : teamRecord.goalDifference}
          </span>
          <span className="text-[10px] text-gray-400 block">Dif. Goles</span>
        </div>

        <div className="bg-emerald-900 text-white p-3.5 rounded-2xl border border-emerald-950 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">PTS</span>
          <span className="text-2xl font-black text-white font-mono">{teamRecord.points}</span>
          <span className="text-[10px] text-emerald-200 block">{teamRecord.effectiveness}% Efect.</span>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveSubTab('scorers')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'scorers'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Goleadores ({topScorers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('assists')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'assists'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Asistencias ({topAssists.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('minutes')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'minutes'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Minutos Jugados ({minutesRanking.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('substitutions')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'substitutions'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Control de Cambios ({totalSubstitutionsCount})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('discipline')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'discipline'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Disciplina ({disciplineRanking.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('matches')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'matches'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Historial ({playedMatches.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Top Scorers */}
      {activeSubTab === 'scorers' && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>Tabla de Goleadores (Pichichi)</span>
            </h3>
            <span className="text-xs text-gray-500">
              Total goles de equipo: <b>{teamRecord.goalsFor}</b>
            </span>
          </div>

          {topScorers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 text-sm">Aún no hay goles registrados</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Ve a la pestaña de Partidos y haz clic en "Estadísticas del Partido" en el partido finalizado para registrar los goles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                    <th className="py-3 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center">Partidos</th>
                    <th className="py-3 px-4 text-center font-extrabold text-emerald-800">Goles ⚽</th>
                    <th className="py-3 px-4 text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {topScorers.map((player, idx) => {
                    const avg = player.matchesCount > 0 ? (player.goals / player.matchesCount).toFixed(2) : '-';
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;

                    return (
                      <tr key={player.playerId} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-sm">
                          {medal}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-gray-900 block text-sm">{player.name}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-600 font-mono">
                          {player.matchesCount}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block bg-emerald-100 text-emerald-900 font-black text-sm px-2.5 py-1 rounded-xl">
                            {player.goals}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-500 font-mono">
                          {avg}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Top Assists */}
      {activeSubTab === 'assists' && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Líderes de Asistencias</span>
            </h3>
          </div>

          {topAssists.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 text-sm">Aún no hay asistencias registradas</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Registra las asistencias que generaron gol desde las estadísticas de cada partido.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                    <th className="py-3 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center font-extrabold text-blue-800">Asistencias 👟</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {topAssists.map((player, idx) => (
                    <tr key={player.playerId} className="hover:bg-blue-50/40 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-sm">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-900 block text-sm">{player.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block bg-blue-100 text-blue-900 font-black text-sm px-2.5 py-1 rounded-xl">
                          {player.assists}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Minutos Jugados (NEW) */}
      {activeSubTab === 'minutes' && (
        <div className="space-y-4">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <Star className="w-5 h-5 fill-emerald-600 text-emerald-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Hombre de Hierro (Más Minutos)
                </span>
                <span className="font-extrabold text-sm text-gray-900 block truncate">
                  {minutesRanking[0] ? `${minutesRanking[0].name} (${minutesRanking[0].minutesPlayed}')` : 'Sin datos'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Minutos del Torneo
                </span>
                <span className="font-extrabold text-sm text-gray-900 block font-mono">
                  {totalTeamPossibleMinutes} min posibles
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0">
                <Timer className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Jugadores con Minutos
                </span>
                <span className="font-extrabold text-sm text-gray-900 block font-mono">
                  {minutesRanking.filter((p) => p.minutesPlayed > 0).length} de {players.length} jugadores
                </span>
              </div>
            </div>
          </div>

          {/* Minutes Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <Timer className="w-4 h-4 text-emerald-600" />
                <span>Control de Minutos Jugados por Jugador</span>
              </h3>
              <span className="text-xs text-gray-500">
                Basado en partidos jugados y sustituciones
              </span>
            </div>

            {minutesRanking.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Timer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800 text-sm">No hay registro de minutos aún</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Abre las "Estadísticas del Partido" en cualquier partido finalizado para asignar titulares y registrar sustituciones.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                      <th className="py-3 px-4 w-12 text-center">Pos.</th>
                      <th className="py-3 px-4">Jugador</th>
                      <th className="py-3 px-4 text-center">Partidos</th>
                      <th className="py-3 px-4 text-center">Titular (T)</th>
                      <th className="py-3 px-4 text-center">Suplente (S)</th>
                      <th className="py-3 px-4 text-center font-extrabold text-emerald-800">Minutos Totales ⏱️</th>
                      <th className="py-3 px-4 text-center">Promedio / PJ</th>
                      <th className="py-3 px-4 text-center min-w-[120px]">Rango de Juego</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {minutesRanking.map((player, idx) => {
                      const avg = player.matchesCount > 0 ? Math.round(player.minutesPlayed / player.matchesCount) : 0;
                      const pct = totalTeamPossibleMinutes > 0
                        ? Math.min(100, Math.round((player.minutesPlayed / totalTeamPossibleMinutes) * 100))
                        : 0;

                      return (
                        <tr key={player.playerId} className="hover:bg-emerald-50/40 transition">
                          <td className="py-3.5 px-4 text-center font-bold text-sm text-gray-600">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-gray-900 block text-sm">{player.name}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-600 font-mono">
                            {player.matchesCount}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-100">
                              ⭐ {player.starterCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded-md border border-blue-100">
                              🪑 {player.subbedInCount}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-block bg-emerald-100 text-emerald-950 font-black text-sm px-3 py-1 rounded-xl">
                              {player.minutesPlayed}'
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-gray-600 font-mono font-bold">
                            {avg}'
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 75 ? 'bg-emerald-600' : pct >= 40 ? 'bg-blue-600' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                                {pct}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 4: Control de Cambios y Sustituciones (NEW) */}
      {activeSubTab === 'substitutions' && (
        <div className="space-y-4">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                <ArrowRightLeft className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Total Cambios Realizados
                </span>
                <span className="font-extrabold text-xl text-gray-900 block font-mono">
                  {totalSubstitutionsCount} sustituciones
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black">🔻</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Más Sustituido (Sale)
                </span>
                <span className="font-extrabold text-sm text-gray-900 block truncate">
                  {substitutionsRanking.sort((a, b) => b.subbedOutCount - a.subbedOutCount)[0]?.subbedOutCount > 0
                    ? `${substitutionsRanking.sort((a, b) => b.subbedOutCount - a.subbedOutCount)[0].name} (${substitutionsRanking.sort((a, b) => b.subbedOutCount - a.subbedOutCount)[0].subbedOutCount} veces)`
                    : 'Sin datos'}
                </span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black">🔺</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Mejor Revulsivo (Entra desde el banco)
                </span>
                <span className="font-extrabold text-sm text-gray-900 block truncate">
                  {substitutionsRanking.sort((a, b) => b.subbedInCount - a.subbedInCount)[0]?.subbedInCount > 0
                    ? `${substitutionsRanking.sort((a, b) => b.subbedInCount - a.subbedInCount)[0].name} (${substitutionsRanking.sort((a, b) => b.subbedInCount - a.subbedInCount)[0].subbedInCount} veces)`
                    : 'Sin datos'}
                </span>
              </div>
            </div>
          </div>

          {/* Substitutions Ranking Table */}
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                <span>Estadísticas de Sustituciones y Rotaciones</span>
              </h3>
            </div>

            {substitutionsRanking.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <ArrowRightLeft className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-bold text-gray-800 text-sm">No hay cambios registrados</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Registra quiénes entran y salen en cada partido desde las estadísticas de partido.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                      <th className="py-3 px-4 w-12 text-center">Pos.</th>
                      <th className="py-3 px-4">Jugador</th>
                      <th className="py-3 px-4 text-center text-red-700 font-bold">Veces Sustituido (🔻 Sale)</th>
                      <th className="py-3 px-4 text-center text-emerald-700 font-bold">Revulsivo (🔺 Entra)</th>
                      <th className="py-3 px-4 text-center font-extrabold text-gray-800">Total Cambios Involucrado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {substitutionsRanking.map((player, idx) => (
                      <tr key={player.playerId} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-4 text-center font-bold text-sm text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                          {player.name}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {player.subbedOutCount > 0 ? (
                            <span className="inline-block bg-red-100 text-red-900 font-black px-2.5 py-1 rounded-lg">
                              🔻 {player.subbedOutCount}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {player.subbedInCount > 0 ? (
                            <span className="inline-block bg-emerald-100 text-emerald-900 font-black px-2.5 py-1 rounded-lg">
                              🔺 {player.subbedInCount}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">
                          {player.subbedInCount + player.subbedOutCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content 5: Discipline */}
      {activeSubTab === 'discipline' && (
        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Registro de Tarjetas y Juego Limpio</span>
            </h3>
          </div>

          {disciplineRanking.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 text-sm">¡Plantel con Juego Limpio Impecable!</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No hay tarjetas amarillas ni rojas registradas en los partidos disputados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center text-amber-700 font-bold">Amarillas 🟨</th>
                    <th className="py-3 px-4 text-center text-red-700 font-bold">Rojas 🟥</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {disciplineRanking.map((player) => (
                    <tr key={player.playerId} className="hover:bg-gray-50/50 transition">
                      <td className="py-3.5 px-4 font-bold text-gray-900 text-sm">
                        {player.name}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {player.yellowCards > 0 ? (
                          <span className="inline-block bg-amber-100 text-amber-900 font-black px-2.5 py-1 rounded-lg">
                            {player.yellowCards} 🟨
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {player.redCards > 0 ? (
                          <span className="inline-block bg-red-100 text-red-900 font-black px-2.5 py-1 rounded-lg">
                            {player.redCards} 🟥
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 6: Match History & Results */}
      {activeSubTab === 'matches' && (
        <div className="space-y-3">
          {playedMatches.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 text-sm">No hay partidos finalizados con marcador</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Cuando finalice un partido, ingresa a la pestaña "Partidos y Convocatorias" y carga las estadísticas del partido.
              </p>
            </div>
          ) : (
            playedMatches.map((m) => {
              const hg = m.score?.homeGoals ?? 0;
              const ag = m.score?.awayGoals ?? 0;
              const isWin = hg > ag;
              const isDraw = hg === ag;

              const scorers = (m.playerStats || [])
                .filter((p) => p.goals > 0)
                .map((p) => `${p.playerName} (${p.goals})`);

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-gray-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left: Clash & Result */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    {/* Outcome Badge */}
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                        isWin
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDraw
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {isWin ? 'V' : isDraw ? 'E' : 'D'}
                    </div>

                    {/* Team Crests & Score */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <TeamCrest name={teamName} isOurTeam size="sm" />
                      <span className="font-bold text-xs sm:text-sm text-gray-900 max-w-[100px] truncate">
                        {teamName}
                      </span>

                      {/* Official Scoreboard */}
                      <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white font-mono font-black text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-xl shadow-sm border border-emerald-500/30 flex items-center gap-1 ring-1 ring-emerald-500/10">
                        <span>{hg}</span>
                        <span className="text-emerald-400 text-xs font-sans">-</span>
                        <span>{ag}</span>
                      </div>

                      <span className="font-bold text-xs sm:text-sm text-gray-700 max-w-[100px] truncate">
                        {m.rival}
                      </span>
                      <TeamCrest name={m.rival} isOurTeam={false} size="sm" />
                    </div>
                  </div>

                  {/* Middle / Scorers info & Subs */}
                  <div className="text-xs text-gray-500 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {m.tournamentName}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatMatchDate(m.date)}
                      </span>
                      {m.substitutions && m.substitutions.length > 0 && (
                        <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold border border-blue-200">
                          🔄 {m.substitutions.length} cambios
                        </span>
                      )}
                    </div>
                    {scorers.length > 0 ? (
                      <p className="text-[11px] text-emerald-700 font-semibold truncate">
                        ⚽ {scorers.join(', ')}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-400">Sin goleadores registrados</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onOpenMatchStats(m.id)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Estadísticas del Partido</span>
                    </button>
                    <button
                      onClick={() => onSelectMatch(m.id)}
                      className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs transition cursor-pointer"
                    >
                      Ver Partido
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
