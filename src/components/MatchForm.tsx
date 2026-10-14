import React, { useState, useMemo } from 'react';
import type { Team, Tournament, Player, Concept, Venue, Match, Callup } from '../types';
import {
  saveMatch,
  saveTournament,
  saveVenue,
  deleteVenue,
  generateUUID,
  syncMatchRefereeCharges,
} from '../services/dataService';
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
  Edit2,
  UserCheck,
  Check,
  Trash2,
  Star,
  Settings,
} from 'lucide-react';

interface MatchFormProps {
  team: Team | null;
  tournaments: Tournament[];
  players: Player[];
  concepts: Concept[];
  venues?: Venue[];
  matchToEdit?: Match | null;
  onMatchCreated: (match: Match) => void;
  onCancel: () => void;
}

export const MatchForm: React.FC<MatchFormProps> = ({
  team,
  tournaments,
  players,
  concepts,
  venues = [],
  matchToEdit,
  onMatchCreated,
  onCancel,
}) => {
  const isEditMode = !!matchToEdit;

  // Default values
  const defaultArbitration = concepts.find((c) => c.isDefaultArbitration);
  const defaultFeeString = defaultArbitration
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
        defaultArbitration.suggestedValue
      )
    : '$12.000';

  // Form states
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>(() => {
    if (matchToEdit?.tournamentId) return matchToEdit.tournamentId;
    return tournaments.length > 0 ? tournaments[0].id : '';
  });
  const [isCreatingNewTourn, setIsCreatingNewTourn] = useState<boolean>(
    !matchToEdit && tournaments.length === 0
  );
  const [newTournName, setNewTournName] = useState<string>('');

  const [rival, setRival] = useState<string>(matchToEdit?.rival || '');
  const [date, setDate] = useState<string>(() => {
    if (matchToEdit?.date) return matchToEdit.date;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [time, setTime] = useState<string>(matchToEdit?.time || '19:30');
  const defaultVenue = venues.find((v) => v.isDefault) || venues[0];
  const initialLocation = matchToEdit?.location || defaultVenue?.name || 'Cancha Sintética Municipal San Luis';
  const [location, setLocation] = useState<string>(initialLocation);
  const [refereeFee, setRefereeFee] = useState<string>(
    matchToEdit?.refereeFee || defaultFeeString
  );
  const [refereeCollectorName, setRefereeCollectorName] = useState<string>(
    matchToEdit?.refereeCollectorName || ''
  );

  // Estados para gestión de canchas predeterminadas
  const [showVenueManager, setShowVenueManager] = useState<boolean>(false);
  const [newVenueName, setNewVenueName] = useState<string>('');
  const [newVenueAddress, setNewVenueAddress] = useState<string>('');
  const [newVenueIsDefault, setNewVenueIsDefault] = useState<boolean>(false);
  const [isSavingVenue, setIsSavingVenue] = useState<boolean>(false);
  const [venueToast, setVenueToast] = useState<string | null>(null);

  const isCurrentLocationSaved = useMemo(() => {
    if (!location.trim()) return false;
    return venues.some(
      (v) => v.name.trim().toLowerCase() === location.trim().toLowerCase()
    );
  }, [venues, location]);

  const handleQuickSaveCurrentLocation = async () => {
    if (!location.trim() || isCurrentLocationSaved) return;
    setIsSavingVenue(true);
    try {
      await saveVenue({
        teamId: team?.id,
        name: location.trim(),
        isDefault: venues.length === 0,
      });
      setVenueToast(`¡Cancha "${location.trim()}" guardada como predeterminada!`);
      setTimeout(() => setVenueToast(null), 3500);
    } catch (err) {
      console.error('Error saving venue:', err);
    } finally {
      setIsSavingVenue(false);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    setIsSavingVenue(true);
    try {
      const created = await saveVenue({
        teamId: team?.id,
        name: newVenueName.trim(),
        address: newVenueAddress.trim() || undefined,
        isDefault: newVenueIsDefault,
      });
      setLocation(created.name);
      setNewVenueName('');
      setNewVenueAddress('');
      setNewVenueIsDefault(false);
      setVenueToast(`¡Cancha "${created.name}" guardada y seleccionada!`);
      setTimeout(() => setVenueToast(null), 3500);
    } catch (err) {
      console.error('Error creating venue:', err);
    } finally {
      setIsSavingVenue(false);
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    try {
      await deleteVenue(venueId);
      setVenueToast('Cancha eliminada del catálogo');
      setTimeout(() => setVenueToast(null), 3000);
    } catch (err) {
      console.error('Error deleting venue:', err);
    }
  };

  // Players selection
  const activePlayers = players.filter((p) => p.status === 'Activo');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(() => {
    if (matchToEdit && matchToEdit.callups.length > 0) {
      return new Set(matchToEdit.callups.map((c) => c.playerId));
    }
    return new Set(activePlayers.map((p) => p.id));
  });

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
    const existingCallupMap = new Map((matchToEdit?.callups || []).map((c) => [c.playerId, c]));
    const callups: Callup[] = [];
    players.forEach((p) => {
      if (selectedPlayerIds.has(p.id)) {
        const existingCallup = existingCallupMap.get(p.id);
        callups.push({
          playerId: p.id,
          fullName: p.fullName,
          jerseyNumber: p.jerseyNumber,
          phone: p.phone,
          status: existingCallup ? existingCallup.status : 'Pendiente',
          reason: existingCallup?.reason,
          confirmedAt: existingCallup?.confirmedAt,
        });
      }
    });

    // Sort callups by jersey number
    callups.sort((a, b) => a.jerseyNumber - b.jerseyNumber);

    setIsSubmitting(true);
    try {
      const savedMatch: Match = {
        ...matchToEdit,
        id: matchToEdit ? matchToEdit.id : generateUUID(),
        teamId: team.id,
        tournamentId: finalTournamentId,
        tournamentName: finalTournamentName,
        rival: trimmedRival,
        date,
        time: time.trim(),
        location: location.trim(),
        refereeFee: refereeFee.trim(),
        refereeCollectorName: refereeCollectorName.trim() || undefined,
        status: matchToEdit ? matchToEdit.status : 'Abierta',
        callups,
        createdAt: matchToEdit ? matchToEdit.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveMatch(savedMatch);
      await syncMatchRefereeCharges(savedMatch);
      onMatchCreated(savedMatch);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el partido.');
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
            {isEditMode ? (
              <Edit2 className="w-5 h-5 text-emerald-200" />
            ) : (
              <Calendar className="w-5 h-5 text-emerald-200" />
            )}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">
              {isEditMode ? 'Editar Partido y Convocatoria' : 'Programar Partido y Convocatoria'}
            </h2>
            <p className="text-xs text-emerald-200">
              {isEditMode
                ? 'Actualiza los datos del partido, la lista de convocados y los cobros de arbitraje'
                : 'Crea el partido, selecciona a los jugadores convocados y genera el enlace y WhatsApp'}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Lugar / Cancha
              </label>
              <button
                type="button"
                onClick={() => setShowVenueManager(true)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                title="Administrar o agregar canchas predeterminadas"
              >
                <Settings className="w-3 h-3" />
                <span>Canchas</span>
              </button>
            </div>
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

        {/* Canchas Predeterminadas Quick Selector */}
        <div className="bg-emerald-50/60 p-3 sm:p-3.5 rounded-2xl border border-emerald-100 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
              <span>🏟️ Canchas Predeterminadas ({venues.length}):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowVenueManager(true)}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Settings className="w-3 h-3 text-emerald-600" />
              <span>Administrar canchas</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {venues.map((v) => {
              const isSelected = location.trim().toLowerCase() === v.name.trim().toLowerCase();
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setLocation(v.name)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-300'
                      : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200 hover:border-emerald-300'
                  }`}
                  title={v.address || v.name}
                >
                  <span>{isSelected ? '✓' : '🏟️'}</span>
                  <span>{v.name}</span>
                  {v.isDefault && <span className="text-[10px] opacity-80" title="Cancha habitual">⭐</span>}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowVenueManager(true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-800 border border-dashed border-emerald-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nueva Cancha</span>
            </button>
          </div>

          {/* Quick-save prompt if user typed a custom venue not saved in presets */}
          {location.trim().length >= 3 && !isCurrentLocationSaved && (
            <div className="pt-1 flex items-center justify-between gap-2 flex-wrap border-t border-emerald-100/70 mt-1">
              <span className="text-[11px] text-gray-600">
                ¿Juegan seguido aquí? Puedes guardarla en tus predeterminadas:
              </span>
              <button
                type="button"
                disabled={isSavingVenue}
                onClick={handleQuickSaveCurrentLocation}
                className="text-[11px] font-extrabold text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Star className="w-3 h-3 text-purple-600 fill-purple-600" />
                <span>Guardar "{location.trim()}" en predeterminadas</span>
              </button>
            </div>
          )}

          {venueToast && (
            <div className="p-2 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-fade-in border border-emerald-200">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>{venueToast}</span>
            </div>
          )}
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

          {/* Quien recogerá el arbitraje */}
          <div className="mt-3.5 pt-3.5 border-t border-gray-200">
            <label className="block text-xs font-semibold text-gray-800 mb-1">
              ¿Quién recogerá el arbitraje ese día? (Opcional)
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <UserCheck className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={refereeCollectorName}
                  onChange={(e) => setRefereeCollectorName(e.target.value)}
                  placeholder="Ej. Capitán Carlos, DT Mario..."
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-300 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-purple-200 outline-hidden"
                />
              </div>

              {/* Quick suggestion chips of active players */}
              {activePlayers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-gray-500 text-[11px] font-medium">Sugerir:</span>
                  {activePlayers.slice(0, 5).map((p) => {
                    const isSelected = refereeCollectorName.trim().toLowerCase() === p.fullName.trim().toLowerCase();
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setRefereeCollectorName(isSelected ? '' : p.fullName)}
                        className={`px-2 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-white hover:bg-purple-50 border-gray-200 text-purple-900'
                        }`}
                      >
                        {p.fullName} {p.isCaptain ? '⭐' : ''}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
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
            {isSubmitting
              ? 'Guardando...'
              : isEditMode
              ? 'Guardar Cambios del Partido 💾'
              : 'Guardar y Generar Convocatoria 📋'}
          </button>
        </div>
      </form>

      {/* Modal: Administrador de Canchas Predeterminadas */}
      {showVenueManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 my-auto animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-950 text-white p-5 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Canchas Predeterminadas</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    Escenarios deportivos frecuentes para selección rápida
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVenueManager(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Form to add a new venue */}
              <form onSubmit={handleCreateVenue} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-gray-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Agregar Nueva Cancha</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nombre del Escenario Deportivo / Cancha *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVenueName}
                    onChange={(e) => setNewVenueName(e.target.value)}
                    placeholder="Ej. Cancha Sintética San Luis, Estadio Municipal..."
                    className="w-full text-xs font-bold text-gray-900 bg-white px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Dirección o Punto de Referencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newVenueAddress}
                    onChange={(e) => setNewVenueAddress(e.target.value)}
                    placeholder="Ej. Sector Central, frente al polideportivo..."
                    className="w-full text-xs text-gray-800 bg-white px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newVenueIsDefault}
                    onChange={(e) => setNewVenueIsDefault(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] font-semibold text-gray-700">
                    Marcar como cancha habitual / principal del equipo ⭐
                  </span>
                </label>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={isSavingVenue || !newVenueName.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isSavingVenue ? 'Guardando...' : 'Guardar Cancha'}</span>
                  </button>
                </div>
              </form>

              {/* List of existing venues */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-gray-500">
                  Canchas Guardadas ({venues.length})
                </h4>

                {venues.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    No tienes canchas guardadas aún. Agrega la primera arriba.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden bg-white">
                    {venues.map((v) => {
                      const isSelected = location.trim().toLowerCase() === v.name.trim().toLowerCase();
                      return (
                        <div
                          key={v.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/80 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-xs text-gray-900 truncate">
                                {v.name}
                              </span>
                              {v.isDefault && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Habitual ⭐
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  ✓ Seleccionada
                                </span>
                              )}
                            </div>
                            {v.address && (
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {v.address}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setLocation(v.name);
                                setShowVenueManager(false);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                              title="Usar esta cancha para el partido"
                            >
                              Usar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteVenue(v.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Eliminar cancha"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowVenueManager(false)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
