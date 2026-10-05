import React, { useState, useMemo } from 'react';
import type { Player, Charge, Match, Team, PaymentMethod } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { markChargePending, deleteCharge } from '../services/dataService';
import { formatMatchDate } from '../services/whatsappService';
import { PaymentModal } from './PaymentModal';
import { AddChargeModal } from './AddChargeModal';
import {
  X,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Phone,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface PlayerFinanceModalProps {
  player: Player;
  charges: Charge[];
  matches: Match[];
  team: Team | null;
  onClose: () => void;
}

export const PlayerFinanceModal: React.FC<PlayerFinanceModalProps> = ({
  player,
  charges,
  matches,
  team,
  onClose,
}) => {
  const { isAdminMode } = useAccessMode();
  const [selectedChargeForPayment, setSelectedChargeForPayment] = useState<Charge | null>(null);
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [filterState, setFilterState] = useState<'todos' | 'pendientes' | 'pagados'>('todos');

  // Filter charges for this player
  const playerCharges = useMemo(() => {
    return charges
      .filter((c) => c.playerId === player.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [charges, player.id]);

  const pendingCharges = useMemo(() => {
    return playerCharges.filter((c) => c.status === 'Pendiente');
  }, [playerCharges]);

  const paidCharges = useMemo(() => {
    return playerCharges.filter((c) => c.status === 'Pagado');
  }, [playerCharges]);

  const totalPendingAmount = useMemo(() => {
    return pendingCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [pendingCharges]);

  const totalPaidAmount = useMemo(() => {
    return paidCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [paidCharges]);

  const displayedCharges = useMemo(() => {
    if (filterState === 'pendientes') return pendingCharges;
    if (filterState === 'pagados') return paidCharges;
    return playerCharges;
  }, [filterState, playerCharges, pendingCharges, paidCharges]);

  // Match lookup map
  const matchMap = useMemo(() => {
    return new Map(matches.map((m) => [m.id, m]));
  }, [matches]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRevertPayment = async (chargeId: string) => {
    if (confirm('¿Deseas revertir este pago a estado Pendiente?')) {
      try {
        await markChargePending(chargeId);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al revertir pago');
      }
    }
  };

  const handleDeleteCharge = async (chargeId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cobro?')) {
      try {
        await deleteCharge(chargeId);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al eliminar cobro');
      }
    }
  };

  const handleSendWhatsAppReminder = () => {
    if (pendingCharges.length === 0) return;

    const teamTitle = team?.name || 'Club San Luis';
    const lines: string[] = [];

    lines.push(`👋 Hola ${player.fullName}, te compartimos el resumen de tu estado de cuenta con *${teamTitle}*:`);
    lines.push('');
    lines.push(`💰 *Total pendiente por pagar: ${formatCurrency(totalPendingAmount)}*`);
    lines.push('');
    lines.push('📋 *Desglose de cobros pendientes:*');

    pendingCharges.forEach((c) => {
      let desc = c.conceptName;
      if (c.type === 'arbitraje' && c.matchId) {
        const m = matchMap.get(c.matchId);
        if (m) {
          desc = `Arbitraje (vs. ${m.rival}, ${formatMatchDate(m.date)})`;
        }
      }
      lines.push(`• ${desc}: ${formatCurrency(c.amount)}`);
    });

    lines.push('');
    lines.push('Por favor realiza tu pago a través de Nequi / Daviplata / Efectivo y envía el comprobante de pago. ¡Muchas gracias por el apoyo al equipo! 🟢⚪');

    const message = encodeURIComponent(lines.join('\n'));
    const phoneClean = player.phone.replace(/\D/g, '');
    const url = `https://wa.me/57${phoneClean}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-emerald-950 font-black text-xl flex items-center justify-center shadow-md border-2 border-emerald-900">
              {player.jerseyNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg sm:text-xl leading-tight">
                  {player.fullName}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    player.status === 'Activo'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {player.status}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{player.phone}</span>
              </p>
            </div>
          </div>

          {/* Pending Debt Alert / Good Standing */}
          <div className="mt-4 pt-4 border-t border-emerald-700/60 grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider block">
                Saldo Pendiente
              </span>
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  totalPendingAmount > 0 ? 'text-amber-300' : 'text-white'
                }`}
              >
                {formatCurrency(totalPendingAmount)}
              </span>
            </div>

            <div className="bg-white/10 rounded-2xl p-3 border border-white/10">
              <span className="text-[11px] text-emerald-200 font-semibold uppercase tracking-wider block">
                Total Pagado
              </span>
              <span className="text-2xl font-black text-emerald-300 font-mono tracking-tight">
                {formatCurrency(totalPaidAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar: Actions & Filter Pills */}
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filter tabs */}
          <div className="inline-flex bg-gray-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setFilterState('todos')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterState === 'todos' ? 'bg-white text-emerald-900 shadow-xs' : 'text-gray-600'
              }`}
            >
              Todos ({playerCharges.length})
            </button>
            <button
              onClick={() => setFilterState('pendientes')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterState === 'pendientes'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-gray-600'
              }`}
            >
              Pendientes ({pendingCharges.length})
            </button>
            <button
              onClick={() => setFilterState('pagados')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterState === 'pagados'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600'
              }`}
            >
              Pagados ({paidCharges.length})
            </button>
          </div>

          {/* Quick Buttons */}
          <div className="flex items-center gap-2">
            {isAdminMode && totalPendingAmount > 0 && (
              <button
                onClick={handleSendWhatsAppReminder}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Enviar detalle de deuda por WhatsApp"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Cobrar por WhatsApp</span>
              </button>
            )}

            {isAdminMode && (
              <button
                onClick={() => setIsAddChargeOpen(true)}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-emerald-900 border border-gray-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Agregar Cobro</span>
              </button>
            )}
          </div>
        </div>

        {/* Charges List */}
        <div className="p-4 sm:p-5 max-h-[55vh] overflow-y-auto space-y-2.5">
          {displayedCharges.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-bold text-gray-700">No hay cobros registrados en esta sección</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {filterState === 'pendientes'
                  ? '¡Este jugador está al día con sus pagos!'
                  : 'Registra cobros de arbitraje o conceptos esporádicos.'}
              </p>
            </div>
          ) : (
            displayedCharges.map((ch) => {
              const isPaid = ch.status === 'Pagado';
              const match = ch.matchId ? matchMap.get(ch.matchId) : null;

              return (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPaid
                      ? 'bg-white border-gray-200'
                      : 'bg-amber-50/40 border-amber-200'
                  }`}
                >
                  {/* Left: Concept & Match info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-gray-900">
                        {ch.conceptName}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ch.status}
                      </span>

                      <span className="text-[10px] text-gray-400 font-semibold uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                        {ch.type === 'arbitraje' ? '⚽ Arbitraje' : '📦 Esporádico'}
                      </span>
                    </div>

                    {/* Match identification if arbitraje */}
                    {ch.type === 'arbitraje' && (
                      <p className="text-xs font-semibold text-emerald-800">
                        {match ? `vs. ${match.rival} (${formatMatchDate(match.date)})` : 'Partido programado'}
                      </p>
                    )}

                    {/* Paid info */}
                    {isPaid && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <span>Pagado vía <b>{ch.paymentMethod || 'Efectivo'}</b></span>
                        {ch.paidAt && (
                          <span>el {new Date(ch.paidAt).toLocaleDateString('es-CO')}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Right: Amount & Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className="font-mono font-black text-base text-gray-900">
                      {formatCurrency(ch.amount)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isPaid ? (
                        <button
                          onClick={() => setSelectedChargeForPayment(ch)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar Pagado</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRevertPayment(ch.id)}
                          className="p-1.5 text-gray-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Revertir a Pendiente"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteCharge(ch.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Eliminar cobro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>

      {/* Payment Method Dialog */}
      {selectedChargeForPayment && (
        <PaymentModal
          charge={selectedChargeForPayment}
          onClose={() => setSelectedChargeForPayment(null)}
        />
      )}

      {/* Add Charge directly for this player */}
      {isAddChargeOpen && (
        <AddChargeModal
          team={team}
          players={[player]}
          concepts={[]}
          existingCharges={charges}
          preselectedPlayerId={player.id}
          onClose={() => setIsAddChargeOpen(false)}
        />
      )}
    </div>
  );
};
