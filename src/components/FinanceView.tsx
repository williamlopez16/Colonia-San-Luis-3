import React, { useState, useMemo } from 'react';
import type { Team, Charge, Player, Match, Tournament, Concept, PaymentMethod } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { formatMatchDate } from '../services/whatsappService';
import { AddChargeModal } from './AddChargeModal';
import { PaymentModal } from './PaymentModal';
import { PlayerFinanceModal } from './PlayerFinanceModal';
import { ConceptDetailModal } from './ConceptDetailModal';
import { updateConceptBreakdown, deleteConceptBreakdown } from '../services/dataService';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
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
  Edit3,
  Trash2,
  X,
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

  // Edit / Delete Concept Breakdown States
  const [editingConcept, setEditingConcept] = useState<{
    conceptName: string;
    currentAmount: number;
    count: number;
    pendingCount: number;
  } | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  const [deletingConcept, setDeletingConcept] = useState<{
    conceptName: string;
    count: number;
    totalAmount: number;
    collected: number;
    pending: number;
  } | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

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
        paidCount: number;
        pendingCount: number;
        defaultAmount: number;
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
        paidCount: 0,
        pendingCount: 0,
        defaultAmount: c.amount || 0,
      };

      existing.count += 1;
      if (c.status === 'Pagado') {
        existing.collected += c.amount || 0;
        existing.paidCount += 1;
      } else {
        existing.pending += c.amount || 0;
        existing.pendingCount += 1;
      }
      if (c.amount && (!existing.defaultAmount || existing.defaultAmount === 0)) {
        existing.defaultAmount = c.amount;
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
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-fade-in ${
            toastType === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastType === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            )}
            <span className="text-sm font-bold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-800 transition cursor-pointer"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                  className="bg-gray-50/80 hover:bg-white rounded-2xl p-4 border border-gray-200/90 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99] space-y-3 flex flex-col justify-between"
                  title="Toca para abrir el detalle y administrar cobros de este concepto"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-gray-900 group-hover:text-emerald-800 transition-colors leading-tight truncate flex items-center gap-1.5">
                          <span className="truncate">{item.conceptName}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">
                            {item.type === 'arbitraje' ? '⚽ Arbitraje' : '📦 Esporádico'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            • {item.count} {item.count === 1 ? 'cobro' : 'cobros'} ({item.paidCount} pagados, {item.pendingCount} pendientes)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-lg font-mono ${
                            pct === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {pct}%
                        </span>
                      </div>
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
                  </div>

                  {/* Actions & Detail link */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    {isAdminMode && (
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setEditingConcept({
                              conceptName: item.conceptName,
                              currentAmount: item.defaultAmount,
                              count: item.count,
                              pendingCount: item.pendingCount,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Editar nombre y cuota de este concepto"
                        >
                          <Edit3 className="w-3 h-3 text-emerald-600" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setDeletingConcept({
                              conceptName: item.conceptName,
                              count: item.count,
                              totalAmount: item.collected + item.pending,
                              collected: item.collected,
                              pending: item.pending,
                            })
                          }
                          className="px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          title="Eliminar este concepto y todos sus cobros asociados"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                          <span>Borrar</span>
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">
                      <span className="flex items-center gap-1">
                        <span>Ver y gestionar {item.count} jugadores</span>
                      </span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </div>
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
          onConceptDeleted={() => {
            setSelectedConceptForDetail(null);
            showToast('Concepto y sus cobros eliminados con éxito. Estadísticas actualizadas.');
          }}
          onConceptRenamed={(newName) => {
            setSelectedConceptForDetail((prev) =>
              prev ? { ...prev, conceptName: newName } : null
            );
            showToast(`Concepto renombrado a "${newName}". Estadísticas actualizadas.`);
          }}
        />
      )}

      {/* ==================================================== */}
      {/* MODAL: EDITAR DESGLOSE POR CONCEPTO                  */}
      {/* ==================================================== */}
      {editingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 my-auto animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-950 text-white p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/20 shadow-xs">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Editar Desglose de Concepto</h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {editingConcept.count} {editingConcept.count === 1 ? 'cobro registrado' : 'cobros registrados'} en este desglose
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingConcept(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nameInput = form.elements.namedItem('conceptName') as HTMLInputElement;
                const amountInput = form.elements.namedItem('conceptAmount') as HTMLInputElement;
                const applyToInput = form.elements.namedItem('applyTo') as RadioNodeList;
                const updateCatalogInput = form.elements.namedItem('updateCatalog') as HTMLInputElement;

                const trimmedName = nameInput.value.trim();
                if (!trimmedName || trimmedName.length < 2) {
                  showToast('El nombre del concepto debe tener al menos 2 caracteres', 'error');
                  return;
                }

                const parsedAmount = parseFloat(amountInput.value);
                const validAmount = isNaN(parsedAmount) || parsedAmount < 0 ? undefined : parsedAmount;
                const applyTo = (applyToInput.value as 'pending' | 'all' | 'none') || 'pending';
                const updateCatalog = updateCatalogInput.checked;

                setIsSubmittingEdit(true);
                try {
                  const res = await updateConceptBreakdown({
                    oldConceptName: editingConcept.conceptName,
                    newConceptName: trimmedName,
                    teamId: team?.id,
                    newAmount: validAmount,
                    applyAmountTo: applyTo,
                    updateCatalog,
                  });

                  setEditingConcept(null);
                  showToast(
                    `¡Concepto "${trimmedName}" actualizado (${res.updatedChargesCount} cobros)! Estadísticas recalculadas.`
                  );
                } catch (err) {
                  showToast(
                    err instanceof Error ? err.message : 'Error al actualizar el concepto',
                    'error'
                  );
                } finally {
                  setIsSubmittingEdit(false);
                }
              }}
              className="p-5 sm:p-6 space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  name="conceptName"
                  defaultValue={editingConcept.conceptName}
                  required
                  placeholder="Ej. Arbitraje Fecha 1, Uniforme Oficial, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-emerald-600 focus:ring-2 focus:ring-emerald-200"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Se actualizará el nombre en todos los cobros asignados y en las estadísticas.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Valor o Cuota por Jugador ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    name="conceptAmount"
                    defaultValue={editingConcept.currentAmount || 12000}
                    min="0"
                    step="500"
                    placeholder="12000"
                    className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-emerald-600 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 space-y-2">
                <span className="block font-bold text-gray-800">
                  ¿Cómo aplicar el nuevo valor?
                </span>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyTo"
                    value="pending"
                    defaultChecked
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 block">
                      Aplicar solo a cobros pendientes ({editingConcept.pendingCount} jugadores)
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Recomendado: conserva intactos los cobros que ya fueron pagados.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyTo"
                    value="all"
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 block">
                      Aplicar a todos los cobros ({editingConcept.count} jugadores)
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Modifica tanto pendientes como ya pagados.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="applyTo"
                    value="none"
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-800 block">
                      No modificar valores existentes
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Solo renombrar el concepto manteniendo los montos actuales.
                    </span>
                  </div>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  name="updateCatalog"
                  defaultChecked
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700 font-medium text-[11px]">
                  Sincronizar también con el catálogo de conceptos reutilizables
                </span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingConcept(null)}
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEdit ? (
                    <span>Guardando cambios...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar y Actualizar Estadísticas</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: BORRAR DESGLOSE POR CONCEPTO                  */}
      {/* ==================================================== */}
      {deletingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100 my-auto animate-scale-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white p-5 sm:p-6 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-red-200 border border-white/20 shadow-xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">¿Eliminar Desglose?</h3>
                  <p className="text-xs text-red-100 mt-0.5">
                    Concepto: <b>{deletingConcept.conceptName}</b>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeletingConcept(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="bg-red-50/80 rounded-2xl p-4 border border-red-200 text-red-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Acción irreversible de cobros</span>
                </div>
                <p className="text-[11px] text-red-700 leading-relaxed">
                  Se eliminarán permanentemente los <b>{deletingConcept.count} cobros</b> registrados bajo el concepto <b>"{deletingConcept.conceptName}"</b> por un valor total de <b>{formatCurrency(deletingConcept.totalAmount)}</b>.
                </p>
              </div>

              {/* Breakdown stats preview */}
              <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-2xl p-3 border border-gray-200 text-gray-700">
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Ya Recaudado</span>
                  <span className="text-sm font-black font-mono text-emerald-800">
                    {formatCurrency(deletingConcept.collected)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block font-bold uppercase">Pendiente de Cobro</span>
                  <span className="text-sm font-black font-mono text-amber-700">
                    {formatCurrency(deletingConcept.pending)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                Al confirmar, las estadísticas financieras (Total Recaudado, Pendiente, Tasa de Recaudo) y las deudas individuales de los jugadores se recalcularán de inmediato.
              </p>

              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="deleteFromCatalogCheckboxFinance"
                  defaultChecked
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-gray-700 font-medium text-[11px]">
                  Eliminar también del catálogo de conceptos frecuentes
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeletingConcept(null)}
                  disabled={isSubmittingDelete}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingDelete}
                  onClick={async () => {
                    const cb = document.getElementById('deleteFromCatalogCheckboxFinance') as HTMLInputElement | null;
                    const deleteCatalog = cb ? cb.checked : true;
                    setIsSubmittingDelete(true);
                    try {
                      const res = await deleteConceptBreakdown({
                        conceptName: deletingConcept.conceptName,
                        teamId: team?.id,
                        deleteFromCatalog: deleteCatalog,
                      });
                      const name = deletingConcept.conceptName;
                      setDeletingConcept(null);
                      showToast(
                        `¡Concepto "${name}" y sus ${res.deletedChargesCount} cobros eliminados! Estadísticas actualizadas.`
                      );
                    } catch (err) {
                      showToast(
                        err instanceof Error ? err.message : 'Error al eliminar concepto',
                        'error'
                      );
                    } finally {
                      setIsSubmittingDelete(false);
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingDelete ? (
                    <span>Eliminando cobros...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, Eliminar Concepto y Cobros</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
