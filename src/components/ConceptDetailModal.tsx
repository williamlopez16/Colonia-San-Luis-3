import React, { useState, useMemo } from 'react';
import type { Charge, Player, Match, Team, Concept, PaymentMethod } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import {
  saveCharge,
  deleteCharge,
  saveChargesBatch,
  saveConcept,
  generateUUID,
} from '../services/dataService';
import { formatMatchDate } from '../services/whatsappService';
import {
  X,
  DollarSign,
  PieChart,
  Check,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Edit3,
  Copy,
  Share2,
  Smartphone,
  Banknote,
  CreditCard,
  HelpCircle,
  AlertCircle,
  GraduationCap,
  Calendar,
  Users,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  MessageSquareText,
} from 'lucide-react';

interface ConceptDetailModalProps {
  conceptName: string;
  conceptType: 'arbitraje' | 'esporadico';
  charges: Charge[];
  players: Player[];
  matches: Match[];
  team: Team | null;
  concepts: Concept[];
  onClose: () => void;
  onChargeUpdated?: () => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'Efectivo', label: 'Efectivo', icon: <Banknote className="w-3.5 h-3.5" /> },
  { id: 'Nequi', label: 'Nequi', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'Daviplata', label: 'Daviplata', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'Transferencia', label: 'Transf.', icon: <CreditCard className="w-3.5 h-3.5" /> },
  { id: 'Otro', label: 'Otro', icon: <HelpCircle className="w-3.5 h-3.5" /> },
];

export const ConceptDetailModal: React.FC<ConceptDetailModalProps> = ({
  conceptName,
  conceptType,
  charges,
  players,
  matches,
  team,
  concepts,
  onClose,
  onChargeUpdated,
}) => {
  const { isAdminMode } = useAccessMode();

  // Filter charges strictly for this concept
  const conceptCharges = useMemo(() => {
    return charges
      .filter((c) => c.conceptName.trim().toLowerCase() === conceptName.trim().toLowerCase())
      .sort((a, b) => {
        // Sort by pending first, then by player dorsal
        if (a.status !== b.status) {
          return a.status === 'Pendiente' ? -1 : 1;
        }
        return a.jerseyNumber - b.jerseyNumber;
      });
  }, [charges, conceptName]);

  // Match lookup map
  const matchMap = useMemo(() => new Map(matches.map((m) => [m.id, m])), [matches]);

  // State: Filter and Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'scholarship'>('all');

  // State: Inline Edit Charge Amount
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');

  // State: Inline Method Selector for payment
  const [paymentSelectingChargeId, setPaymentSelectingChargeId] = useState<string | null>(null);

  // State: Inline Edit Charge Note / Motivo
  const [editingNoteChargeId, setEditingNoteChargeId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState<string>('');

  // State: In-app confirmation for deletion
  const [deletingChargeId, setDeletingChargeId] = useState<string | null>(null);

  // State: Add New Charge Form
  const [showAddChargeForm, setShowAddChargeForm] = useState<boolean>(false);
  const [newChargePlayerId, setNewChargePlayerId] = useState<string>('');
  const [newChargeAmount, setNewChargeAmount] = useState<string>('12000');
  const [newChargeStatus, setNewChargeStatus] = useState<'Pendiente' | 'Pagado'>('Pendiente');
  const [newChargeMethod, setNewChargeMethod] = useState<PaymentMethod>('Efectivo');
  const [newChargeIsScholarship, setNewChargeIsScholarship] = useState<boolean>(false);
  const [newChargeNote, setNewChargeNote] = useState<string>('');

  // State: Mass Fee Adjustment Form
  const [showMassFeeAdjust, setShowMassFeeAdjust] = useState<boolean>(false);
  const [massFeeInput, setMassFeeInput] = useState<string>('');

  // State: Edit Concept in Catalog Form
  const [showEditConceptName, setShowEditConceptName] = useState<boolean>(false);
  const [customConceptName, setCustomConceptName] = useState<string>(conceptName);
  const [customSuggestedValue, setCustomSuggestedValue] = useState<string>('');

  // Toast / feedback message
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Metrics computation
  const metrics = useMemo(() => {
    let collected = 0;
    let pending = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let scholarshipCount = 0;

    conceptCharges.forEach((c) => {
      if (c.isScholarship) {
        scholarshipCount += 1;
      }
      if (c.status === 'Pagado') {
        collected += c.amount || 0;
        paidCount += 1;
      } else {
        pending += c.amount || 0;
        pendingCount += 1;
      }
    });

    const total = collected + pending;
    const rate = total > 0 ? Math.round((collected / total) * 100) : 0;

    return {
      collected,
      pending,
      total,
      rate,
      totalCount: conceptCharges.length,
      paidCount,
      pendingCount,
      scholarshipCount,
    };
  }, [conceptCharges]);

  // Filtered displayed charges
  const filteredCharges = useMemo(() => {
    let list = conceptCharges;

    if (statusFilter === 'pending') {
      list = list.filter((c) => c.status === 'Pendiente' && !c.isScholarship);
    } else if (statusFilter === 'paid') {
      list = list.filter((c) => c.status === 'Pagado');
    } else if (statusFilter === 'scholarship') {
      list = list.filter((c) => !!c.isScholarship);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.playerName.toLowerCase().includes(q) ||
          String(c.jerseyNumber).includes(q)
      );
    }

    return list;
  }, [conceptCharges, statusFilter, searchQuery]);

  // Currency Formatter
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // ==========================================
  // HANDLERS FOR INDIVIDUAL CHARGES
  // ==========================================

  // 1. Toggle or Record Payment
  const handleTogglePayment = async (charge: Charge, method: PaymentMethod = 'Efectivo') => {
    if (!isAdminMode) return;
    try {
      if (charge.status === 'Pagado') {
        // Revert to pending
        const updated: Charge = {
          ...charge,
          status: 'Pendiente',
          paymentMethod: undefined,
          paidAt: undefined,
          updatedAt: new Date().toISOString(),
        };
        await saveCharge(updated);
        showToast(`Cobro de ${charge.playerName} marcado como Pendiente`);
      } else {
        // Mark paid
        const updated: Charge = {
          ...charge,
          status: 'Pagado',
          paymentMethod: method,
          paidAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveCharge(updated);
        showToast(`Pago de ${charge.playerName} registrado con éxito (${method})`);
      }
      setPaymentSelectingChargeId(null);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al actualizar pago');
    }
  };

  // 2. Toggle Scholarship / Becado
  const handleToggleScholarship = async (charge: Charge) => {
    if (!isAdminMode) return;
    try {
      const nextScholarship = !charge.isScholarship;
      const updated: Charge = {
        ...charge,
        isScholarship: nextScholarship,
        amount: nextScholarship ? 0 : (charge.amount > 0 ? charge.amount : 12000),
        status: nextScholarship ? 'Pagado' : charge.status,
        updatedAt: new Date().toISOString(),
      };
      await saveCharge(updated);
      showToast(
        nextScholarship
          ? `${charge.playerName} marcado como Becado / Exento ($0)`
          : `Beca removida para ${charge.playerName}`
      );
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al actualizar beca');
    }
  };

  // 3. Save Amount Change
  const handleSaveAmount = async (charge: Charge) => {
    if (!isAdminMode) return;
    const newAmt = parseFloat(editingAmount);
    if (isNaN(newAmt) || newAmt < 0) {
      setErrorMessage('Por favor ingresa un valor numérico válido.');
      return;
    }

    try {
      const updated: Charge = {
        ...charge,
        amount: newAmt,
        updatedAt: new Date().toISOString(),
      };
      await saveCharge(updated);
      setEditingChargeId(null);
      setEditingAmount('');
      showToast(`Monto de ${charge.playerName} actualizado a ${formatCurrency(newAmt)}`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar monto');
    }
  };

  // 4. Delete Charge
  const handleDeleteCharge = async (chargeId: string, playerName: string) => {
    if (!isAdminMode) return;
    try {
      await deleteCharge(chargeId);
      setDeletingChargeId(null);
      showToast(`Cobro de ${playerName} eliminado`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al eliminar cobro');
    }
  };

  // 5. Save Note / Motivo on Charge
  const handleSaveNote = async (charge: Charge) => {
    if (!isAdminMode) return;
    try {
      const updated: Charge = {
        ...charge,
        notes: editingNoteText.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      await saveCharge(updated);
      setEditingNoteChargeId(null);
      setEditingNoteText('');
      showToast(`Nota/mensaje de ${charge.playerName} guardado con éxito`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar la nota');
    }
  };

  // ==========================================
  // HANDLERS FOR MASS ACTIONS & CONCEPT EDITING
  // ==========================================

  // 1. Mark All Pending as Paid
  const handleMarkAllPendingPaid = async () => {
    if (!isAdminMode) return;
    const pendingList = conceptCharges.filter((c) => c.status === 'Pendiente');
    if (pendingList.length === 0) {
      showToast('No hay cobros pendientes por liquidar.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const updatedBatch: Charge[] = pendingList.map((c) => ({
        ...c,
        status: 'Pagado',
        paymentMethod: 'Efectivo',
        paidAt: now,
        updatedAt: now,
      }));

      await saveChargesBatch(updatedBatch);
      showToast(`¡Se marcaron ${pendingList.length} cobros como Pagados con éxito!`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al marcar cobros como pagados');
    }
  };

  // 2. Mass Adjust Fee for all pending charges
  const handleApplyMassFee = async () => {
    if (!isAdminMode) return;
    const val = parseFloat(massFeeInput);
    if (isNaN(val) || val < 0) {
      setErrorMessage('Por favor ingresa un valor válido para la cuota.');
      return;
    }

    const pendingList = conceptCharges.filter((c) => c.status === 'Pendiente' && !c.isScholarship);
    if (pendingList.length === 0) {
      showToast('No hay cobros pendientes regulares para actualizar.');
      setShowMassFeeAdjust(false);
      return;
    }

    try {
      const now = new Date().toISOString();
      const updatedBatch: Charge[] = pendingList.map((c) => ({
        ...c,
        amount: val,
        updatedAt: now,
      }));

      await saveChargesBatch(updatedBatch);
      setShowMassFeeAdjust(false);
      setMassFeeInput('');
      showToast(`¡Cuota ajustada a ${formatCurrency(val)} para ${pendingList.length} jugadores!`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al ajustar cuotas masivamente');
    }
  };

  // 3. Add New Charge for this concept
  const handleAddNewCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminMode) return;
    if (!newChargePlayerId) {
      setErrorMessage('Debes seleccionar un jugador.');
      return;
    }

    const amt = parseFloat(newChargeAmount);
    if (isNaN(amt) || amt < 0) {
      setErrorMessage('El monto debe ser un número válido.');
      return;
    }

    const targetPlayer = players.find((p) => p.id === newChargePlayerId);
    if (!targetPlayer) {
      setErrorMessage('Jugador no encontrado.');
      return;
    }

    try {
      const now = new Date().toISOString();
      const newCharge: Charge = {
        id: generateUUID(),
        teamId: team?.id || '',
        playerId: targetPlayer.id,
        playerName: targetPlayer.fullName,
        jerseyNumber: targetPlayer.jerseyNumber,
        conceptName: conceptName,
        type: conceptType,
        amount: newChargeIsScholarship ? 0 : amt,
        status: newChargeIsScholarship ? 'Pagado' : newChargeStatus,
        paymentMethod: newChargeStatus === 'Pagado' && !newChargeIsScholarship ? newChargeMethod : undefined,
        isScholarship: newChargeIsScholarship,
        notes: newChargeNote.trim() || undefined,
        paidAt: newChargeStatus === 'Pagado' ? now : undefined,
        createdAt: now,
        updatedAt: now,
      };

      await saveCharge(newCharge);
      setShowAddChargeForm(false);
      setNewChargePlayerId('');
      setNewChargeAmount('12000');
      setNewChargeIsScholarship(false);
      setNewChargeNote('');
      showToast(`¡Cobro agregado para ${targetPlayer.fullName}!`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al agregar cobro');
    }
  };

  // 4. Edit Concept Name & Suggested Value in catalog
  const handleSaveConceptCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminMode || !team) return;

    const trimmedName = customConceptName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('El nombre del concepto debe tener al menos 2 caracteres.');
      return;
    }

    const suggested = parseFloat(customSuggestedValue);
    const validSuggested = isNaN(suggested) || suggested < 0 ? 0 : suggested;

    try {
      // 1. If catalog item exists, update or create it
      const existingInCatalog = concepts.find(
        (c) => c.name.toLowerCase() === conceptName.toLowerCase()
      );

      const conceptToSave: Concept = {
        id: existingInCatalog?.id || generateUUID(),
        teamId: team.id,
        name: trimmedName,
        suggestedValue: validSuggested || existingInCatalog?.suggestedValue || 12000,
        isDefaultArbitration: existingInCatalog?.isDefaultArbitration || false,
        createdAt: existingInCatalog?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveConcept(conceptToSave);

      // 2. If name changed, batch update charges with old name
      if (trimmedName.toLowerCase() !== conceptName.toLowerCase()) {
        const chargesToRename = conceptCharges.map((c) => ({
          ...c,
          conceptName: trimmedName,
          updatedAt: new Date().toISOString(),
        }));
        await saveChargesBatch(chargesToRename);
      }

      setShowEditConceptName(false);
      showToast(`¡Concepto "${trimmedName}" actualizado con éxito!`);
      onChargeUpdated?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar cambios de concepto');
    }
  };

  // 5. WhatsApp Summary Generator
  const handleCopyWhatsAppSummary = () => {
    const teamTitle = team?.name || 'Club San Luis';
    const lines: string[] = [];

    lines.push(`📊 *REPORTE DE COBROS: ${conceptName.toUpperCase()}*`);
    lines.push(`⚽ Club: *${teamTitle}*`);
    lines.push(`💰 Total facturado: ${formatCurrency(metrics.total)}`);
    lines.push(`✅ Recaudado: ${formatCurrency(metrics.collected)} (${metrics.paidCount} jugadores)`);
    lines.push(`⏳ Pendiente: ${formatCurrency(metrics.pending)} (${metrics.pendingCount} jugadores)`);
    if (metrics.scholarshipCount > 0) {
      lines.push(`🎓 Becados / Exentos: ${metrics.scholarshipCount} jugadores`);
    }
    lines.push('');

    const pendingList = conceptCharges.filter((c) => c.status === 'Pendiente' && !c.isScholarship);
    if (pendingList.length > 0) {
      lines.push(`🔴 *PENDIENTES POR PAGAR (${pendingList.length}):*`);
      pendingList.forEach((c) => {
        lines.push(`• #${c.jerseyNumber} ${c.playerName} — ${formatCurrency(c.amount)}`);
      });
      lines.push('');
    }

    const paidList = conceptCharges.filter((c) => c.status === 'Pagado');
    if (paidList.length > 0) {
      lines.push(`🟢 *PAGADOS (${paidList.length}):*`);
      paidList.forEach((c) => {
        const methodStr = c.paymentMethod ? ` (${c.paymentMethod})` : '';
        const becadoStr = c.isScholarship ? ' 🎓 Becado' : '';
        lines.push(`• #${c.jerseyNumber} ${c.playerName}${becadoStr}${methodStr}`);
      });
      lines.push('');
    }

    lines.push('Por favor realizar los pagos correspondientes y enviar el comprobante de pago al DT. ¡Muchas gracias! 🟢⚪');

    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    showToast('¡Resumen de WhatsApp copiado al portapapeles!');
  };

  // Individual WhatsApp Reminder
  const handleSendIndividualWhatsApp = (charge: Charge) => {
    const teamTitle = team?.name || 'Club San Luis';
    const targetPlayer = players.find((p) => p.id === charge.playerId);
    if (!targetPlayer?.phone) {
      setErrorMessage('Este jugador no tiene teléfono registrado.');
      return;
    }

    const lines: string[] = [];
    lines.push(`👋 Hola ${charge.playerName}, te escribimos de *${teamTitle}*:`);
    lines.push('');
    lines.push(`💰 Tienes pendiente el pago de *${charge.conceptName}*:`);
    lines.push(`💵 *Valor a pagar: ${formatCurrency(charge.amount)}*`);
    if (charge.type === 'arbitraje' && charge.matchId) {
      const m = matchMap.get(charge.matchId);
      if (m) {
        lines.push(`⚽ Partido vs. ${m.rival} (${formatMatchDate(m.date)})`);
      }
    }
    lines.push('');
    lines.push('Por favor realiza tu pago a través de Nequi / Daviplata / Efectivo y envía el comprobante de pago. ¡Muchas gracias!');

    const message = encodeURIComponent(lines.join('\n'));
    const phoneClean = targetPlayer.phone.replace(/\D/g, '');
    const url = `https://wa.me/57${phoneClean}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100 my-auto">
        {/* ==================================================== */}
        {/* MODAL HEADER                                         */}
        {/* ==================================================== */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-850 to-emerald-950 text-white p-5 sm:p-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20 shadow-xs">
                {conceptType === 'arbitraje' ? (
                  <span className="text-2xl">⚽</span>
                ) : (
                  <PieChart className="w-6 h-6 text-emerald-300" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-lg sm:text-xl leading-tight truncate">
                    {conceptName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/90 text-emerald-200 border border-emerald-600/60">
                    {conceptType === 'arbitraje' ? 'Arbitraje Oficial' : 'Cobro Esporádico'}
                  </span>
                  {isAdminMode && (
                    <button
                      type="button"
                      onClick={() => setShowEditConceptName(!showEditConceptName)}
                      className="text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer"
                      title="Editar nombre y configuración de este concepto"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Editar Concepto</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-emerald-200 mt-1 flex items-center gap-2">
                  <span>{conceptCharges.length} cobros registrados</span>
                  <span>•</span>
                  <span>{metrics.paidCount} pagados</span>
                  <span>•</span>
                  <span className={metrics.pendingCount > 0 ? 'text-amber-300 font-bold' : ''}>
                    {metrics.pendingCount} pendientes
                  </span>
                  {metrics.scholarshipCount > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-purple-200 font-bold">
                        🎓 {metrics.scholarshipCount} becados
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer flex-shrink-0"
              title="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Quick Metrics Bar inside Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-700/60">
            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Total Facturado</span>
              <span className="text-base sm:text-lg font-black font-mono">{formatCurrency(metrics.total)}</span>
            </div>

            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Recaudado Real</span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-200">{formatCurrency(metrics.collected)}</span>
            </div>

            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Falta por Cobrar</span>
              <span className={`text-base sm:text-lg font-black font-mono ${metrics.pending > 0 ? 'text-amber-300' : 'text-emerald-300'}`}>
                {formatCurrency(metrics.pending)}
              </span>
            </div>

            <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-700/40">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block">Efectividad</span>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black font-mono">{metrics.rate}%</span>
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${metrics.rate}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* TOAST & FEEDBACK MESSAGES                            */}
        {/* ==================================================== */}
        {feedbackMessage && (
          <div className="p-3 bg-emerald-50 text-emerald-800 border-b border-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in flex-shrink-0">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 text-red-700 border-b border-red-200 text-xs font-bold flex items-center justify-between gap-2 animate-fade-in flex-shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-800 font-bold hover:underline cursor-pointer text-[11px]"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* EDIT CONCEPT IN CATALOG SUB-FORM (ADMIN)             */}
        {/* ==================================================== */}
        {showEditConceptName && isAdminMode && (
          <form
            onSubmit={handleSaveConceptCatalog}
            className="p-4 bg-emerald-50/90 border-b border-emerald-200 flex flex-wrap items-center gap-3 animate-fade-in flex-shrink-0 text-xs"
          >
            <div className="flex-1 min-w-[180px]">
              <label className="block text-[11px] font-bold text-emerald-950 mb-1">Nombre del Concepto:</label>
              <input
                type="text"
                value={customConceptName}
                onChange={(e) => setCustomConceptName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-emerald-600"
                placeholder="Nombre del concepto"
                required
              />
            </div>

            <div className="w-32">
              <label className="block text-[11px] font-bold text-emerald-950 mb-1">Valor Sugerido:</label>
              <input
                type="number"
                min="0"
                step="500"
                value={customSuggestedValue}
                onChange={(e) => setCustomSuggestedValue(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-mono font-bold text-gray-900 focus:outline-emerald-600"
                placeholder="Ej. 12000"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs cursor-pointer transition"
              >
                Guardar Cambios
              </button>
              <button
                type="button"
                onClick={() => setShowEditConceptName(false)}
                className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* MASS ADJUST FEE SUB-FORM (ADMIN)                     */}
        {/* ==================================================== */}
        {showMassFeeAdjust && isAdminMode && (
          <div className="p-4 bg-amber-50/90 border-b border-amber-200 flex flex-wrap items-center gap-3 animate-fade-in flex-shrink-0 text-xs">
            <span className="font-bold text-amber-950">
              Ajustar cuota a todos los {metrics.pendingCount} cobros pendientes de "{conceptName}":
            </span>
            <div className="flex items-center gap-1.5 bg-white border border-gray-300 rounded-xl px-2.5 py-1">
              <span className="font-bold text-gray-400">$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={massFeeInput}
                onChange={(e) => setMassFeeInput(e.target.value)}
                placeholder="Ej. 10000"
                className="w-24 text-xs font-mono font-bold text-gray-900 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyMassFee}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer transition shadow-2xs"
            >
              Aplicar a Pendientes
            </button>
            <button
              type="button"
              onClick={() => setShowMassFeeAdjust(false)}
              className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900 font-semibold cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* ==================================================== */}
        {/* ADD NEW CHARGE INLINE FORM (ADMIN)                   */}
        {/* ==================================================== */}
        {showAddChargeForm && isAdminMode && (
          <form
            onSubmit={handleAddNewCharge}
            className="p-4 bg-emerald-50/90 border-b border-emerald-200 space-y-3 animate-fade-in flex-shrink-0 text-xs"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-700" />
                <span>Cobrar "{conceptName}" a un Jugador</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddChargeForm(false)}
                className="text-gray-500 hover:text-gray-800 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Select Player */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Jugador *</label>
                <select
                  value={newChargePlayerId}
                  onChange={(e) => setNewChargePlayerId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-emerald-600"
                  required
                >
                  <option value="">-- Selecciona un jugador --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      #{p.jerseyNumber} {p.fullName} {p.isScholarship ? '(🎓 Becado)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Monto ($ COP) *</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={newChargeAmount}
                  onChange={(e) => setNewChargeAmount(e.target.value)}
                  disabled={newChargeIsScholarship}
                  className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white font-mono font-bold text-gray-900 focus:outline-emerald-600 disabled:opacity-50"
                  required
                />
              </div>

              {/* Status and Scholarship */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Estado de Pago</label>
                <div className="flex items-center gap-2">
                  <select
                    value={newChargeStatus}
                    onChange={(e) => setNewChargeStatus(e.target.value as 'Pendiente' | 'Pagado')}
                    disabled={newChargeIsScholarship}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white font-bold text-gray-900 focus:outline-emerald-600 disabled:opacity-50"
                  >
                    <option value="Pendiente">Pendiente (Debe)</option>
                    <option value="Pagado">Pagado</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      const next = !newChargeIsScholarship;
                      setNewChargeIsScholarship(next);
                      if (next) {
                        setNewChargeAmount('0');
                        setNewChargeStatus('Pagado');
                      } else {
                        setNewChargeAmount('12000');
                        setNewChargeStatus('Pendiente');
                      }
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1 ${
                      newChargeIsScholarship
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-50 hover:text-purple-900'
                    }`}
                    title="Marcar como becado / exento ($0)"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{newChargeIsScholarship ? 'Becado ($0)' : 'Beca'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Note / Message input */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Nota / Mensaje Opcional (ej. motivo de beca o acuerdo):
              </label>
              <input
                type="text"
                value={newChargeNote}
                onChange={(e) => setNewChargeNote(e.target.value)}
                placeholder="Escribe algún motivo o nota explicativa..."
                className="w-full px-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-medium text-gray-900 focus:outline-emerald-600"
              />
            </div>

            {/* Method selector if status is Pagado */}
            {newChargeStatus === 'Pagado' && !newChargeIsScholarship && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-gray-700">Método de Pago:</span>
                <div className="flex items-center gap-1.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setNewChargeMethod(m.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                        newChargeMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-200">
              <button
                type="button"
                onClick={() => setShowAddChargeForm(false)}
                className="px-3 py-1.5 rounded-xl text-gray-600 font-bold hover:bg-emerald-100/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition shadow-2xs"
              >
                Guardar Cobro
              </button>
            </div>
          </form>
        )}

        {/* ==================================================== */}
        {/* TOOLBAR & SEARCH                                     */}
        {/* ==================================================== */}
        <div className="p-3.5 sm:p-4 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0">
          {/* Left: Filters and Search */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar jugador o dorsal..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-300 bg-white text-xs font-bold text-gray-800 focus:outline-emerald-500"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                Todos ({conceptCharges.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                Pendientes ({metrics.pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                  statusFilter === 'paid'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                Pagados ({metrics.paidCount})
              </button>

              {metrics.scholarshipCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('scholarship')}
                  className={`px-2.5 py-1.5 rounded-xl font-bold cursor-pointer transition ${
                    statusFilter === 'scholarship'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-white hover:bg-purple-50 text-purple-800 border border-purple-200'
                  }`}
                >
                  🎓 Becados ({metrics.scholarshipCount})
                </button>
              )}
            </div>
          </div>

          {/* Right: Admin Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleCopyWhatsAppSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-bold transition cursor-pointer shadow-2xs"
              title="Copiar balance y listado de este concepto para WhatsApp"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-700" />
              <span>Resumen WhatsApp</span>
            </button>

            {isAdminMode && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddChargeForm(!showAddChargeForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Cobro</span>
                </button>

                {metrics.pendingCount > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowMassFeeAdjust(!showMassFeeAdjust)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition cursor-pointer"
                      title="Cambiar la cuota de todos los pendientes a la vez"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Ajustar Cuota</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkAllPendingPaid}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 text-xs font-bold transition cursor-pointer"
                      title="Liquidar todos los pendientes como pagados en Efectivo"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Liquidar Todos</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* CHARGES LIST / CARDS CONTAINER                      */}
        {/* ==================================================== */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2.5">
          {filteredCharges.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs space-y-2">
              <p className="font-semibold text-sm text-gray-500">
                No se encontraron cobros con los filtros actuales.
              </p>
              <p className="text-gray-400">
                Prueba cambiando los filtros o utiliza el botón "+ Agregar Cobro" para asignar este concepto a un jugador.
              </p>
            </div>
          ) : (
            filteredCharges.map((charge) => {
              const isEditingThis = editingChargeId === charge.id;
              const isEditingThisNote = editingNoteChargeId === charge.id;
              const isSelectingMethod = paymentSelectingChargeId === charge.id;
              const isDeletingThis = deletingChargeId === charge.id;
              const match = charge.matchId ? matchMap.get(charge.matchId) : null;

              return (
                <div
                  key={charge.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                    charge.isScholarship
                      ? 'bg-purple-50/50 border-purple-200 shadow-2xs'
                      : charge.status === 'Pagado'
                      ? 'bg-white border-emerald-200/90 shadow-2xs'
                      : 'bg-amber-50/40 border-amber-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Left: Player Info & Match Reference */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gray-900 text-white font-mono font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                        {charge.jerseyNumber}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-sm text-gray-900 truncate">
                            {charge.playerName}
                          </h4>

                          {charge.isScholarship && (
                            <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                              🎓 Becado / Exento
                            </span>
                          )}

                          {charge.status === 'Pagado' && !charge.isScholarship && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ✓ Pagado
                              {charge.paymentMethod && ` (${charge.paymentMethod})`}
                            </span>
                          )}

                          {charge.status === 'Pendiente' && !charge.isScholarship && (
                            <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                              ⏳ Debe cuota
                            </span>
                          )}
                        </div>

                        {/* Match or Date details */}
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                          {match ? (
                            <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                              ⚽ vs. {match.rival} ({formatMatchDate(match.date)})
                            </span>
                          ) : (
                            <span>Registrado el {formatMatchDate(charge.createdAt.slice(0, 10))}</span>
                          )}

                          {charge.paidAt && (
                            <span className="text-gray-400">
                              • Pagado el {formatMatchDate(charge.paidAt.slice(0, 10))}
                            </span>
                          )}
                        </div>

                        {/* Note / Becado Motivo Display or Inline Editor */}
                        {isEditingThisNote ? (
                          <div className="mt-2 flex items-center gap-1.5 bg-white border border-purple-400 rounded-xl px-2.5 py-1.5 shadow-2xs animate-fade-in w-full max-w-md">
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                            <input
                              type="text"
                              value={editingNoteText}
                              onChange={(e) => setEditingNoteText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveNote(charge);
                                if (e.key === 'Escape') setEditingNoteChargeId(null);
                              }}
                              placeholder="Motivo de beca o mensaje del pago..."
                              autoFocus
                              className="flex-1 text-xs font-medium text-gray-900 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveNote(charge)}
                              className="p-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                              title="Guardar nota"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingNoteChargeId(null)}
                              className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
                              title="Cancelar"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                            {charge.notes ? (
                              <div
                                onClick={() => {
                                  if (isAdminMode) {
                                    setEditingNoteChargeId(charge.id);
                                    setEditingNoteText(charge.notes || '');
                                  }
                                }}
                                className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition ${
                                  charge.isScholarship
                                    ? 'text-purple-950 bg-purple-50/90 border-purple-200 hover:border-purple-400'
                                    : 'text-gray-800 bg-gray-50 border-gray-200 hover:border-gray-400'
                                } ${isAdminMode ? 'cursor-pointer hover:shadow-2xs' : ''}`}
                                title={isAdminMode ? 'Click para editar esta nota' : undefined}
                              >
                                <MessageSquare className="w-3 h-3 text-purple-600 flex-shrink-0" />
                                <span>Nota: <strong>"{charge.notes}"</strong></span>
                                {isAdminMode && <Edit2 className="w-2.5 h-2.5 text-gray-400 ml-1 opacity-60" />}
                              </div>
                            ) : isAdminMode ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteChargeId(charge.id);
                                  setEditingNoteText('');
                                }}
                                className="text-[10px] text-gray-400 hover:text-purple-700 hover:bg-purple-50 px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-1 border border-dashed border-gray-200"
                                title="Agregar nota o motivo (ej. por qué fue becado)"
                              >
                                <MessageSquare className="w-2.5 h-2.5" />
                                <span>+ Nota/Motivo</span>
                              </button>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions, Amount & Payment controls */}
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {/* Amount Box (editable if admin) */}
                      {isEditingThis ? (
                        <div className="flex items-center gap-1 bg-white border border-emerald-500 rounded-xl px-2 py-1 shadow-2xs animate-fade-in">
                          <span className="text-xs font-bold text-gray-400">$</span>
                          <input
                            type="number"
                            min="0"
                            step="500"
                            value={editingAmount}
                            onChange={(e) => setEditingAmount(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveAmount(charge);
                              if (e.key === 'Escape') setEditingChargeId(null);
                            }}
                            autoFocus
                            className="w-20 text-xs font-mono font-bold text-gray-900 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveAmount(charge)}
                            className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            title="Guardar nuevo monto"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingChargeId(null)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span
                            className={`font-mono font-black text-sm sm:text-base ${
                              charge.isScholarship
                                ? 'text-purple-900'
                                : charge.status === 'Pagado'
                                ? 'text-emerald-800'
                                : 'text-amber-800'
                            }`}
                          >
                            {formatCurrency(charge.amount)}
                          </span>

                          {isAdminMode && !charge.isScholarship && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChargeId(charge.id);
                                setEditingAmount(String(charge.amount));
                              }}
                              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition cursor-pointer"
                              title="Editar valor de este cobro"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Admin Mode Payment Toggle Button */}
                      {isAdminMode && (
                        <>
                          {/* Toggle Becado Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleScholarship(charge)}
                            className={`px-2 py-1 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1 ${
                              charge.isScholarship
                                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                : 'bg-white hover:bg-purple-50 text-gray-600 hover:text-purple-800 border-gray-300'
                            }`}
                            title={charge.isScholarship ? 'Quitar beca' : 'Marcar becado ($0)'}
                          >
                            <GraduationCap className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{charge.isScholarship ? 'Becado' : 'Beca'}</span>
                          </button>

                          {/* Payment Status Switcher */}
                          {!charge.isScholarship && (
                            <>
                              {isSelectingMethod ? (
                                <div className="flex items-center gap-1 bg-white border border-emerald-400 rounded-xl p-1 shadow-xs animate-fade-in">
                                  {PAYMENT_METHODS.map((method) => (
                                    <button
                                      key={method.id}
                                      type="button"
                                      onClick={() => handleTogglePayment(charge, method.id)}
                                      className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-950 transition cursor-pointer"
                                    >
                                      {method.label}
                                    </button>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => setPaymentSelectingChargeId(null)}
                                    className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (charge.status === 'Pendiente') {
                                      setPaymentSelectingChargeId(charge.id);
                                    } else {
                                      handleTogglePayment(charge);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                                    charge.status === 'Pagado'
                                      ? 'bg-emerald-100 hover:bg-amber-100 text-emerald-900 hover:text-amber-900 border-emerald-300 hover:border-amber-300'
                                      : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 shadow-2xs'
                                  }`}
                                  title={
                                    charge.status === 'Pagado'
                                      ? 'Click para revertir a Pendiente'
                                      : 'Click para registrar pago recibido'
                                  }
                                >
                                  {charge.status === 'Pagado' ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                                      <span>Pagado</span>
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-3.5 h-3.5" />
                                      <span>Registrar Pago</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </>
                          )}

                          {/* Individual WhatsApp reminder if pending */}
                          {charge.status === 'Pendiente' && !charge.isScholarship && (
                            <button
                              type="button"
                              onClick={() => handleSendIndividualWhatsApp(charge)}
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                              title="Enviar cobro a WhatsApp del jugador"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Charge Button */}
                          {isDeletingThis ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded-xl p-1 animate-fade-in text-[11px]">
                              <span className="font-bold text-red-900 px-1">¿Eliminar?</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCharge(charge.id, charge.playerName)}
                                className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                              >
                                Sí
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingChargeId(null)}
                                className="px-1.5 py-0.5 text-gray-500 font-bold hover:text-gray-800 cursor-pointer"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingChargeId(charge.id)}
                              className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="Eliminar este cobro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}

                      {/* Read-Only Status Indicator for Player Mode */}
                      {!isAdminMode && (
                        <div className="flex items-center gap-1.5">
                          {charge.isScholarship ? (
                            <span className="text-xs font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-xl">
                              🎓 Becado ($0)
                            </span>
                          ) : charge.status === 'Pagado' ? (
                            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Pagado</span>
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Pendiente</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ==================================================== */}
        {/* MODAL FOOTER                                         */}
        {/* ==================================================== */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 text-xs">
          <div className="text-gray-500">
            {isAdminMode ? (
              <span>
                💡 Puedes editar valores, registrar pagos directos, marcar becados o ajustar cuotas masivas.
              </span>
            ) : (
              <span>
                👀 Consulta libre en <strong>Modo Jugador</strong> (solo lectura).
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition cursor-pointer"
          >
            Cerrar Detalle
          </button>
        </div>
      </div>
    </div>
  );
};
