import React, { useState, useEffect } from 'react';
import type { Match, Team, AttendanceStatus } from '../types';
import { subscribeToMatch, updatePlayerAttendance } from '../services/dataService';
import { formatMatchDate } from '../services/whatsappService';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  DollarSign,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  Lock,
  ArrowRight,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PublicConfirmViewProps {
  matchId: string;
  team: Team | null;
  onGoToAdmin?: () => void;
}

export const PublicConfirmView: React.FC<PublicConfirmViewProps> = ({
  matchId,
  team,
  onGoToAdmin,
}) => {
  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [phoneDigits, setPhoneDigits] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Rejection reason state
  const [showDeclineReason, setShowDeclineReason] = useState<boolean>(false);
  const [declineReason, setDeclineReason] = useState<string>('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Subscribe in real-time to this match
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToMatch(matchId, (loadedMatch) => {
      setMatch(loadedMatch);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-sm w-full space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">Cargando convocatoria...</h3>
          <p className="text-xs text-gray-500">Conectando en tiempo real con el servidor</p>
        </div>
      </div>
    );
  }

  // Handle invalid match
  if (!match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-200 text-center max-w-md w-full space-y-4">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Partido No Encontrado</h2>
            <p className="text-xs text-gray-600 mt-2">
              El enlace de confirmación es inválido o el partido ha sido eliminado por el administrador.
            </p>
          </div>
          {onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Ir al Panel Principal
            </button>
          )}
        </div>
      </div>
    );
  }

  const selectedPlayer = match.callups.find((c) => c.playerId === selectedPlayerId);

  // Check phone digits (last 2 digits)
  const handleVerifyPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    if (!selectedPlayer) {
      setVerificationError('Por favor selecciona tu nombre en la lista.');
      return;
    }

    const cleanPhone = selectedPlayer.phone.replace(/\D/g, '');
    const cleanInput = phoneDigits.replace(/\D/g, '');

    if (cleanInput.length !== 2) {
      setVerificationError('Debes ingresar exactamente los 2 últimos dígitos de tu teléfono registrado.');
      return;
    }

    const lastTwo = cleanPhone.slice(-2);
    if (cleanInput === lastTwo) {
      setIsVerified(true);
      setVerificationError(null);
    } else {
      setVerificationError(
        'Los 2 dígitos ingresados no coinciden con el teléfono registrado. Verifica con tu DT o revisa tu número.'
      );
    }
  };

  const handleConfirmAttendance = async (status: AttendanceStatus) => {
    if (!selectedPlayer) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await updatePlayerAttendance(
        match.id,
        selectedPlayer.playerId,
        status,
        status === 'No asiste' ? declineReason || 'No especificado' : undefined
      );

      setSubmitSuccess(
        status === 'Confirmado'
          ? '¡Excelente! Tu asistencia ha sido confirmada exitosamente. ¡A darlo todo en la cancha!'
          : 'Se ha registrado que no podrás asistir a este partido.'
      );
      setShowDeclineReason(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al registrar tu respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSelectedPlayerId('');
    setPhoneDigits('');
    setIsVerified(false);
    setVerificationError(null);
    setShowDeclineReason(false);
    setDeclineReason('');
    setSubmitSuccess(null);
    setSubmitError(null);
  };

  // Real-time counters
  const confirmedCount = match.callups.filter((c) => c.status === 'Confirmado').length;
  const declinedCount = match.callups.filter((c) => c.status === 'No asiste').length;
  const pendingCount = match.callups.filter((c) => c.status === 'Pendiente').length;

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-xl mx-auto space-y-5">
        {/* Match Header Card */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-900 text-white p-6 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-emerald-200">
              <Trophy className="w-3.5 h-3.5 text-emerald-300" />
              <span>{match.tournamentName || 'Torneo Oficial'}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {team?.name || 'Club San Luis'}
            </h1>
            <p className="text-emerald-200 font-bold text-sm">
              VS  <span className="text-white underline decoration-emerald-400">{match.rival}</span>
            </p>
          </div>

          {/* Details Row */}
          <div className="p-5 bg-gray-50/70 border-b border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Fecha</p>
                <p className="font-bold">{formatMatchDate(match.date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Hora</p>
                <p className="font-bold">{match.time || 'Por definir'}</p>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">Lugar</p>
                <p className="font-bold truncate">{match.location || 'Por definir'}</p>
              </div>
            </div>
          </div>

          {match.refereeFee && (
            <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Arbitraje por jugador:
              </span>
              <span className="font-extrabold text-sm text-emerald-700">{match.refereeFee}</span>
            </div>
          )}

          {/* Real-time counters banner */}
          <div className="p-4 grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <span className="block text-xs font-bold text-emerald-800">Confirmados</span>
              <span className="text-xl font-black text-emerald-700">{confirmedCount}</span>
            </div>
            <div className="bg-red-50 p-2 rounded-xl border border-red-200">
              <span className="block text-xs font-bold text-red-800">No Asisten</span>
              <span className="text-xl font-black text-red-700">{declinedCount}</span>
            </div>
            <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
              <span className="block text-xs font-bold text-amber-800">Pendientes</span>
              <span className="text-xl font-black text-amber-700">{pendingCount}</span>
            </div>
          </div>
        </div>

        {/* Closed callup notice */}
        {match.status === 'Cerrada' && (
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Convocatoria Cerrada</p>
              <p className="text-amber-800 mt-0.5">
                El administrador ha fijado la lista definitiva para este partido. Ya no se reciben cambios públicos.
              </p>
            </div>
          </div>
        )}

        {/* Player Confirmation Box */}
        {match.status === 'Abierta' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-5">
            <div className="text-center space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Confirmación de Asistencia
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                ¿Fuiste convocado a este partido?
              </h2>
              <p className="text-xs text-gray-500">
                Selecciona tu nombre y verifica con los 2 últimos dígitos de tu WhatsApp
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-emerald-900 text-base">¡Respuesta Registrada!</h3>
                <p className="text-xs text-emerald-800">{submitSuccess}</p>
                <button
                  onClick={handleResetForm}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Cambiar o confirmar otro jugador
                </button>
              </div>
            ) : !isVerified ? (
              /* Step 1: Select Name & Enter 2 Digits */
              <form onSubmit={handleVerifyPlayer} className="space-y-4">
                {verificationError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    1. Selecciona tu Nombre:
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-3 text-sm font-semibold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                    required
                  >
                    <option value="">-- Elige tu nombre de la lista --</option>
                    {match.callups.map((callup) => (
                      <option key={callup.playerId} value={callup.playerId}>
                        #{callup.jerseyNumber} - {callup.fullName} ({callup.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    2. Últimos 2 dígitos de tu teléfono / WhatsApp registrado:
                  </label>
                  <input
                    type="password"
                    maxLength={2}
                    value={phoneDigits}
                    onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, ''))}
                    placeholder="••"
                    className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-center text-xl font-black tracking-widest focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden"
                    required
                  />
                  <p className="text-[11px] text-gray-400 text-center mt-1">
                    Esto asegura que solo tú puedas confirmar o declinar tu propia asistencia.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Verificar Identidad</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Step 2: Confirmation Buttons ("Sí, confirmo" / "No puedo ir") */
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                      {selectedPlayer?.jerseyNumber}
                    </span>
                    <span className="font-bold">{selectedPlayer?.fullName}</span>
                  </div>
                  <button
                    onClick={handleResetForm}
                    className="text-emerald-700 hover:underline text-[11px] font-semibold cursor-pointer"
                  >
                    Cambiar
                  </button>
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
                    {submitError}
                  </div>
                )}

                {/* Big Action Buttons */}
                {!showDeclineReason ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleConfirmAttendance('Confirmado')}
                      disabled={isSubmitting}
                      className="py-4 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                      <span>¡SÍ, CONFIRMO ASISTENCIA!</span>
                      <span className="text-[11px] font-normal text-emerald-100">
                        Cuento con el arbitraje y uniforme
                      </span>
                    </button>

                    <button
                      onClick={() => setShowDeclineReason(true)}
                      disabled={isSubmitting}
                      className="py-4 px-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition flex flex-col items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-7 h-7" />
                      <span>NO PUEDO ASISTIR</span>
                      <span className="text-[11px] font-normal text-red-100">
                        Avisar al cuerpo técnico
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Form to specify simple reason */
                  <div className="space-y-3 bg-red-50/70 p-4 rounded-2xl border border-red-200">
                    <label className="block text-xs font-bold text-red-900">
                      Motivo por el cual no puedes asistir (opcional):
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {['Trabajo', 'Lesión', 'Familiar', 'Viaje', 'Estudio', 'Otro'].map((res) => (
                        <button
                          key={res}
                          type="button"
                          onClick={() => setDeclineReason(res)}
                          className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                            declineReason === res
                              ? 'bg-red-600 text-white border-red-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-red-100'
                          }`}
                        >
                          {res}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Escribe el motivo..."
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs focus:ring-2 focus:ring-red-200 outline-hidden"
                    />

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowDeclineReason(false)}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
                      >
                        Atrás
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAttendance('No asiste')}
                        disabled={isSubmitting}
                        className="px-4 py-1.5 text-xs bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition cursor-pointer"
                      >
                        {isSubmitting ? 'Registrando...' : 'Confirmar que No Asisto'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Callup Roster (Real-Time Synchronized) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Lista de Convocados ({match.callups.length})
            </h3>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              ● En vivo
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {match.callups.map((c) => (
              <div
                key={c.playerId}
                className="py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {c.jerseyNumber}
                  </div>
                  <span className="font-semibold text-gray-900 truncate">{c.fullName}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {c.status === 'Confirmado' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Confirmado
                    </span>
                  )}
                  {c.status === 'No asiste' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      No asiste
                    </span>
                  )}
                  {c.status === 'Pendiente' && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      Pendiente
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-gray-400 py-3">
          <p>Convocatoria Fútbol • San Luis, Antioquia 🟢⚪</p>
        </div>
      </div>
    </div>
  );
};
