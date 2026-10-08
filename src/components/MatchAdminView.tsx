import React, { useState } from 'react';
import type { Team, Match, AttendanceStatus } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { TeamCrest } from './TeamCrest';
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
  BarChart2,
  Edit2,
  Sparkles,
  FileText,
  Search,
} from 'lucide-react';

interface MatchAdminViewProps {
  team: Team | null;
  match: Match;
  onBack: () => void;
  onOpenMatchdayGraphic: () => void;
  onOpenMatchStats: () => void;
  onEditMatch: () => void;
  onOpenAIPrompt?: () => void;
  onOpenPostMatch?: () => void;
}

export const MatchAdminView: React.FC<MatchAdminViewProps> = ({
  team,
  match,
  onBack,
  onOpenMatchdayGraphic,
  onOpenMatchStats,
  onEditMatch,
  onOpenAIPrompt,
  onOpenPostMatch,
}) => {
  const { isAdminMode } = useAccessMode();
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Compute counters
  const confirmedList = match.callups.filter((c) => c.status === 'Confirmado');
  const declinedList = match.callups.filter((c) => c.status === 'No asiste');
  const pendingList = match.callups.filter((c) => c.status === 'Pendiente');
  const totalCount = match.callups.length;

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmado' | 'No asiste' | 'Pendiente'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const confirmedPct = totalCount > 0 ? Math.round((confirmedList.length / totalCount) * 100) : 0;
  const declinedPct = totalCount > 0 ? Math.round((declinedList.length / totalCount) * 100) : 0;
  const pendingPct = totalCount > 0 ? Math.max(0, 100 - confirmedPct - declinedPct) : 0;

  // Filtered callups
  const displayedCallups = match.callups.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return c.fullName.toLowerCase().includes(q) || String(c.jerseyNumber).includes(q);
    }
    return true;
  });

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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
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
            {(match.matchState === 'Finalizado' || match.score?.isPlayed) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-1 rounded-lg shadow-2xs">
                Finalizado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Unificado Cartelera & IA */}
            {onOpenMatchdayGraphic && (
              <button
                onClick={onOpenMatchdayGraphic}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white px-3.5 py-2 text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                title="Generar cartelera oficial HD y prompts listos para IA"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
                <span>Cartelera & IA</span>
              </button>
            )}

            {/* Botón Arbitraje del Partido */}
            {onOpenPostMatch && (
              <button
                onClick={onOpenPostMatch}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                title="Gestión de arbitraje y pagos de los jugadores para este partido"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                <span>Arbitraje</span>
              </button>
            )}

            {/* Botón Cargar / Ver Estadísticas */}
            <button
              onClick={onOpenMatchStats}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-black text-white px-3.5 py-2 text-xs font-extrabold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
              title="Cargar o ver resultado final, goles, asistencias y tarjetas"
            >
              <BarChart2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              <span>Marcador</span>
            </button>

            {/* Botón Editar Partido (solo admin) */}
            {isAdminMode && (
              <button
                onClick={onEditMatch}
                className="flex items-center gap-1.5 rounded-xl bg-white hover:bg-emerald-50 text-gray-800 hover:text-emerald-900 px-3.5 py-2 text-xs font-bold transition-all cursor-pointer border border-gray-200 shadow-2xs active:scale-95"
                title="Editar fecha, lugar, valor de arbitraje o lista de convocados"
              >
                <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                <span>Editar</span>
              </button>
            )}
          </div>
        </div>

        {/* Visual Clash Section */}
        <div className="py-6 px-2 sm:px-6 bg-gradient-to-b from-gray-50/50 to-white rounded-2xl my-3">
          <div className="grid grid-cols-7 items-center gap-2 sm:gap-4 py-2">
            {/* Left: Home Team (Centered) */}
            <div className="col-span-3 flex flex-col items-center justify-center text-center">
              <TeamCrest name={team?.name || 'Colonia San Luis'} isOurTeam size="xl" className="flex-shrink-0" />
              <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight mt-2 text-center max-w-[220px]">
                {team?.name || 'Colonia San Luis'}
              </h2>
            </div>

            {/* Center: Scoreboard / VS */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              {match.score?.isPlayed || match.matchState === 'Finalizado' ? (
                <div className="flex flex-col items-center">
                  <div className="bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white px-3.5 sm:px-6 py-2 sm:py-2.5 rounded-2xl shadow-xl border-2 border-emerald-500/40 text-center ring-1 ring-emerald-500/20">
                    <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                      FINAL
                    </span>
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 font-mono font-black text-2xl sm:text-4xl tracking-tight">
                      <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
                        {match.score?.homeGoals ?? 0}
                      </span>
                      <span className="text-emerald-500 text-base sm:text-2xl font-sans">-</span>
                      <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]">
                        {match.score?.awayGoals ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-950 text-white flex flex-col items-center justify-center shadow-lg border-2 border-emerald-400/60">
                    <span className="font-black text-sm sm:text-lg tracking-wider">VS</span>
                  </div>
                  {match.time && (
                    <span className="text-[11px] font-bold text-gray-500 mt-1.5">
                      {match.time}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Right: Rival Team (Centered) */}
            <div className="col-span-3 flex flex-col items-center justify-center text-center">
              <TeamCrest name={match.rival} isOurTeam={false} size="xl" className="flex-shrink-0" />
              <h2 className="text-base sm:text-xl font-black text-gray-900 leading-tight mt-2 text-center max-w-[220px]">
                {match.rival}
              </h2>
            </div>
          </div>

          {/* Goal Scorers & Cards Summary if recorded */}
          {(match.playerStats || []).some((p) => p.goals > 0 || p.assists > 0 || p.yellowCards > 0 || p.redCards > 0) && (
            <div className="mt-4 pt-3 border-t border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-700">Goleadores:</span>
                {(match.playerStats || [])
                  .filter((p) => p.goals > 0)
                  .map((p) => (
                    <span key={p.playerId} className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                      ⚽ {p.playerName} ({p.goals})
                    </span>
                  ))}
              </div>

              <div className="flex items-center gap-2">
                {(match.playerStats || []).some((p) => p.assists > 0) && (
                  <span className="text-blue-700 font-semibold">
                    👟 {(match.playerStats || []).filter((p) => p.assists > 0).reduce((s, p) => s + p.assists, 0)} asistencias
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Details Row & Callup Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
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
              <span className="flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Arbitraje: {match.refereeFee}
              </span>
            )}
          </div>

          {/* Callup Status Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            {isAdminMode ? (
              match.status === 'Abierta' ? (
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
              )
            ) : (
              match.status === 'Cerrada' && (
                <button
                  onClick={onOpenMatchdayGraphic}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Ver Cartelera Matchday</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* WhatsApp & Share tools row */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-wrap gap-2.5">
          {isAdminMode && (
            <>
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Recordatorio WhatsApp</span>
              </button>

              <button
                onClick={handleCopyWhatsApp}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Copy className="w-4 h-4 text-gray-600" />
                <span>Copiar Mensaje WhatsApp</span>
              </button>
            </>
          )}

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Copy className="w-4 h-4 text-emerald-700" />
            <span>Copiar Enlace Público</span>
          </button>
        </div>
      </div>

      {/* Real-time Attendance Summary & Interactive Filter Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
              <span>📊 Resumen de Convocatoria</span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {totalCount} Jugadores
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Toca cualquiera de las tarjetas para filtrar la nómina y gestionar la asistencia
            </p>
          </div>

          {statusFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>✕ Quitar filtro (Ver todos {totalCount})</span>
            </button>
          )}
        </div>

        {/* Visual Proportional Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${confirmedPct}%` }}
              className="bg-emerald-500 h-full transition-all duration-500"
              title={`Confirmados: ${confirmedList.length} (${confirmedPct}%)`}
            />
            <div
              style={{ width: `${declinedPct}%` }}
              className="bg-red-500 h-full transition-all duration-500"
              title={`No asisten: ${declinedList.length} (${declinedPct}%)`}
            />
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Pendientes: ${pendingList.length} (${pendingPct}%)`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400 px-0.5">
            <span className="text-emerald-700 font-bold">{confirmedPct}% confirmados</span>
            <span className="text-amber-700 font-bold">{pendingPct}% por responder</span>
            <span className="text-red-700 font-bold">{declinedPct}% no asisten</span>
          </div>
        </div>

        {/* 3 Interactive Summary & Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* 1. Confirmados Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Confirmado' ? 'all' : 'Confirmado')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
              statusFilter === 'Confirmado'
                ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                : 'bg-white hover:bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmados</span>
              </span>
              <span className="text-[11px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full">
                {confirmedPct}%
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-emerald-950 font-mono">
                  {confirmedList.length}
                </span>
                <span className="text-xs text-emerald-700 ml-1.5 font-semibold">
                  de {totalCount}
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-800 bg-white/80 border border-emerald-200 px-2 py-0.5 rounded-lg shadow-2xs">
                {statusFilter === 'Confirmado' ? '✓ Filtrando' : 'Filtrar →'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">
              ✓ Asistirán a la cancha
            </p>
          </button>

          {/* 2. No Asisten Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'No asiste' ? 'all' : 'No asiste')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
              statusFilter === 'No asiste'
                ? 'bg-red-50/90 border-red-500 ring-2 ring-red-500/30 shadow-sm'
                : 'bg-white hover:bg-red-50/40 border-red-200/80 hover:border-red-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>No Asisten</span>
              </span>
              <span className="text-[11px] font-black text-red-900 bg-red-100 px-2 py-0.5 rounded-full">
                {declinedPct}%
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-red-950 font-mono">
                  {declinedList.length}
                </span>
                <span className="text-xs text-red-700 ml-1.5 font-semibold">
                  de {totalCount}
                </span>
              </div>
              <span className="text-[11px] font-bold text-red-800 bg-white/80 border border-red-200 px-2 py-0.5 rounded-lg shadow-2xs">
                {statusFilter === 'No asiste' ? '✓ Filtrando' : 'Filtrar →'}
              </span>
            </div>
            <p className="text-[11px] text-red-700 font-medium mt-1">
              ✕ Bajas confirmadas
            </p>
          </button>

          {/* 3. Pendientes Card */}
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Pendiente' ? 'all' : 'Pendiente')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
              statusFilter === 'Pendiente'
                ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                : 'bg-white hover:bg-amber-50/40 border-amber-200/80 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Pendientes</span>
              </span>
              <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full">
                {pendingPct}%
              </span>
            </div>

            <div className="mt-2.5 flex items-baseline justify-between">
              <div>
                <span className="text-3xl font-black text-amber-950 font-mono">
                  {pendingList.length}
                </span>
                <span className="text-xs text-amber-700 ml-1.5 font-semibold">
                  por responder
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-800 bg-white/80 border border-amber-200 px-2 py-0.5 rounded-lg shadow-2xs">
                {statusFilter === 'Pendiente' ? '✓ Filtrando' : 'Filtrar →'}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              ⏳ Sin confirmar asistencia
            </p>
          </button>
        </div>

        {/* Action helper bar when Pendientes is active or has items */}
        {pendingList.length > 0 && statusFilter === 'Pendiente' && (
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in text-xs">
            <span className="text-amber-900 font-bold">
              📢 Hay {pendingList.length} jugadores pendientes por responder su convocatoria:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar Recordatorio</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Convocatoria Roster Table / List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <span>Detalle de Convocados</span>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {displayedCallups.length} de {totalCount}
              </span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdminMode
                ? 'Toca el botón de estado de cualquier jugador para cambiarlo manualmente'
                : 'Listado oficial sincronizado en tiempo real'}
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o #..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50/60 text-xs font-bold text-gray-900 focus:outline-emerald-600 focus:bg-white transition"
            />
          </div>
        </div>

        {displayedCallups.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs space-y-2">
            <p className="font-bold text-gray-600">No se encontraron jugadores con los filtros seleccionados.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              Restablecer filtros y mostrar todos
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedCallups.map((callup) => (
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm truncate">{callup.fullName}</p>
                      {callup.isScholarship && (
                        <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded border border-purple-200">
                          🎓 Becado
                        </span>
                      )}
                      {callup.attended && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          ✓ Asistió
                        </span>
                      )}
                    </div>
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

                {/* Status Badge & Manual Toggle (button only for admin, badge for players) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isAdminMode ? (
                    <button
                      onClick={() => handleTogglePlayerStatus(callup.playerId, callup.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        callup.status === 'Confirmado'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 shadow-2xs'
                          : callup.status === 'No asiste'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200 shadow-2xs'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200 shadow-2xs'
                      }`}
                      title="Cambiar estado manualmente"
                    >
                      {callup.status === 'Confirmado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {callup.status === 'No asiste' && <XCircle className="w-3.5 h-3.5" />}
                      {callup.status === 'Pendiente' && <HelpCircle className="w-3.5 h-3.5" />}
                      <span>{callup.status}</span>
                    </button>
                  ) : (
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 select-none ${
                        callup.status === 'Confirmado'
                          ? 'bg-emerald-100 text-emerald-800'
                          : callup.status === 'No asiste'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {callup.status === 'Confirmado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {callup.status === 'No asiste' && <XCircle className="w-3.5 h-3.5" />}
                      {callup.status === 'Pendiente' && <HelpCircle className="w-3.5 h-3.5" />}
                      <span>{callup.status}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
