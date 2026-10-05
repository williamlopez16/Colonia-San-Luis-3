import React, { useState, useMemo } from 'react';
import type { Team, Match, Player, Tournament, PlayerMatchStats } from '../types';
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
  BarChart2,
  Users,
  Medal,
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
  const [activeSubTab, setActiveSubTab] = useState<'scorers' | 'assists' | 'discipline' | 'matches'>('scorers');

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

  // 3. Compute Individual Player Totals from played matches
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
      });
    });

    // Accumulate stats from played matches
    playedMatches.forEach((match) => {
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
        };

        // If player has some stat or was confirmed in match
        const playedInMatch =
          stat.goals > 0 ||
          stat.assists > 0 ||
          stat.yellowCards > 0 ||
          stat.redCards > 0 ||
          match.callups.some((c) => c.playerId === stat.playerId && c.status === 'Confirmado');

        if (playedInMatch) {
          existing.matchesCount += 1;
        }

        existing.goals += stat.goals || 0;
        existing.assists += stat.assists || 0;
        existing.yellowCards += stat.yellowCards || 0;
        existing.redCards += stat.redCards || 0;

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
        // Red card counts 3 penalty points, yellow counts 1
        const penaltyA = a.redCards * 3 + a.yellowCards;
        const penaltyB = b.redCards * 3 + b.yellowCards;
        return penaltyB - penaltyA;
      });
  }, [playerStatsMap]);

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
            Goleadores, asistencias, tarjetas y rendimiento deportivo de {teamName}
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
          <span className="text-2xl font-black text-emerald-700 font-mono">{teamRecord.goalsFor}</span>
          <span className="text-[10px] text-gray-400 block">A favor</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">GC</span>
          <span className="text-2xl font-black text-red-700 font-mono">{teamRecord.goalsAgainst}</span>
          <span className="text-[10px] text-gray-400 block">En contra</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DG</span>
          <span
            className={`text-2xl font-black font-mono ${
              teamRecord.goalDifference > 0
                ? 'text-emerald-700'
                : teamRecord.goalDifference < 0
                ? 'text-red-700'
                : 'text-gray-700'
            }`}
          >
            {teamRecord.goalDifference > 0 ? `+${teamRecord.goalDifference}` : teamRecord.goalDifference}
          </span>
          <span className="text-[10px] text-gray-400 block">Dif. Goles</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-3.5 rounded-2xl border border-emerald-700 shadow-2xs text-center text-white">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">PTS</span>
          <span className="text-2xl font-black text-amber-300 font-mono">{teamRecord.points}</span>
          <span className="text-[10px] text-emerald-200 font-medium block">
            {teamRecord.effectiveness}% Efect.
          </span>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2 overflow-x-auto no-scrollbar text-xs font-bold">
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
          <span>Historial de Partidos ({playedMatches.length})</span>
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
                Ve a la pestaña de Partidos y haz clic en "Cargar Estadísticas" en el partido finalizado para registrar los goles.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                    <th className="py-3 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center">Dorsal</th>
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
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block bg-emerald-800 text-white font-black text-[11px] px-2 py-0.5 rounded-md">
                            {player.jerseyNumber}
                          </span>
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
                Registra las asistencias que generaron gol desde el modal de estadísticas de cada partido.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                    <th className="py-3 px-4 w-12 text-center">Pos.</th>
                    <th className="py-3 px-4">Jugador</th>
                    <th className="py-3 px-4 text-center">Dorsal</th>
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
                        <span className="inline-block bg-emerald-800 text-white font-black text-[11px] px-2 py-0.5 rounded-md">
                          {player.jerseyNumber}
                        </span>
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

      {/* Tab Content 3: Discipline */}
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
                    <th className="py-3 px-4 text-center">Dorsal</th>
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
                        <span className="inline-block bg-emerald-800 text-white font-black text-[11px] px-2 py-0.5 rounded-md">
                          {player.jerseyNumber}
                        </span>
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

      {/* Tab Content 4: Match History & Results */}
      {activeSubTab === 'matches' && (
        <div className="space-y-3">
          {playedMatches.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-800 text-sm">No hay partidos finalizados con marcador</h4>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                Cuando finalice un partido, ingresa a la pestaña "Partidos y Convocatorias" y carga el marcador final y goleadores.
              </p>
            </div>
          ) : (
            playedMatches.map((m) => {
              const hg = m.score?.homeGoals ?? 0;
              const ag = m.score?.awayGoals ?? 0;
              const isWin = hg > ag;
              const isDraw = hg === ag;
              const isLoss = hg < ag;

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
                      <div className="bg-gray-900 text-white font-mono font-black text-sm sm:text-base px-3 py-1 rounded-xl shadow-xs">
                        {hg} - {ag}
                      </div>

                      <span className="font-bold text-xs sm:text-sm text-gray-700 max-w-[100px] truncate">
                        {m.rival}
                      </span>
                      <TeamCrest name={m.rival} isOurTeam={false} size="sm" />
                    </div>
                  </div>

                  {/* Middle / Scorers info */}
                  <div className="text-xs text-gray-500 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold text-[10px]">
                        {m.tournamentName}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatMatchDate(m.date)}
                      </span>
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
                      <span>Editar Estadísticas</span>
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
