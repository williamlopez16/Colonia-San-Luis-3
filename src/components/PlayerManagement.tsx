import React, { useState, useMemo } from 'react';
import type { Player, PlayerStatus, Team, Charge } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { savePlayer, deletePlayer, generateUUID } from '../services/dataService';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Phone,
  ShieldAlert,
  CheckCircle,
  AlertCircle,
  X,
  HeartPulse,
  DollarSign,
  Plus,
} from 'lucide-react';

interface PlayerManagementProps {
  team: Team | null;
  players: Player[];
  charges: Charge[];
  onOpenPlayerFinance: (player: Player) => void;
  onAddChargeForPlayer: (player: Player) => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({
  team,
  players,
  charges,
  onOpenPlayerFinance,
  onAddChargeForPlayer,
}) => {
  const { isAdminMode } = useAccessMode();

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | PlayerStatus>('Todos');

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form fields
  const [fullName, setFullName] = useState<string>('');
  const [jerseyNumber, setJerseyNumber] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [idCard, setIdCard] = useState<string>('');
  const [eps, setEps] = useState<string>('');
  const [status, setStatus] = useState<PlayerStatus>('Activo');
  const [isScholarship, setIsScholarship] = useState<boolean>(false);

  // UI feedback
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFullName('');
    setJerseyNumber('');
    setPhone('');
    setIdCard('');
    setEps('');
    setStatus('Activo');
    setIsScholarship(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setFullName(player.fullName);
    setJerseyNumber(String(player.jerseyNumber));
    setPhone(player.phone);
    setIdCard(player.idCard || '');
    setEps(player.eps || '');
    setStatus(player.status);
    setIsScholarship(!!player.isScholarship);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!team) {
      setFormError('Primero debes configurar y guardar el equipo.');
      return;
    }

    const trimmedName = fullName.trim();
    const numDorsal = parseInt(jerseyNumber, 10);
    const trimmedPhone = phone.trim();

    // Client-side validations
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('El nombre completo es requerido (mínimo 2 letras).');
      return;
    }
    if (isNaN(numDorsal) || numDorsal < 0 || numDorsal > 999) {
      setFormError('El número de dorsal debe ser un número entero válido (entre 0 y 999).');
      return;
    }
    if (!trimmedPhone || trimmedPhone.length < 7) {
      setFormError('El teléfono/WhatsApp es requerido (mínimo 7 dígitos).');
      return;
    }

    // Validate duplicate active dorsal inside the same team
    if (status === 'Activo') {
      const duplicate = players.find(
        (p) =>
          p.id !== editingPlayer?.id &&
          p.status === 'Activo' &&
          p.jerseyNumber === numDorsal
      );
      if (duplicate) {
        setFormError(
          `El dorsal #${numDorsal} ya está asignado al jugador activo "${duplicate.fullName}". No se pueden duplicar dorsales activos.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const playerToSave: Player = {
        id: editingPlayer?.id || generateUUID(),
        teamId: team.id,
        fullName: trimmedName,
        jerseyNumber: numDorsal,
        phone: trimmedPhone,
        idCard: idCard.trim() || '',
        eps: eps.trim() || '',
        status,
        isScholarship,
        createdAt: editingPlayer?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await savePlayer(playerToSave);
      closeModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar el jugador.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      await deletePlayer(id);
      setDeleteConfirmId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar jugador');
    }
  };

  // Filtered and searched players
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const matchesSearch =
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(p.jerseyNumber).includes(searchQuery.trim());
      const matchesStatus = statusFilter === 'Todos' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [players, searchQuery, statusFilter]);

  const activeCount = players.filter((p) => p.status === 'Activo').length;
  const injuredCount = players.filter((p) => p.status === 'Lesionado').length;
  const inactiveCount = players.filter((p) => p.status === 'Inactivo').length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Quick Stats */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Plantilla de Jugadores</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gestiona la plantilla, dorsales únicos y números de contacto para convocatorias
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold border border-emerald-200">
              {activeCount} Activos
            </span>
            <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg font-semibold border border-amber-200">
              {injuredCount} Lesionados
            </span>
            <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg font-semibold">
              {inactiveCount} Inactivos
            </span>
          </div>

          {isAdminMode && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar Jugador</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o número de dorsal..."
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto bg-gray-100 p-1 rounded-xl text-xs font-medium">
          {(['Todos', 'Activo', 'Lesionado', 'Inactivo'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap cursor-pointer ${
                statusFilter === filter
                  ? 'bg-white text-emerald-800 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Players List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 p-6">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-600 font-medium text-sm">No se encontraron jugadores</p>
            <p className="text-xs text-gray-400 mt-1">
              Prueba con otro término de búsqueda o agrega un nuevo jugador al equipo.
            </p>
          </div>
        ) : (
          filteredPlayers.map((player) => {
            const playerCharges = charges.filter((c) => c.playerId === player.id);
            const pendingAmount = playerCharges
              .filter((c) => c.status === 'Pendiente')
              .reduce((sum, c) => sum + (c.amount || 0), 0);

            const formatAmount = (val: number) =>
              new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
                maximumFractionDigits: 0,
              }).format(val);

            return (
              <div
                key={player.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-3">
                      {/* Circular Jersey Badge */}
                      <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-black text-base flex items-center justify-center shadow-xs flex-shrink-0 border-2 border-emerald-900">
                        {player.jerseyNumber}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-sm leading-tight">
                          {player.fullName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              player.status === 'Activo'
                                ? 'bg-emerald-100 text-emerald-800'
                                : player.status === 'Lesionado'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {player.status}
                          </span>
                          {player.eps && (
                            <span className="text-[10px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                              {player.eps}
                            </span>
                          )}
                          {player.isScholarship && (
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-200">
                              🎓 Becado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Status Pill */}
                    <button
                      onClick={() => onOpenPlayerFinance(player)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        pendingAmount > 0
                          ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title="Ver estado de cuenta y cobros"
                    >
                      <DollarSign className="w-3 h-3 text-emerald-600" />
                      <span>{pendingAmount > 0 ? `Debe ${formatAmount(pendingAmount)}` : 'Al día ✓'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp: {player.phone}</span>
                    </div>
                    {player.idCard && (
                      <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                        <span>Cédula: {player.idCard}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                  <a
                    href={`https://wa.me/57${player.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" /> Escribir
                  </a>

                  <div className="flex items-center gap-1">
                    {/* Botón Ver Finanzas (visible para todos) */}
                    <button
                      onClick={() => onOpenPlayerFinance(player)}
                      className="p-1.5 text-gray-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                      title="Ver ficha de cobros y pagos del jugador"
                    >
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </button>

                    {/* Acciones exclusivas de Modo Administrador */}
                    {isAdminMode && (
                      <>
                        {/* Botón + Cobro */}
                        <button
                          onClick={() => onAddChargeForPlayer(player)}
                          className="p-1.5 text-gray-500 hover:text-emerald-800 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                          title="Agregar cobro individual a este jugador"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* Botón Editar */}
                        <button
                          onClick={() => openEditModal(player)}
                          className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                          title="Editar jugador"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar */}
                        {deleteConfirmId === player.id ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg">
                            <button
                              onClick={() => handleDeletePlayer(player.id)}
                              className="text-[11px] font-bold text-red-700 px-1.5 py-0.5 hover:underline cursor-pointer"
                            >
                              ¿Eliminar?
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(player.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                            title="Eliminar jugador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create / Edit Player */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-8">
            <div className="bg-emerald-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-base">
                  {editingPlayer ? 'Editar Jugador' : 'Agregar Nuevo Jugador'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-emerald-200 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-start gap-2 border border-red-200">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                  <p>{formError}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Carlos Henao"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Dorsal # *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    placeholder="10"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-bold text-center focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Teléfono / WhatsApp * (requerido para verificación de confirmación)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 3001234567"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-0.5">
                  El jugador verificará su asistencia con los últimos 2 dígitos de este teléfono.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cédula (opcional)
                  </label>
                  <input
                    type="text"
                    value={idCard}
                    onChange={(e) => setIdCard(e.target.value)}
                    placeholder="C.C. número"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    EPS (opcional)
                  </label>
                  <input
                    type="text"
                    value={eps}
                    onChange={(e) => setEps(e.target.value)}
                    placeholder="Ej. Sura, Nueva EPS"
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Estado del Jugador *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Activo', 'Lesionado', 'Inactivo'] as PlayerStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatus(st)}
                      className={`py-2 text-xs font-semibold rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                        status === st
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {st === 'Activo' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                      {st === 'Lesionado' && <HeartPulse className="w-3.5 h-3.5 text-amber-600" />}
                      {st === 'Inactivo' && <ShieldAlert className="w-3.5 h-3.5 text-gray-400" />}
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Becado / Exento de cuotas */}
              <div className="p-3.5 rounded-2xl border border-purple-200 bg-purple-50/70 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    🎓 Jugador Becado / Exento
                  </span>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Exento de cuota fija de arbitraje en los partidos por defecto.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScholarship(!isScholarship)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isScholarship ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isScholarship ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingPlayer ? 'Guardar Cambios' : 'Registrar Jugador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
