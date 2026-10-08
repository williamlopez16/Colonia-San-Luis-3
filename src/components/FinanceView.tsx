import React, { useState, useMemo } from 'react';
import type { Team, Charge, Player, Match, Tournament, Concept, PaymentMethod } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { formatMatchDate } from '../services/whatsappService';
import { AddChargeModal } from './AddChargeModal';
import { PaymentModal } from './PaymentModal';
import { PlayerFinanceModal } from './PlayerFinanceModal';
import { ConceptDetailModal } from './ConceptDetailModal';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Phone,
  Plus,
  ArrowUpRight,
  PieChart,
  Users,
  Search,
  Calendar,
  Sparkles,
  ChevronRight,
  Check,
} from 'lucide-react';

interface FinanceViewProps {
  team: Team | null;
  charges: Charge[];
  players: Player[];
  matches: Match[];
  tournaments: Tournament[];
  concepts: Concept[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  team,
  charges,
  players,
  matches,
  tournaments,
  concepts,
}) => {
  const { isAdminMode } = useAccessMode();

  // Filters
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_30_days'>('all');
  const [playerSearchQuery, setPlayerSearchQuery] = useState<string>('');

  // Modals
  const [isAddChargeOpen, setIsAddChargeOpen] = useState(false);
  const [selectedChargeForPayment, setSelectedChargeForPayment] = useState<Charge | null>(null);
  const [selectedPlayerForFinance, setSelectedPlayerForFinance] = useState<Player | null>(null);
  const [selectedConceptForDetail, setSelectedConceptForDetail] = useState<{
    conceptName: string;
    conceptType: 'arbitraje' | 'esporadico';
  } | null>(null);

  // Match lookup map
  const matchMap = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // 1. Filtered Charges
  const filteredCharges = useMemo(() => {
    return charges.filter((c) => {
      // Tournament filter (applies only if charge is arbitraje and has matchId)
      if (selectedTournamentId !== 'all') {
        if (c.type === 'arbitraje' && c.matchId) {
          const match = matchMap.get(c.matchId);
          if (!match || match.tournamentId !== selectedTournamentId) {
            return false;
          }
        } else {
          // Non-match charges omitted when filtering by specific tournament
          return false;
        }
      }

      // Date range filter
      if (dateFilter !== 'all') {
        const chargeDate = new Date(c.createdAt).getTime();
        const now = new Date();
        if (dateFilter === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (chargeDate < startOfMonth) return false;
        } else if (dateFilter === 'last_30_days') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          if (chargeDate < thirtyDaysAgo) return false;
        }
      }

      return true;
    });
  }, [charges, selectedTournamentId, dateFilter, matchMap]);

  // 2. Computed KPI Totals
  const totals = useMemo(() => {
    let collected = 0;
    let pending = 0;

    filteredCharges.forEach((c) => {
      if (c.status === 'Pagado') {
        collected += c.amount || 0;
      } else {
        pending += c.amount || 0;
      }
    });

    const totalBilled = collected + pending;
    const collectionRate = totalBilled > 0 ? Math.round((collected / totalBilled) * 100) : 0;

    return {
      collected,
      pending,
      totalBilled,
      collectionRate,
    };
  }, [filteredCharges]);

  // 3. Breakdown by Concept
  const conceptBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        conceptName: string;
        type: 'arbitraje' | 'esporadico';
        collected: number;
        pending: number;
        count: number;
      }
    >();

    filteredCharges.forEach((c) => {
      const key = c.conceptName.trim() || 'Varios';
      const existing = map.get(key) || {
        conceptName: key,
        type: c.type,
        collected: 0,
        pending: 0,
        count: 0,
      };

      existing.count += 1;
      if (c.status === 'Pagado') {
        existing.collected += c.amount || 0;
      } else {
        existing.pending += c.amount || 0;
      }
      map.set(key, existing);
    });

    return Array.from(map.values()).sort(
      (a, b) => b.collected + b.pending - (a.collected + a.pending)
    );
  }, [filteredCharges]);

  // 4. Ranking of Players by highest pending balance
  const playerRankings = useMemo(() => {
    const playerMap = new Map<
      string,
      {
        player: Player;
        pendingAmount: number;
        paidAmount: number;
        pendingCount: number;
        paidCount: number;
        pendingItems: Charge[];
      }
    >();

    // Seed with all players
    players.forEach((p) => {
      playerMap.set(p.id, {
        player: p,
        pendingAmount: 0,
        paidAmount: 0,
        pendingCount: 0,
        paidCount: 0,
        pendingItems: [],
      });
    });

    // Populate from filtered charges
    filteredCharges.forEach((c) => {
      const entry = playerMap.get(c.playerId);
      if (entry) {
        if (c.status === 'Pagado') {
          entry.paidAmount += c.amount || 0;
          entry.paidCount += 1;
        } else {
          entry.pendingAmount += c.amount || 0;
          entry.pendingCount += 1;
          entry.pendingItems.push(c);
        }
      }
    });

    let list = Array.from(playerMap.values());

    // Search filter
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.player.fullName.toLowerCase().includes(q) ||
          String(item.player.jerseyNumber).includes(q)
      );
    }

    // Sort by highest pending debt first, then by name
    return list.sort((a, b) => b.pendingAmount - a.pendingAmount || a.player.fullName.localeCompare(b.player.fullName));
  }, [players, filteredCharges, playerSearchQuery]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // WhatsApp Reminder Sender
  const handleSendWhatsAppReminder = (
    player: Player,
    pendingAmount: number,
    pendingItems: Charge[]
  ) => {
    if (pendingAmount <= 0) return;

    const teamTitle = team?.name || 'Club San Luis';
    const lines: string[] = [];

    lines.push(`👋 Hola ${player.fullName}, te compartimos el resumen de tu estado de cuenta con *${teamTitle}*:`);
    lines.push('');
    lines.push(`💰 *Total pendiente por pagar: ${formatCurrency(pendingAmount)}*`);
    lines.push('');
    lines.push('📋 *Desglose de cobros pendientes:*');

    pendingItems.forEach((c) => {
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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Módulo de Finanzas
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Control de arbitrajes por partido y cobros esporádicos (uniformes, inscripciones) por jugador
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Add Sporadic Charge Button (solo admin) */}
          {isAdminMode && (
            <button
              onClick={() => setIsAddChargeOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Cobro</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-700">Filtros:</span>

          {/* Tournament Filter */}
          <select
            value={selectedTournamentId}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition cursor-pointer"
          >
            <option value="all">🏆 Todos los Torneos / Conceptos</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition cursor-pointer"
          >
            <option value="all">📅 Todo el Historial</option>
            <option value="this_month">📅 Este Mes</option>
            <option value="last_30_days">📅 Últimos 30 Días</option>
          </select>
        </div>

        <span className="text-gray-400 text-[11px]">
          Mostrando <b>{filteredCharges.length}</b> cobros registrados
        </span>
      </div>

      {/* KPI Cards: Recaudado, Pendiente, Total */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Recaudado */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-sm border border-emerald-700 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Total Recaudado
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black font-mono tracking-tight text-white">
              {formatCurrency(totals.collected)}
            </span>
            <p className="text-xs text-emerald-200 mt-1">
              {totals.collectionRate}% de recaudación efectiva
            </p>
          </div>
        </div>

        {/* Pendiente */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Saldo Pendiente (Por Cobrar)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black font-mono tracking-tight text-amber-600">
              {formatCurrency(totals.pending)}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Dinero por recaudar entre el plantel
            </p>
          </div>
        </div>

        {/* Total Facturado */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-200 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Total Facturado
            </span>
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black font-mono tracking-tight text-gray-900">
              {formatCurrency(totals.totalBilled)}
            </span>
            <div className="w-full bg-gray-100 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, totals.collectionRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Desglose por Concepto */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
                Desglose por Concepto
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Toca cualquier concepto para abrir su detalle completo, ver jugadores, registrar pagos y editar cuotas.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl self-start sm:self-auto">
            {conceptBreakdown.length} conceptos activos
          </span>
        </div>

        {conceptBreakdown.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs">
            No hay cobros registrados aún. Crea un partido para generar arbitrajes o agrega un cobro esporádico.
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {conceptBreakdown.map((item) => {
              const total = item.collected + item.pending;
              const pct = total > 0 ? Math.round((item.collected / total) * 100) : 0;

              return (
                <div
                  key={item.conceptName}
                  onClick={() =>
                    setSelectedConceptForDetail({
                      conceptName: item.conceptName,
                      conceptType: item.type,
                    })
                  }
                  className="bg-gray-50/80 hover:bg-white rounded-2xl p-4 border border-gray-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3"
                  title="Toca para abrir el detalle y administrar cobros de este concepto"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors leading-tight truncate flex items-center gap-1.5">
                        <span className="truncate">{item.conceptName}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                      </h4>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase block mt-0.5">
                        {item.type === 'arbitraje' ? '⚽ Arbitraje' : '📦 Esporádico'} ({item.count} cobros)
                      </span>
                    </div>

                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono flex-shrink-0 ${
                        pct === 100
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        pct === 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Amounts */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200 text-gray-600">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Recaudado</span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {formatCurrency(item.collected)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 block">Falta por Cobrar</span>
                      <span
                        className={`font-bold font-mono ${
                          item.pending > 0 ? 'text-amber-700' : 'text-gray-400'
                        }`}
                      >
                        {formatCurrency(item.pending)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom indicator */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">
                    <span className="flex items-center gap-1">
                      <span>Ver y gestionar cobros</span>
                      {isAdminMode && (
                        <span className="text-[10px] font-normal text-gray-400">• Editar</span>
                      )}
                    </span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Ranking de Deudores / Saldo por Jugador */}
      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm sm:text-base text-gray-900">
              Estado de Cuenta y Deudas por Jugador
            </h3>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={playerSearchQuery}
              onChange={(e) => setPlayerSearchQuery(e.target.value)}
              placeholder="Buscar jugador..."
              className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-1.5 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition"
            />
          </div>
        </div>

        {/* Players Financial Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 uppercase text-[10px] font-bold border-b border-gray-200">
                <th className="py-3 px-4 w-12 text-center">Dorsal</th>
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-4 text-right text-amber-700 font-extrabold">Saldo Pendiente</th>
                <th className="py-3 px-4 text-right text-emerald-800 font-bold">Total Pagado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {playerRankings.map((row) => {
                const hasDebt = row.pendingAmount > 0;

                return (
                  <tr
                    key={row.player.id}
                    className="hover:bg-gray-50/60 transition group cursor-pointer"
                    onClick={() => setSelectedPlayerForFinance(row.player)}
                  >
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block bg-emerald-800 text-white font-black text-xs px-2 py-0.5 rounded-md">
                        {row.player.jerseyNumber}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm block">
                          {row.player.fullName}
                        </span>
                        {row.player.status !== 'Activo' && (
                          <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            {row.player.status}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {row.pendingCount} cobro(s) pendiente(s)
                      </span>
                    </td>

                    {/* Pending Debt */}
                    <td className="py-3.5 px-4 text-right">
                      {hasDebt ? (
                        <span className="inline-block font-mono font-black text-sm text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          {formatCurrency(row.pendingAmount)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Check className="w-3.5 h-3.5" /> Al día
                        </span>
                      )}
                    </td>

                    {/* Paid Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-700">
                      {formatCurrency(row.paidAmount)}
                    </td>

                    {/* Actions */}
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isAdminMode && hasDebt && (
                          <button
                            onClick={() =>
                              handleSendWhatsAppReminder(
                                row.player,
                                row.pendingAmount,
                                row.pendingItems
                              )
                            }
                            className="p-1.5 sm:px-2.5 sm:py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-emerald-200"
                            title="Cobrar por WhatsApp con desglose"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Cobrar</span>
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedPlayerForFinance(row.player)}
                          className="px-2.5 py-1 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer text-[11px] font-bold flex items-center gap-1"
                        >
                          <span>Ficha</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Charge Modal */}
      {isAddChargeOpen && (
        <AddChargeModal
          team={team}
          players={players}
          concepts={concepts}
          existingCharges={charges}
          onClose={() => setIsAddChargeOpen(false)}
        />
      )}

      {/* Player Finance Detail Modal */}
      {selectedPlayerForFinance && (
        <PlayerFinanceModal
          player={selectedPlayerForFinance}
          charges={charges}
          matches={matches}
          team={team}
          onClose={() => setSelectedPlayerForFinance(null)}
        />
      )}

      {/* Payment Method Dialog */}
      {selectedChargeForPayment && (
        <PaymentModal
          charge={selectedChargeForPayment}
          onClose={() => setSelectedChargeForPayment(null)}
        />
      )}

      {/* Concept Breakdown Detail & Administration Modal */}
      {selectedConceptForDetail && (
        <ConceptDetailModal
          conceptName={selectedConceptForDetail.conceptName}
          conceptType={selectedConceptForDetail.conceptType}
          charges={charges}
          players={players}
          matches={matches}
          team={team}
          concepts={concepts}
          onClose={() => setSelectedConceptForDetail(null)}
        />
      )}
    </div>
  );
};
