import React, { useState } from 'react';
import type { Team, Tournament } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { saveTeam, saveTournament, generateUUID, getActiveTeamId } from '../services/dataService';
import { Shield, Trophy, Plus, Save, AlertCircle, Check, Lock, Key } from 'lucide-react';

interface TeamTournamentModalProps {
  team: Team | null;
  tournaments: Tournament[];
  onClose?: () => void;
  isInitialSetup?: boolean;
}

export const TeamTournamentModal: React.FC<TeamTournamentModalProps> = ({
  team,
  tournaments,
  onClose,
  isInitialSetup = false,
}) => {
  const { isAdminMode, unlockAdminMode } = useAccessMode();
  const canEdit = isAdminMode || isInitialSetup || !team?.adminPassword;

  // Team form state
  const [teamName, setTeamName] = useState<string>(team?.name || 'Club San Luis');
  const [category, setCategory] = useState<string>(team?.category || 'Categoría Libre');
  const [slogan, setSlogan] = useState<string>(team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA');
  const [adminPassword, setAdminPassword] = useState<string>(team?.adminPassword || 'admin');
  const [primaryColor, setPrimaryColor] = useState<string>(team?.primaryColor || '#15803d');
  const [secondaryColor, setSecondaryColor] = useState<string>(team?.secondaryColor || '#ffffff');

  // Tournament form state
  const [showAddTournament, setShowAddTournament] = useState<boolean>(false);
  const [newTournamentName, setNewTournamentName] = useState<string>('');
  const [newTournamentYear, setNewTournamentYear] = useState<string>(new Date().getFullYear().toString());
  const [newTournamentDesc, setNewTournamentDesc] = useState<string>('');

  // Status & error handling
  const [isSavingTeam, setIsSavingTeam] = useState<boolean>(false);
  const [isSavingTourn, setIsSavingTourn] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [tournError, setTournError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setTeamError('Solo los usuarios en Modo Administrador pueden modificar los datos del equipo.');
      return;
    }
    setTeamError(null);
    setSuccessMessage(null);

    // Validation
    const trimmedName = teamName.trim();
    const trimmedCategory = category.trim();
    const trimmedPassword = adminPassword.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setTeamError('El nombre del equipo es obligatorio y debe tener al menos 2 caracteres.');
      return;
    }
    if (!trimmedCategory) {
      setTeamError('La categoría del equipo es obligatoria.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      setTeamError('La clave de administrador/DT es obligatoria y debe tener mínimo 4 caracteres.');
      return;
    }

    setIsSavingTeam(true);
    try {
      const updatedTeam: Team = {
        id: team?.id || getActiveTeamId(),
        name: trimmedName,
        category: trimmedCategory,
        slogan: slogan.trim() || 'LA PERLA VERDE DE ANTIOQUIA',
        logoUrl: team?.logoUrl || '/team_logo.jpg',
        adminPassword: trimmedPassword,
        primaryColor,
        secondaryColor,
        createdAt: team?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTeam(updatedTeam);
      unlockAdminMode(trimmedPassword);
      setSuccessMessage('¡Información del equipo guardada con éxito y Modo Administrador activado!');
      if (onClose && isInitialSetup) {
        setTimeout(() => onClose(), 600);
      }
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Error al guardar el equipo.');
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    setTournError(null);

    const trimmedName = newTournamentName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setTournError('El nombre del torneo es obligatorio.');
      return;
    }

    if (!team) {
      setTournError('Primero debes guardar el equipo.');
      return;
    }

    setIsSavingTourn(true);
    try {
      const newTournament: Tournament = {
        id: generateUUID(),
        teamId: team.id,
        name: trimmedName,
        year: newTournamentYear.trim() || '',
        description: newTournamentDesc.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveTournament(newTournament);
      setNewTournamentName('');
      setNewTournamentDesc('');
      setShowAddTournament(false);
      setSuccessMessage('¡Torneo agregado al catálogo!');
    } catch (err) {
      setTournError(err instanceof Error ? err.message : 'Error al guardar el torneo.');
    } finally {
      setIsSavingTourn(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/10 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {isInitialSetup ? 'Configuración Inicial del Equipo' : 'Equipo y Catálogo de Torneos'}
            </h2>
            <p className="text-xs text-emerald-100">
              Datos generales del club y torneos oficiales para convocatorias
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Messages */}
        {teamError && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm flex items-start gap-2.5 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Error al guardar:</p>
              <p>{teamError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm flex items-center gap-2 border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Section 1: Team details */}
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            Datos del Equipo
          </h3>

          {/* Official Logo Banner */}
          <div className="flex items-center gap-4 p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 mb-5 shadow-2xs">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-sm border border-emerald-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={team?.logoUrl || '/team_logo.jpg'}
                alt="Escudo Oficial Colonia de San Luis"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-300/60">
                Escudo Oficial Fijo
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                COLONIA DE SAN LUIS
              </h4>
              <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                LA PERLA VERDE DE ANTIOQUIA
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveTeam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del Equipo *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Ej. Club San Luis"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Categoría *
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Ej. Libre, Veteranos, Sub-20, Femenino"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Eslogan del Equipo
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  placeholder="Ej. LA PERLA BONITA DE ANTIOQUIA"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>
            </div>

            {/* Admin Password Field */}
            {canEdit && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Clave de Administrador / DT *</span>
                </label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres (ej. admin o clave propia)"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition font-mono"
                  required
                  minLength={4}
                  disabled={!canEdit}
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Esta clave permite desbloquear las acciones de edición en la aplicación.
                </p>
              </div>
            )}

            {!canEdit && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span>
                  Estás en <strong>Modo Jugador (solo lectura)</strong>. Para editar los datos del equipo o la clave, activa el Modo Administrador desde el candado en la barra superior.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Color Principal (Uniforme)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    disabled={!canEdit}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-600 font-mono">{primaryColor}</span>
                  <span className="text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    Verdolaga San Luis
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Color Secundario
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    disabled={!canEdit}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0.5 disabled:opacity-50"
                  />
                  <span className="text-xs text-gray-600 font-mono">{secondaryColor}</span>
                  <span className="text-xs text-gray-700 font-medium bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                    Blanco
                  </span>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingTeam}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingTeam ? 'Guardando...' : 'Guardar Datos del Equipo'}</span>
                </button>
              </div>
            )}
          </form>
        </div>

        <hr className="border-gray-200" />

        {/* Section 2: Tournament Catalog */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-emerald-600" />
                Catálogo de Torneos
              </h3>
              <p className="text-xs text-gray-500">
                Torneos registrados para seleccionar rápidamente al programar partidos
              </p>
            </div>

            {!showAddTournament && canEdit && (
              <button
                onClick={() => setShowAddTournament(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Torneo</span>
              </button>
            )}
          </div>

          {/* New Tournament Form */}
          {showAddTournament && (
            <form
              onSubmit={handleCreateTournament}
              className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 mb-5 space-y-3"
            >
              <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Registrar Nuevo Torneo
              </h4>

              {tournError && (
                <div className="p-2.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium">
                  {tournError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del Torneo *
                  </label>
                  <input
                    type="text"
                    value={newTournamentName}
                    onChange={(e) => setNewTournamentName(e.target.value)}
                    placeholder="Ej. Copa Navideña San Luis 2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Año
                  </label>
                  <input
                    type="text"
                    value={newTournamentYear}
                    onChange={(e) => setNewTournamentYear(e.target.value)}
                    placeholder="2026"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descripción u observaciones (opcional)
                </label>
                <input
                  type="text"
                  value={newTournamentDesc}
                  onChange={(e) => setNewTournamentDesc(e.target.value)}
                  placeholder="Ej. Partidos los domingos en la cancha sintética"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTournament(false)}
                  className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTourn}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  {isSavingTourn ? 'Guardando...' : 'Guardar Torneo'}
                </button>
              </div>
            </form>
          )}

          {/* Tournament List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tournaments.length === 0 ? (
              <div className="sm:col-span-2 text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No hay torneos registrados todavía. Crea uno para asociar a los partidos.
              </div>
            ) : (
              tournaments.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-gray-200 bg-white hover:border-emerald-300 transition flex items-start justify-between shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-sm">{t.name}</span>
                    </div>
                    {t.year && (
                      <span className="inline-block text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">
                        Año {t.year}
                      </span>
                    )}
                    {t.description && (
                      <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
