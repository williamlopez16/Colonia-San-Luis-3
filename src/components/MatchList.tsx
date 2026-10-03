import React from 'react';
import type { Match } from '../types';
import { formatMatchDate, getConfirmationUrl, copyToClipboard } from '../services/whatsappService';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Users,
  Plus,
  Share2,
  ChevronRight,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface MatchListProps {
  matches: Match[];
  onSelectMatch: (matchId: string) => void;
  onNewMatch: () => void;
  onDeleteMatch: (matchId: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({
  matches,
  onSelectMatch,
  onNewMatch,
  onDeleteMatch,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyLink = async (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    const url = getConfirmationUrl(matchId);
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedId(matchId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = (e: React.MouseEvent, matchId: string) => {
    e.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar este partido y su convocatoria?')) {
      onDeleteMatch(matchId);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Partidos y Convocatorias</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Programa partidos, envía convocatorias a WhatsApp y controla la asistencia en tiempo real
          </p>
        </div>

        <button
          onClick={onNewMatch}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Programar Partido</span>
        </button>
      </div>

      {/* Match Cards */}
      {matches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-800 text-base">No hay partidos programados</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
            Comienza creando un partido con fecha, hora, rival y los convocados de tu equipo.
          </p>
          <button
            onClick={onNewMatch}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Partido</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {matches.map((match) => {
            const confirmedCount = match.callups.filter((c) => c.status === 'Confirmado').length;
            const declinedCount = match.callups.filter((c) => c.status === 'No asiste').length;
            const pendingCount = match.callups.filter((c) => c.status === 'Pendiente').length;
            const totalCount = match.callups.length;

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 p-5 shadow-2xs hover:shadow-sm transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {match.tournamentName && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <Trophy className="w-3 h-3 text-emerald-600" />
                        {match.tournamentName}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                        match.status === 'Abierta'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {match.status === 'Cerrada' && <Lock className="w-3 h-3 text-gray-500" />}
                      Convocatoria {match.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">
                    VS  <span className="text-emerald-700">{match.rival}</span>
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {formatMatchDate(match.date)}
                    </span>
                    {match.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {match.time}
                      </span>
                    )}
                    {match.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {match.location}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Real-time Attendance Counters & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  {/* Attendance pills */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1.5 rounded-xl font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{confirmedCount}</span>
                      <span className="text-[10px] font-medium text-emerald-600">Si</span>
                    </div>

                    <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-800 px-2.5 py-1.5 rounded-xl font-bold">
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>{declinedCount}</span>
                      <span className="text-[10px] font-medium text-red-600">No</span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-xl font-bold">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{pendingCount}</span>
                      <span className="text-[10px] font-medium text-amber-600">Pend.</span>
                    </div>

                    <div className="text-[11px] text-gray-400 font-medium pl-1">
                      /{totalCount}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={(e) => handleCopyLink(e, match.id)}
                      className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                      title="Copiar enlace público de confirmación"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {copiedId === match.id ? '¡Copiado!' : 'Enlace'}
                      </span>
                    </button>

                    <button
                      onClick={(e) => handleDelete(e, match.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 text-emerald-600 hover:text-emerald-800 font-bold text-xs flex items-center">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
