import React, { useState, useEffect } from 'react';
import type { Team, Tournament } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import {
  saveTeam,
  createTeam,
  deleteTeam,
  setActiveTeamId,
  getActiveTeamId,
  getLocalTeams,
  saveTournament,
  deleteTournament,
  generateUUID,
  DEFAULT_TEAM_ID,
} from '../services/dataService';
import {
  Shield,
  Trophy,
  Plus,
  Save,
  AlertCircle,
  Check,
  Lock,
  Key,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  Users,
  CheckCircle2,
  Palette,
} from 'lucide-react';

interface TeamTournamentModalProps {
  team: Team | null;
  teams?: Team[];
  tournaments: Tournament[];
  onClose?: () => void;
  onSelectTeam?: (teamId: string) => void;
  isInitialSetup?: boolean;
}

export const TeamTournamentModal: React.FC<TeamTournamentModalProps> = ({
  team,
  teams = [],
  tournaments,
  onClose,
  onSelectTeam,
  isInitialSetup = false,
}) => {
  const { isAdminMode, unlockAdminMode } = useAccessMode();
  // Anyone in player mode can see all teams and tournaments, but CANNOT edit anything
  const canEdit = isAdminMode || isInitialSetup;

  // Internal sub-tab: 'teams' (Gestión de Equipos) or 'tournaments' (Catálogo de Torneos)
  const [activeSubTab, setActiveSubTab] = useState<'teams' | 'tournaments'>('teams');

  // List of teams (uses prop or local fallback)
  const [teamsList, setTeamsList] = useState<Team[]>(() => {
    if (teams && teams.length > 0) return teams;
    return getLocalTeams();
  });

  useEffect(() => {
    if (teams && teams.length > 0) {
      setTeamsList(teams);
    } else {
      setTeamsList(getLocalTeams());
    }
  }, [teams]);

  // Listen to Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Active Team ID
  const activeTeamId = team?.id || getActiveTeamId();

  // Strictly filter tournaments per active team
  const currentTeamTournaments = tournaments.filter(
    (t) => (t.teamId || DEFAULT_TEAM_ID) === activeTeamId
  );

  // In-modal quick unlock for DT
  const [showAdminUnlockInput, setShowAdminUnlockInput] = useState<boolean>(false);
  const [adminUnlockPwd, setAdminUnlockPwd] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const handleQuickUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    const success = unlockAdminMode(adminUnlockPwd);
    if (success) {
      setSuccessMessage('¡Modo Administrador activado con éxito! Ahora puedes editar.');
      setShowAdminUnlockInput(false);
      setAdminUnlockPwd('');
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      setUnlockError('Clave incorrecta. Verifica la clave de administrador.');
    }
  };

  // Team Form States (for creating or editing)
  const [showTeamForm, setShowTeamForm] = useState<boolean>(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>(team?.name || 'Club San Luis');
  const [category, setCategory] = useState<string>(team?.category || 'Categoría Libre');
  const [slogan, setSlogan] = useState<string>(team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA');
  const [adminPassword, setAdminPassword] = useState<string>(team?.adminPassword || 'admin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [primaryColor, setPrimaryColor] = useState<string>(team?.primaryColor || '#15803d');
  const [secondaryColor, setSecondaryColor] = useState<string>(team?.secondaryColor || '#ffffff');
  const [logoUrl, setLogoUrl] = useState<string>(team?.logoUrl || '/team_logo.png');

  // Tournament Form States
  const [showAddTournament, setShowAddTournament] = useState<boolean>(false);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [newTournamentName, setNewTournamentName] = useState<string>('');
  const [newTournamentYear, setNewTournamentYear] = useState<string>(new Date().getFullYear().toString());
  const [newTournamentDesc, setNewTournamentDesc] = useState<string>('');

  // In-app deletion confirmations (replaces window.confirm)
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

  // Status & error handling
  const [isSavingTeam, setIsSavingTeam] = useState<boolean>(false);
  const [isSavingTourn, setIsSavingTourn] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [tournError, setTournError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Color Presets
  const colorPresets = [
    { name: 'Verde San Luis', primary: '#15803d', secondary: '#ffffff' },
    { name: 'Azul Real', primary: '#1d4ed8', secondary: '#ffffff' },
    { name: 'Rojo Pasión', primary: '#b91c1c', secondary: '#ffffff' },
    { name: 'Dorado y Negro', primary: '#111827', secondary: '#eab308' },
    { name: 'Vino Tinto', primary: '#831843', secondary: '#fef08a' },
    { name: 'Celeste', primary: '#0284c7', secondary: '#ffffff' },
  ];

  // Open Form to create new team
  const handleOpenCreateTeam = () => {
    if (!canEdit) return;
    setEditingTeamId(null);
    setTeamName('');
    setCategory('Categoría Libre');
    setSlogan('FUERZA Y PASIÓN');
    setAdminPassword('admin');
    setPrimaryColor('#15803d');
    setSecondaryColor('#ffffff');
    setLogoUrl('/team_logo.png');
    setShowTeamForm(true);
    setTeamError(null);
  };

  // Open Form to edit an existing team
  const handleStartEditTeam = (targetTeam: Team) => {
    if (!canEdit) return;
    setEditingTeamId(targetTeam.id);
    setTeamName(targetTeam.name);
    setCategory(targetTeam.category || 'Categoría Libre');
    setSlogan(targetTeam.slogan || '');
    setAdminPassword(targetTeam.adminPassword || 'admin');
    setPrimaryColor(targetTeam.primaryColor || '#15803d');
    setSecondaryColor(targetTeam.secondaryColor || '#ffffff');
    setLogoUrl(targetTeam.logoUrl || '/team_logo.png');
    setShowTeamForm(true);
    setTeamError(null);
  };

  const handleCancelTeamForm = () => {
    setShowTeamForm(false);
    setEditingTeamId(null);
    setTeamError(null);
  };

  // Switch Active Team (Permitted in Player Mode!)
  const handleSwitchActiveTeam = (targetId: string, name: string) => {
    setActiveTeamId(targetId);
    onSelectTeam?.(targetId);
    setSuccessMessage(`¡Equipo cambiado a "${name}"!`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Save or Create Team
  const handleSaveTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setTeamError('Solo los usuarios en Modo Administrador pueden modificar o crear equipos.');
      return;
    }
    setTeamError(null);
    setSuccessMessage(null);

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
      if (editingTeamId) {
        // Editing existing team
        const targetExisting = teamsList.find((t) => t.id === editingTeamId);
        const updatedTeam: Team = {
          id: editingTeamId,
          name: trimmedName,
          category: trimmedCategory,
          slogan: slogan.trim() || 'LA PERLA VERDE DE ANTIOQUIA',
          logoUrl: (!logoUrl || logoUrl.endsWith('.jpg')) ? '/team_logo.png' : logoUrl,
          adminPassword: trimmedPassword,
          primaryColor,
          secondaryColor,
          createdAt: targetExisting?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveTeam(updatedTeam);
        setSuccessMessage(`¡Equipo "${trimmedName}" actualizado con éxito!`);
      } else {
        // Creating brand new team
        const created = await createTeam({
          name: trimmedName,
          category: trimmedCategory,
          slogan: slogan.trim() || 'LA PERLA VERDE DE ANTIOQUIA',
          logoUrl: (!logoUrl || logoUrl.endsWith('.jpg')) ? '/team_logo.png' : logoUrl,
          adminPassword: trimmedPassword,
          primaryColor,
          secondaryColor,
        });

        onSelectTeam?.(created.id);
        setSuccessMessage(`¡Equipo "${trimmedName}" creado y activado con éxito!`);
      }

      unlockAdminMode(trimmedPassword);
      setShowTeamForm(false);
      setEditingTeamId(null);
      setTeamsList(getLocalTeams());

      if (onClose && isInitialSetup) {
        setTimeout(() => onClose(), 800);
      }
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Error al guardar el equipo.');
    } finally {
      setIsSavingTeam(false);
    }
  };

  // Delete Team Execution (in-app, no window.confirm)
  const handleExecuteDeleteTeam = async (targetTeam: Team) => {
    if (!canEdit) {
      setTeamError('Solo los usuarios en Modo Administrador pueden eliminar equipos.');
      setDeletingTeam(null);
      return;
    }

    try {
      await deleteTeam(targetTeam.id);
      setDeletingTeam(null);
      setTeamsList(getLocalTeams());
      setSuccessMessage(`Equipo "${targetTeam.name}" eliminado correctamente.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : 'Error al eliminar el equipo.');
      setDeletingTeam(null);
    }
  };

  // Tournament handling
  const handleStartEditTournament = (t: Tournament) => {
    if (!canEdit) return;
    setEditingTournamentId(t.id);
    setNewTournamentName(t.name);
    setNewTournamentYear(t.year || '');
    setNewTournamentDesc(t.description || '');
    setShowAddTournament(true);
    setTournError(null);
  };

  const handleCancelTournamentForm = () => {
    setEditingTournamentId(null);
    setNewTournamentName('');
    setNewTournamentYear(new Date().getFullYear().toString());
    setNewTournamentDesc('');
    setShowAddTournament(false);
    setTournError(null);
  };

  // Delete Tournament Execution (in-app, no window.confirm)
  const handleExecuteDeleteTournament = async (t: Tournament) => {
    if (!canEdit) {
      setTournError('Solo los usuarios en Modo Administrador pueden eliminar torneos.');
      setDeletingTournament(null);
      return;
    }

    try {
      await deleteTournament(t.id);
      if (editingTournamentId === t.id) {
        handleCancelTournamentForm();
      }
      setDeletingTournament(null);
      setSuccessMessage(`¡Torneo "${t.name}" eliminado del catálogo!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setTournError(err instanceof Error ? err.message : 'Error al eliminar el torneo.');
      setDeletingTournament(null);
    }
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setTournError('Solo los administradores pueden registrar torneos.');
      return;
    }
    setTournError(null);

    const trimmedName = newTournamentName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setTournError('El nombre del torneo es obligatorio.');
      return;
    }

    setIsSavingTourn(true);
    try {
      if (editingTournamentId) {
        const existing = tournaments.find((t) => t.id === editingTournamentId);
        const updatedTournament: Tournament = {
          id: editingTournamentId,
          teamId: existing?.teamId || activeTeamId,
          name: trimmedName,
          year: newTournamentYear.trim() || '',
          description: newTournamentDesc.trim() || '',
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveTournament(updatedTournament);
        setSuccessMessage(`¡Torneo "${trimmedName}" actualizado con éxito!`);
      } else {
        const newTournament: Tournament = {
          id: generateUUID(),
          teamId: activeTeamId,
          name: trimmedName,
          year: newTournamentYear.trim() || '',
          description: newTournamentDesc.trim() || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveTournament(newTournament);
        setSuccessMessage(`¡Torneo "${trimmedName}" agregado al catálogo de este equipo!`);
      }

      handleCancelTournamentForm();
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err) {
      setTournError(err instanceof Error ? err.message : 'Error al guardar el torneo.');
    } finally {
      setIsSavingTourn(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-4xl mx-auto flex flex-col max-h-[92vh]">
      {/* 1. Header with prominent BACK / RETURN button and CLOSE button */}
      <div className="bg-gradient-to-r from-emerald-850 via-emerald-800 to-teal-900 text-white p-4 sm:p-5 flex-shrink-0 shadow-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Primary Back Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all border border-white/20 cursor-pointer shadow-xs"
                title="Regresar a la pantalla anterior"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar</span>
              </button>
            )}

            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl border border-white/15 hidden sm:flex">
                <Shield className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black leading-tight flex items-center gap-2">
                  <span>{isInitialSetup ? 'Configuración Inicial' : 'Equipos y Torneos del Club'}</span>
                </h2>
                <p className="text-[11px] sm:text-xs text-emerald-200 font-medium">
                  Alterna fácilmente entre equipos. Los torneos están discriminados por cada equipo.
                </p>
              </div>
            </div>
          </div>

          {/* Close X Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition cursor-pointer flex-shrink-0"
              title="Cerrar ventana y regresar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Tabs between Equipos and Torneos */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-emerald-700/60">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('teams');
              setTeamError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeSubTab === 'teams'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mis Equipos ({teamsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('tournaments');
              setTournError(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeSubTab === 'tournaments'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Torneos de {team?.name?.split(' ')[0] || 'Equipo'} ({currentTeamTournaments.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Scrollable Modal Content */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
        {/* Informative Banner for Player Mode (Read Only) */}
        {!isAdminMode && (
          <div className="p-3 sm:p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-blue-100 rounded-lg text-blue-700 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-blue-900">Modo Jugador (Consulta Libre):</p>
                <p className="text-blue-800">
                  Puedes ver todos los equipos del club y cambiar entre ellos con 1 toque para ver sus torneos y convocatorias. Las opciones de edición están protegidas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdminUnlockInput(!showAdminUnlockInput)}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 border border-blue-300 px-3 py-1.5 rounded-xl transition cursor-pointer self-start sm:self-auto whitespace-nowrap shadow-2xs"
            >
              {showAdminUnlockInput ? 'Ocultar' : 'Desbloquear Clave DT'}
            </button>
          </div>
        )}

        {/* Quick Admin Unlock Input inside modal */}
        {showAdminUnlockInput && !isAdminMode && (
          <form
            onSubmit={handleQuickUnlock}
            className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-300 flex flex-wrap items-center gap-2.5 animate-fade-in"
          >
            <Key className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-950">Clave de DT/Administrador:</span>
            <input
              type="password"
              value={adminUnlockPwd}
              onChange={(e) => setAdminUnlockPwd(e.target.value)}
              placeholder="Ingresa clave"
              className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white focus:border-emerald-500 outline-hidden font-mono"
              required
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
            >
              Desbloquear Edición
            </button>
            {unlockError && <span className="text-xs text-red-600 font-bold">{unlockError}</span>}
          </form>
        )}

        {/* Messages */}
        {teamError && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Atención:</p>
              <p>{teamError}</p>
            </div>
          </div>
        )}

        {tournError && (
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold">Atención con torneos:</p>
              <p>{tournError}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs sm:text-sm flex items-center gap-2 border border-emerald-200 animate-fade-in font-medium">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* SUBTAB 1: GESTIÓN DE EQUIPOS (MULTI-EQUIPO)           */}
        {/* ==================================================== */}
        {activeSubTab === 'teams' && (
          <div className="space-y-6">
            {/* Header of Teams section */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-700" />
                  <span>Equipos Registrados ({teamsList.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Toca "Activar" para cambiar a cualquier equipo y ver sus partidos y convocatorias
                </p>
              </div>

              {!showTeamForm && canEdit && (
                <button
                  type="button"
                  onClick={handleOpenCreateTeam}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nuevo Equipo</span>
                </button>
              )}
            </div>

            {/* List of Registered Teams Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {teamsList.map((t) => {
                const isActive = t.id === activeTeamId;
                const isBeingDeleted = deletingTeam?.id === t.id;

                return (
                  <div
                    key={t.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 border-emerald-500 ring-2 ring-emerald-300 shadow-sm'
                        : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Top row: Crest & Badges */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 p-1 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-2xs">
                            <img
                              src={(!t.logoUrl || t.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : t.logoUrl}
                              alt={t.name}
                              className="w-full h-full object-contain filter drop-shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/team_logo.png';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm sm:text-base text-gray-900 truncate">
                              {t.name}
                            </h4>
                            <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                              {t.category || 'Categoría Libre'}
                            </span>
                          </div>
                        </div>

                        {/* Active Badge or 1-tap Switch Button */}
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs flex-shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitchActiveTeam(t.id, t.name)}
                            className="text-xs font-extrabold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 px-3 py-1 rounded-xl transition cursor-pointer flex-shrink-0 shadow-2xs active:scale-95"
                            title="Seleccionar este equipo para convocar y jugar"
                          >
                            Activar
                          </button>
                        )}
                      </div>

                      {/* Slogan & Colors */}
                      {t.slogan && (
                        <p className="text-[11px] text-gray-500 font-medium italic mb-2 line-clamp-1">
                          "{t.slogan}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] text-gray-400 font-medium">Uniforme:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs"
                            style={{ backgroundColor: t.primaryColor || '#15803d' }}
                            title={`Color principal: ${t.primaryColor}`}
                          />
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs"
                            style={{ backgroundColor: t.secondaryColor || '#ffffff' }}
                            title={`Color secundario: ${t.secondaryColor}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Inline Delete Confirmation Banner */}
                    {isBeingDeleted ? (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fade-in">
                        <p className="text-xs font-bold text-red-900 leading-tight">
                          ¿Confirmas eliminar el equipo "{t.name}"?
                        </p>
                        <p className="text-[11px] text-red-700">
                          Esta acción removerá este equipo del catálogo.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleExecuteDeleteTeam(t)}
                            className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                          >
                            Sí, eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingTeam(null)}
                            className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Action Buttons */
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => handleSwitchActiveTeam(t.id, t.name)}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                          >
                            <span>Cambiar a este equipo</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Seleccionado actualmente</span>
                          </span>
                        )}

                        {/* Edit and Delete: ONLY visible in Admin Mode */}
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditTeam(t)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                              title={`Editar equipo ${t.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {teamsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDeletingTeam(t)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title={`Eliminar equipo ${t.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Team Create / Edit Form (Admin Only) */}
            {showTeamForm && canEdit && (
              <form
                onSubmit={handleSaveTeam}
                className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-300 space-y-4 shadow-sm animate-fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <h4 className="text-sm font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>{editingTeamId ? 'Editar Datos del Equipo' : 'Registrar Nuevo Equipo'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCancelTeamForm}
                    className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre del Equipo *
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Ej. Colonia San Luis Veteranos"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Ej. Veteranos +35, Libre, Sub-20, Femenino"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Lema o Eslogan
                    </label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      placeholder="Ej. LA PERLA VERDE DE ANTIOQUIA"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Clave de Administrador / DT *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-10 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition font-mono"
                        required
                        minLength={4}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Colors & Presets */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Colores del Uniforme</span>
                  </label>

                  {/* Preset Buttons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setPrimaryColor(preset.primary);
                          setSecondaryColor(preset.secondary);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-[11px] font-medium text-gray-700 hover:border-emerald-400 cursor-pointer transition shadow-2xs"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-gray-300"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <span>{preset.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      />
                      <div>
                        <span className="block text-[11px] font-semibold text-gray-600">Color Principal</span>
                        <span className="text-xs text-gray-800 font-mono font-bold">{primaryColor}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5"
                      />
                      <div>
                        <span className="block text-[11px] font-semibold text-gray-600">Color Secundario</span>
                        <span className="text-xs text-gray-800 font-mono font-bold">{secondaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelTeamForm}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTeam}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {isSavingTeam
                        ? 'Guardando...'
                        : editingTeamId
                        ? 'Guardar Cambios'
                        : 'Crear y Activar Equipo'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* SUBTAB 2: CATÁLOGO DE TORNEOS (DISCRIMINADO POR EQUIPO) */}
        {/* ==================================================== */}
        {activeSubTab === 'tournaments' && (
          <div className="space-y-5">
            {/* Team Filter Banner for Tournaments */}
            <div className="bg-emerald-50/80 p-3 sm:p-3.5 rounded-2xl border border-emerald-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-white p-1 border border-emerald-300 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src={(!team?.logoUrl || team.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : team.logoUrl}
                    alt=""
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/team_logo.png';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                    Torneos exclusivos del equipo:
                  </span>
                  <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                    {team?.name || 'Equipo Activo'} <span className="text-emerald-700 font-semibold">({team?.category || 'Libre'})</span>
                  </p>
                </div>
              </div>

              {teamsList.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500 font-bold whitespace-nowrap">Ver torneos de:</span>
                  <select
                    value={activeTeamId}
                    onChange={(e) => {
                      const selected = teamsList.find((t) => t.id === e.target.value);
                      if (selected) {
                        handleSwitchActiveTeam(selected.id, selected.name);
                      }
                    }}
                    className="bg-white border border-emerald-300 text-emerald-950 font-bold text-xs rounded-xl px-2.5 py-1.5 cursor-pointer shadow-2xs focus:ring-1 focus:ring-emerald-400 outline-hidden"
                  >
                    {teamsList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.category || 'Libre'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-emerald-700" />
                  <span>Torneos Registrados ({currentTeamTournaments.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Torneos oficiales asignados para programar partidos de este equipo
                </p>
              </div>

              {!showAddTournament && canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    handleCancelTournamentForm();
                    setShowAddTournament(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Torneo</span>
                </button>
              )}
            </div>

            {/* Tournament Form (Add / Edit) - Admin Only */}
            {showAddTournament && canEdit && (
              <form
                onSubmit={handleCreateTournament}
                className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-300 space-y-3 shadow-xs animate-fade-in"
              >
                <div className="flex items-center justify-between pb-1 border-b border-emerald-200">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-emerald-700" />
                    <span>{editingTournamentId ? 'Editar Torneo' : `Registrar Torneo para ${team?.name || 'Equipo'}`}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleCancelTournamentForm}
                    className="text-xs text-gray-500 hover:text-gray-800 cursor-pointer font-medium"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Nombre del Torneo *
                    </label>
                    <input
                      type="text"
                      value={newTournamentName}
                      onChange={(e) => setNewTournamentName(e.target.value)}
                      placeholder="Ej. Torneo Municipal San Luis 2026"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Año
                    </label>
                    <input
                      type="text"
                      value={newTournamentYear}
                      onChange={(e) => setNewTournamentYear(e.target.value)}
                      placeholder="2026"
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Descripción u observaciones (opcional)
                  </label>
                  <input
                    type="text"
                    value={newTournamentDesc}
                    onChange={(e) => setNewTournamentDesc(e.target.value)}
                    placeholder="Ej. Cancha sintética, partidos nocturnos"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelTournamentForm}
                    className="rounded-xl px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingTourn}
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {isSavingTourn
                      ? 'Guardando...'
                      : editingTournamentId
                      ? 'Guardar Cambios'
                      : 'Guardar Torneo'}
                  </button>
                </div>
              </form>
            )}

            {/* Strictly Discriminated Tournament List per team */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentTeamTournaments.length === 0 ? (
                <div className="sm:col-span-2 text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-4">
                  <Trophy className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="font-semibold text-gray-600">
                    No hay torneos registrados para "{team?.name || 'este equipo'}" todavía.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Cada equipo administra su propio catálogo exclusivo de torneos.
                  </p>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCancelTournamentForm();
                        setShowAddTournament(true);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear torneo para {team?.name || 'este equipo'}</span>
                    </button>
                  )}
                </div>
              ) : (
                currentTeamTournaments.map((t) => {
                  const isBeingDeleted = deletingTournament?.id === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs ${
                        editingTournamentId === t.id
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                          : 'border-gray-200 bg-white hover:border-emerald-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Trophy className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span className="font-extrabold text-gray-900 text-sm truncate">{t.name}</span>
                        </div>
                        {t.year && (
                          <span className="inline-block text-[11px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md mb-1">
                            Año {t.year}
                          </span>
                        )}
                        {t.description && (
                          <p className="text-xs text-gray-500 line-clamp-2">{t.description}</p>
                        )}
                      </div>

                      {/* Inline Delete Confirmation or Action Buttons */}
                      {isBeingDeleted ? (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-fade-in">
                          <p className="text-xs font-bold text-red-900 leading-tight">
                            ¿Eliminar el torneo "{t.name}"?
                          </p>
                          <p className="text-[11px] text-red-700">
                            Esta acción quitará el torneo del catálogo de este equipo.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleExecuteDeleteTournament(t)}
                              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              Sí, eliminar torneo
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTournament(null)}
                              className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100 mt-2">
                          {/* Edit & Delete ONLY visible for Admin */}
                          {canEdit ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleStartEditTournament(t)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer"
                                title={`Editar torneo ${t.name}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingTournament(t)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title={`Eliminar torneo ${t.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-medium">Solo lectura</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Footer Bar with BACK / RETURN button */}
      <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex-shrink-0 flex items-center justify-between">
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-bold transition cursor-pointer shadow-2xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Regresar a la página anterior</span>
          </button>
        ) : (
          <div />
        )}

        <div className="text-[11px] text-gray-500 font-medium">
          Equipo activo: <span className="font-bold text-gray-800">{team?.name || 'San Luis'}</span>
        </div>
      </div>
    </div>
  );
};
