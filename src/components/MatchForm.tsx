import React, { useState } from 'react';
import type { Team, Tournament, Player, Concept, Match, Callup } from '../types';
import { saveMatch, saveTournament, generateUUID } from '../services/dataService';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  DollarSign,
  AlertCircle,
  Plus,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';

interface MatchFormProps {
  team: Team | null;
  tournaments: Tournament[];
  players: Player[];
  concepts: Concept[];
  onMatchCreated: (match: Match) => void;
  onCancel: () => void;
}

export const MatchForm: React.FC<MatchFormProps> = ({
  team,
  tournaments,
  players,
  concepts,
  onMatchCreated,
  onCancel,
}) => {
  // Default values
  const defaultArbitration = concepts.find((c) => c.isDefaultArbitration);
  const defaultFeeString = defaultArbitration
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
        defaultArbitration.suggestedValue
      )
    : '$12.000';

  // Form states
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(
    tournaments.length > 0 ? tournaments[0].id : ''
  );
  const [isCreatingNewTourn, setIsCreatingNewTourn] = useState<boolean>(tournaments.length === 0);
  const [newTournName, setNewTournName] = useState<string>('');

  const [rival, setRival] = useState<string>('');
  const [date, setDate] = useState<string>(() => {
    // Default to upcoming Saturday or tomorrow
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>('19:30');
  const [location, setLocation] = useState<string>('Cancha Sintética Municipal San Luis');
  const [refereeFee, setRefereeFee] = useState<string>(defaultFeeString);

  // Active players pre-selected by default
  const activePlayers = players.filter((p) => p.status === 'Activo');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
    new Set(activePlayers.map((p) => p.id))
  );

  // Status & error handling
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPlayerIds(next);
  };

  const selectAllActive = () => {
    setSelectedPlayerIds(new Set(activePlayers.map((p) => p.id)));
  };

  const clearSelection = () => {
    setSelectedPlayerIds(new Set());
  };

  const handleApplyConceptFee = (concept: Concept) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(concept.suggestedValue);
    setRefereeFee(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!team) {
      setFormError('Primero debes guardar el equipo.');
      return;
    }

    const trimmedRival = rival.trim();
    if (!trimmedRival) {
      setFormError('El nombre del equipo rival es obligatorio.');
      return;
    }
    if (!date) {
      setFormError('La fecha del partido es obligatoria.');
      return;
    }

    if (selectedPlayerIds.size === 0) {
      setFormError('Debes seleccionar al menos 1 jugador para la convocatoria.');
      return;
    }

    // Resolve tournament name
    let finalTournamentId = selectedTournamentId;
    let finalTournamentName = '';

    if (isCreatingNewTourn) {
      const trimmedTourn = newTournName.trim();
      if (!trimmedTourn) {
        setFormError('Por favor escribe el nombre del nuevo torneo.');
        return;
      }
      finalTournamentId = generateUUID();
      finalTournamentName = trimmedTourn;

      // Save new tournament asynchronously
      try {
        await saveTournament({
          id: finalTournamentId,
          teamId: team.id,
          name: trimmedTourn,
          year: new Date().getFullYear().toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Failed saving tournament in background:', err);
      }
    } else {
      const t = tournaments.find((item) => item.id === selectedTournamentId);
      finalTournamentName = t ? t.name : 'Torneo Oficial';
    }

    // Prepare Callup array
    const callups: Callup[] = [];
    players.forEach((p) => {
      if (selectedPlayerIds.has(p.id)) {
        callups.push({
          playerId: p.id,
          fullName: p.fullName,
          jerseyNumber: p.jerseyNumber,
          phone: p.phone,
          status: 'Pendiente', // Initial attendance status
        });
      }
    });

    // Sort callups by jersey number
    callups.sort((a, b) => a.jerseyNumber - b.jerseyNumber);

    setIsSubmitting(true);
    try {
      const newMatch: Match = {
        id: generateUUID(),
        teamId: team.id,
        tournamentId: finalTournamentId,
        tournamentName: finalTournamentName,
        rival: trimmedRival,
        date,
        time: time.trim(),
        location: location.trim(),
        refereeFee: refereeFee.trim(),
        status: 'Abierta',
        callups,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveMatch(newMatch);
      onMatchCreated(newMatch);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al programar el partido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Calendar className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Programar Partido y Convocatoria</h2>
            <p className="text-xs text-emerald-200">
              Crea el partido, selecciona a los jugadores convocados y genera el enlace y WhatsApp
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-emerald-200 hover:text-white p-1 cursor-pointer"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
        {formError && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs flex items-start gap-2 border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
            <p className="font-medium">{formError}</p>
          </div>
        )}

        {/* Section 1: Tournament & Rival */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Torneo / Campeonato *
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewTourn(!isCreatingNewTourn)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
              >
                {isCreatingNewTourn ? (
                  'Elegir del catálogo'
                ) : (
                  <>
                    <Plus className="w-3 h-3" /> Nuevo Torneo
                  </>
                )}
              </button>
            </div>

            {isCreatingNewTourn ? (
              <input
                type="text"
                value={newTournName}
                onChange={(e) => setNewTournName(e.target.value)}
                placeholder="Nombre del nuevo torneo..."
                className="w-full rounded-xl border border-emerald-400 bg-emerald-50/30 px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-emerald-200 outline-hidden"
                required
              />
            ) : (
              <div className="relative">
                <select
                  value={selectedTournamentId}
                  onChange={(e) => setSelectedTournamentId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.year ? `(${t.year})` : ''}
                    </option>
                  ))}
                </select>
                <Trophy className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Equipo Rival 🆚 *
            </label>
            <input
              type="text"
              value={rival}
              onChange={(e) => setRival(e.target.value)}
              placeholder="Ej. Real San Luis F.C."
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              required
            />
          </div>
        </div>

        {/* Section 2: Date, Time & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Fecha del Partido *
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Hora *
            </label>
            <div className="relative">
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                required
              />
              <Clock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lugar / Cancha
            </label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Cancha o estadio"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
              <MapPin className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Section 3: Referee Fee & Concepts */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-xs font-semibold text-gray-800 mb-1">
            Valor de Arbitraje por Jugador (editable libremente)
          </label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative w-full sm:w-60">
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={refereeFee}
                onChange={(e) => setRefereeFee(e.target.value)}
                placeholder="$12.000"
                className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-200 outline-hidden"
              />
            </div>

            {/* Quick concept chips */}
            {concepts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-gray-500 text-[11px] font-medium">Conceptos frecuentes:</span>
                {concepts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyConceptFee(c)}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-gray-200 rounded-lg text-emerald-800 text-[11px] font-medium transition cursor-pointer"
                  >
                    {c.name} ({new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.suggestedValue)})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Callup selection from roster */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-gray-900">
                Selección de Convocados ({selectedPlayerIds.size} seleccionados)
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllActive}
                className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
              >
                Seleccionar todos activos
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Limpiar
              </button>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-center">
              Aún no tienes jugadores registrados. Ve a la pestaña <strong>Jugadores</strong> para agregar la plantilla.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 border border-gray-200 rounded-xl bg-gray-50/50">
              {players.map((p) => {
                const isSelected = selectedPlayerIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer select-none ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {p.jerseyNumber}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-xs truncate leading-tight">{p.fullName}</p>
                        <p className="text-[10px] text-gray-500">{p.status}</p>
                      </div>
                    </div>

                    <div className="flex-shrink-0 ml-2">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? 'Guardando Convocatoria...' : 'Guardar y Generar Convocatoria 📋'}
          </button>
        </div>
      </form>
    </div>
  );
};
