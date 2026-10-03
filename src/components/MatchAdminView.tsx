import React, { useState } from 'react';
import type { Team, Match, AttendanceStatus } from '../types';
import {
  updatePlayerAttendance,
  closeMatchCallup,
  reopenMatchCallup,
} from '../services/dataService';
import {
  generateWhatsAppMessage,
  openWhatsAppShare,
  copyToClipboard,
  getConfirmationUrl,
  formatMatchDate,
} from '../services/whatsappService';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  DollarSign,
  Share2,
  Copy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Unlock,
  Image as ImageIcon,
  ArrowLeft,
  Phone,
  Check,
  ExternalLink,
} from 'lucide-react';

interface MatchAdminViewProps {
  team: Team | null;
  match: Match;
  onBack: () => void;
  onOpenMatchdayGraphic: () => void;
}

export const MatchAdminView: React.FC<MatchAdminViewProps> = ({
  team,
  match,
  onBack,
  onOpenMatchdayGraphic,
}) => {
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Compute counters
  const confirmedList = match.callups.filter((c) => c.status === 'Confirmado');
  const declinedList = match.callups.filter((c) => c.status === 'No asiste');
  const pendingList = match.callups.filter((c) => c.status === 'Pendiente');
  const totalCount = match.callups.length;

  const confirmationLink = getConfirmationUrl(match.id);
  const fullWhatsAppText = team ? generateWhatsAppMessage(team, match) : '';

  const handleCopyLink = async () => {
    const success = await copyToClipboard(confirmationLink);
    if (success) {
      setCopySuccess('¡Enlace de confirmación copiado al portapapeles!');
      setTimeout(() => setCopySuccess(null), 3000);
    }
  };

  const handleCopyWhatsApp = async () => {
    const success = await copyToClipboard(fullWhatsAppText);
    if (success) {
      setCopySuccess('¡Mensaje para WhatsApp copiado al portapapeles!');
      setTimeout(() => setCopySuccess(null), 3000);
    }
  };

  const handleShareWhatsApp = () => {
    openWhatsAppShare(fullWhatsAppText);
  };

  const handleTogglePlayerStatus = async (playerId: string, currentStatus: AttendanceStatus) => {
    setActionError(null);
    let nextStatus: AttendanceStatus = 'Confirmado';
    if (currentStatus === 'Pendiente') nextStatus = 'Confirmado';
    else if (currentStatus === 'Confirmado') nextStatus = 'No asiste';
    else nextStatus = 'Pendiente';

    try {
      await updatePlayerAttendance(match.id, playerId, nextStatus);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  const handleCloseCallup = async () => {
    setActionError(null);
    setIsUpdatingStatus(true);
    try {
      await closeMatchCallup(match.id);
      onOpenMatchdayGraphic();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al cerrar convocatoria');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReopenCallup = async () => {
    setActionError(null);
    setIsUpdatingStatus(true);
    try {
      await reopenMatchCallup(match.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al reabrir convocatoria');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la lista de partidos</span>
        </button>

        <a
          href={confirmationLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
        >
          <span>Abrir pantalla pública de confirmación</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Error / Success Banners */}
      {actionError && (
        <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-200">
          {actionError}
        </div>
      )}

      {copySuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{copySuccess}</span>
        </div>
      )}

      {/* Main Match Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {match.tournamentName && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                  {match.tournamentName}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${
                  match.status === 'Abierta'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {match.status === 'Cerrada' && <Lock className="w-3.5 h-3.5" />}
                Convocatoria {match.status}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              {team?.name || 'Club San Luis'} <span className="text-gray-400 font-normal">VS</span>{' '}
              <span className="text-emerald-700">{match.rival}</span>
            </h2>

            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap pt-1">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {formatMatchDate(match.date)}
              </span>
              {match.time && (
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  {match.time}
                </span>
              )}
              {match.location && (
                <span className="flex items-center gap-1 font-medium">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {match.location}
                </span>
              )}
              {match.refereeFee && (
                <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Arbitraje: {match.refereeFee}
                </span>
              )}
            </div>
          </div>

          {/* Callup Status Switcher */}
          <div className="flex items-center gap-2">
            {match.status === 'Abierta' ? (
              <button
                onClick={handleCloseCallup}
                disabled={isUpdatingStatus}
                className="flex items-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Cerrar Convocatoria y Generar Cartelera</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenMatchdayGraphic}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Ver Cartelera Matchday</span>
                </button>
                <button
                  onClick={handleReopenCallup}
                  disabled={isUpdatingStatus}
                  className="flex items-center gap-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 text-xs font-semibold transition cursor-pointer"
                  title="Reabrir convocatoria para recibir más confirmaciones"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reabrir</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp & Share tools row */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Enviar a WhatsApp</span>
          </button>

          <button
            onClick={handleCopyWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Copy className="w-4 h-4 text-gray-600" />
            <span>Copiar Mensaje WhatsApp</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Copy className="w-4 h-4 text-emerald-700" />
            <span>Copiar Enlace Público</span>
          </button>
        </div>
      </div>

      {/* Real-time Attendance Counters */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Confirmados
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {confirmedList.length}
            </span>
            <span className="text-xs text-gray-400 font-medium">de {totalCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-red-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
              No Asisten
            </span>
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {declinedList.length}
            </span>
            <span className="text-xs text-gray-400 font-medium">de {totalCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pendientes
            </span>
            <HelpCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {pendingList.length}
            </span>
            <span className="text-xs text-gray-400 font-medium">por confirmar</span>
          </div>
        </div>
      </div>

      {/* Convocatoria Roster Table / List */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
            Detalle de Convocados (Sincronizado en Tiempo Real)
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            Toca el botón de estado de un jugador para cambiarlo manualmente
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {match.callups.map((callup) => (
            <div
              key={callup.playerId}
              className="py-3 sm:py-3.5 flex items-center justify-between gap-3 hover:bg-gray-50/60 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular Badge with Jersey Number */}
                <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0 border-2 border-emerald-900 shadow-2xs">
                  {callup.jerseyNumber}
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{callup.fullName}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {callup.phone}
                    </span>
                    {callup.reason && (
                      <span className="text-red-600 italic truncate max-w-[200px]">
                        • Motivo: "{callup.reason}"
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Manual Toggle */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTogglePlayerStatus(callup.playerId, callup.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    callup.status === 'Confirmado'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : callup.status === 'No asiste'
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                  title="Cambiar estado manualmente"
                >
                  {callup.status === 'Confirmado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {callup.status === 'No asiste' && <XCircle className="w-3.5 h-3.5" />}
                  {callup.status === 'Pendiente' && <HelpCircle className="w-3.5 h-3.5" />}
                  <span>{callup.status}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
