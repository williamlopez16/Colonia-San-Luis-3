import React, { useState, useMemo } from 'react';
import type { Team, Match, Callup, Charge, PaymentMethod, Player } from '../types';
import { TeamCrest } from './TeamCrest';
import { formatMatchDate } from '../services/whatsappService';
import { saveMatch, saveChargesBatch, getLocalCharges } from '../services/dataService';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  Users,
  Check,
  X,
  Wallet,
  Calendar,
  Trophy,
  ArrowRight,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Clock,
  GraduationCap,
  MessageSquare,
  MessageSquareText,
  UserCheck,
  User,
  Plus,
} from 'lucide-react';

interface PostMatchModalProps {
  team: Team | null;
  match: Match;
  players?: Player[];
  onClose: () => void;
  onSaved?: () => void;
}

interface PlayerPostMatchState {
  playerId: string;
  fullName: string;
  jerseyNumber: number;
  phone: string;
  originalStatus: string;
  attended: boolean; // ¿Asistió a la cancha?
  isScholarship: boolean; // ¿Marcado como Becado / Exento de cuota?
  arbitrationPaid: boolean; // ¿Pagó o cubrió su cuota?
  arbitrationAmount: number; // Monto aportado (editable, puede ser mayor o menor)
  paymentMethod: PaymentMethod;
  notes?: string; // Nota / mensaje / motivo de beca o aporte ese día
}

export const PostMatchModal: React.FC<PostMatchModalProps> = ({
  team,
  match,
  players = [],
  onClose,
  onSaved,
}) => {
  // Parse default fee from match.refereeFee (e.g. "$120.000" or "$12.000")
  const defaultTotalFee = useMemo(() => {
    if (!match.refereeFee) return 120000;
    const clean = match.refereeFee.replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) || num === 0 ? 120000 : num;
  }, [match.refereeFee]);

  const [totalRefereeCost, setTotalRefereeCost] = useState<number>(defaultTotalFee);

  // Initial fee per player (default e.g. 10000)
  const initialPerPlayer = useMemo(() => {
    if (match.postMatchFeePerPlayer && match.postMatchFeePerPlayer > 0) {
      return match.postMatchFeePerPlayer;
    }
    const confirmedCount = match.callups.filter((c) => c.status === 'Confirmado').length;
    if (confirmedCount > 0 && defaultTotalFee > 0) {
      return Math.ceil(defaultTotalFee / confirmedCount / 500) * 500;
    }
    return 10000;
  }, [match.postMatchFeePerPlayer, match.callups, defaultTotalFee]);

  const [feePerPlayer, setFeePerPlayer] = useState<number>(initialPerPlayer);

  // Nombre de quien recogió ese día el arbitraje
  const [refereeCollectorName, setRefereeCollectorName] = useState<string>(
    match.refereeCollectorName || ''
  );

  // Sugerencias rápidas para quien recogió el arbitraje
  const suggestedCollectors = useMemo(() => {
    const list: string[] = [];
    // Capitán del equipo si existe
    const captains = players.filter((p) => p.isCaptain);
    captains.forEach((c) => {
      list.push(`${c.fullName} (Capitán)`);
    });
    // Jugadores que asistieron a este partido
    match.callups.forEach((c) => {
      if (!list.some((item) => item.startsWith(c.fullName))) {
        list.push(c.fullName);
      }
    });
    // Roles comunes
    if (!list.some((item) => item.includes('DT') || item.includes('Director'))) {
      list.push('Director Técnico (DT)');
    }
    return list.slice(0, 8);
  }, [players, match.callups]);

  // Selected player from catalog to add on the fly if they arrived without callup
  const [selectedNewPlayerId, setSelectedNewPlayerId] = useState<string>('');

  // Initialize player post-match state: Confirmados FIRST, others at the end
  const [playersState, setPlayersState] = useState<PlayerPostMatchState[]>(() => {
    const existingCharges = getLocalCharges();

    // Sort callups: 'Confirmado' first (by jerseyNumber), then non-confirmed (by jerseyNumber)
    const sortedCallups = [...match.callups].sort((a, b) => {
      const aConf = a.status === 'Confirmado' ? 0 : 1;
      const bConf = b.status === 'Confirmado' ? 0 : 1;
      if (aConf !== bConf) return aConf - bConf;
      return a.jerseyNumber - b.jerseyNumber;
    });

    return sortedCallups.map((c) => {
      const matchingMaster = players.find((p) => p.id === c.playerId);
      const isBecado = c.isScholarship !== undefined
        ? c.isScholarship
        : !!matchingMaster?.isScholarship;

      const wasAttended = c.attended !== undefined ? c.attended : c.status === 'Confirmado';
      const wasPaid = c.arbitrationPaid !== undefined ? c.arbitrationPaid : (isBecado ? true : false);
      const amount = isBecado
        ? (c.arbitrationAmount !== undefined ? c.arbitrationAmount : 0)
        : (c.arbitrationAmount !== undefined && c.arbitrationAmount >= 0 ? c.arbitrationAmount : initialPerPlayer);
      const method = c.arbitrationMethod || 'Efectivo';
      const existingCharge = existingCharges.find((ch: Charge) => ch.matchId === match.id && ch.playerId === c.playerId);
      const note = c.arbitrationNote || existingCharge?.notes || '';

      return {
        playerId: c.playerId,
        fullName: c.fullName,
        jerseyNumber: c.jerseyNumber,
        phone: c.phone,
        originalStatus: c.status,
        attended: wasAttended,
        isScholarship: isBecado,
        arbitrationPaid: wasPaid,
        arbitrationAmount: amount,
        paymentMethod: method,
        notes: note,
      };
    });
  });

  // Available players from team catalog who weren't in the initial callups
  const availableUncalledPlayers = useMemo(() => {
    return players
      .filter((p) => p.status === 'Activo' && !playersState.some((s) => s.playerId === p.id))
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }, [players, playersState]);

  // Handler to add a player who arrived unexpectedly
  const handleAddUncalledPlayer = (playerIdToAdd: string) => {
    const found = players.find((p) => p.id === playerIdToAdd);
    if (!found) return;

    const newPlayerState: PlayerPostMatchState = {
      playerId: found.id,
      fullName: found.fullName,
      jerseyNumber: found.jerseyNumber,
      phone: found.phone || '',
      originalStatus: 'No convocado',
      attended: true, // Marked attended immediately since they arrived to play
      isScholarship: !!found.isScholarship,
      arbitrationPaid: !!found.isScholarship,
      arbitrationAmount: found.isScholarship ? 0 : feePerPlayer,
      paymentMethod: 'Efectivo',
      notes: 'Llegó a jugar el partido sin previa convocatoria',
    };

    setPlayersState((prev) => [...prev, newPlayerState]);
    setSelectedNewPlayerId('');
  };

  // Track which player note inputs are explicitly opened
  const [openNotePlayerIds, setOpenNotePlayerIds] = useState<Set<string>>(() => {
    // Open by default if player already has a note or is becado
    const initialSet = new Set<string>();
    match.callups.forEach((c) => {
      if (c.arbitrationNote || c.isScholarship) {
        initialSet.add(c.playerId);
      }
    });
    return initialSet;
  });

  const togglePlayerNoteOpen = (playerId: string) => {
    setOpenNotePlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  const handleChangePlayerNote = (playerId: string, note: string) => {
    setPlayersState((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, notes: note } : p))
    );
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time calculated counters
  const totalAttended = useMemo(
    () => playersState.filter((p) => p.attended).length,
    [playersState]
  );

  const totalAbsentAfterConfirm = useMemo(
    () => playersState.filter((p) => p.originalStatus === 'Confirmado' && !p.attended).length,
    [playersState]
  );

  const totalBecadosCount = useMemo(
    () => playersState.filter((p) => p.attended && p.isScholarship).length,
    [playersState]
  );

  const totalPaidCount = useMemo(
    () => playersState.filter((p) => p.attended && p.arbitrationPaid && !p.isScholarship).length,
    [playersState]
  );

  const totalPendingCount = useMemo(
    () => playersState.filter((p) => p.attended && !p.arbitrationPaid && !p.isScholarship).length,
    [playersState]
  );

  // Sum of money actually collected (sum of custom amounts paid by attended players)
  const totalCollectedMoney = useMemo(
    () => playersState
      .filter((p) => p.attended && p.arbitrationPaid)
      .reduce((sum, p) => sum + (p.arbitrationAmount || 0), 0),
    [playersState]
  );

  const totalPendingMoney = useMemo(
    () => playersState
      .filter((p) => p.attended && !p.arbitrationPaid && !p.isScholarship)
      .reduce((sum, p) => sum + (p.arbitrationAmount || 0), 0),
    [playersState]
  );

  const balanceMoney = totalCollectedMoney - totalRefereeCost;

  // Separate into Confirmed (First) and Non-Confirmed/Pending (Last)
  const confirmedPlayersList = useMemo(
    () => playersState.filter((p) => p.originalStatus === 'Confirmado'),
    [playersState]
  );

  const unconfirmedPlayersList = useMemo(
    () => playersState.filter((p) => p.originalStatus !== 'Confirmado'),
    [playersState]
  );

  // Mass action: Toggle all confirmed as attended
  const handleMarkAllAttended = () => {
    setPlayersState((prev) =>
      prev.map((p) => ({
        ...p,
        attended: p.originalStatus === 'Confirmado',
      }))
    );
  };

  // Mass action: Mark all attendees as paid
  const handleMarkAllPaid = () => {
    setPlayersState((prev) =>
      prev.map((p) => ({
        ...p,
        arbitrationPaid: p.attended ? true : p.arbitrationPaid,
        arbitrationAmount: p.isScholarship ? 0 : (p.arbitrationAmount > 0 ? p.arbitrationAmount : feePerPlayer),
      }))
    );
  };

  // Mass action: Reset all non-becados to standard feePerPlayer
  const handleResetStandardFee = () => {
    setPlayersState((prev) =>
      prev.map((p) => ({
        ...p,
        arbitrationAmount: p.isScholarship ? 0 : feePerPlayer,
      }))
    );
  };

  // Auto calculate fee per paying attendee (excluding becados)
  const handleAutoCalculateFee = () => {
    const payingAttendees = playersState.filter((p) => p.attended && !p.isScholarship).length;
    if (payingAttendees > 0 && totalRefereeCost > 0) {
      const perPlayer = Math.ceil(totalRefereeCost / payingAttendees / 500) * 500;
      setFeePerPlayer(perPlayer);
      setPlayersState((prev) =>
        prev.map((p) => ({
          ...p,
          arbitrationAmount: p.isScholarship ? 0 : perPlayer,
        }))
      );
    }
  };

  // Single player toggle attendance
  const handleToggleAttendance = (playerId: string) => {
    setPlayersState((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const nextAttended = !p.attended;
        return {
          ...p,
          attended: nextAttended,
          arbitrationPaid: nextAttended ? p.arbitrationPaid : false,
        };
      })
    );
  };

  // Single player toggle scholarship (Becado)
  const handleToggleBecado = (playerId: string) => {
    setPlayersState((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        const nextBecado = !p.isScholarship;
        return {
          ...p,
          isScholarship: nextBecado,
          arbitrationAmount: nextBecado ? 0 : feePerPlayer,
          arbitrationPaid: nextBecado ? true : p.arbitrationPaid,
        };
      })
    );
    // Automatically open the note section for this player so admin can specify the motivo
    setOpenNotePlayerIds((prev) => new Set(prev).add(playerId));
  };

  // Single player custom amount change
  const handleChangePlayerAmount = (playerId: string, val: number) => {
    const safeVal = Math.max(0, isNaN(val) ? 0 : val);
    setPlayersState((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        return {
          ...p,
          arbitrationAmount: safeVal,
          isScholarship: safeVal === 0 ? p.isScholarship : false,
        };
      })
    );
  };

  // Single player toggle arbitration paid
  const handleTogglePaid = (playerId: string) => {
    setPlayersState((prev) =>
      prev.map((p) => {
        if (p.playerId !== playerId) return p;
        return {
          ...p,
          arbitrationPaid: !p.arbitrationPaid,
        };
      })
    );
  };

  // Single player method change
  const handleChangeMethod = (playerId: string, method: PaymentMethod) => {
    setPlayersState((prev) =>
      prev.map((p) => (p.playerId === playerId ? { ...p, paymentMethod: method } : p))
    );
  };

  // Save handler: updates Match & syncs charges to Finance
  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      // 1. Update Match callups with all players in playersState
      const updatedCallups: Callup[] = playersState.map((state) => {
        const existing = match.callups.find((c) => c.playerId === state.playerId);
        if (existing) {
          return {
            ...existing,
            attended: state.attended,
            isScholarship: state.isScholarship,
            arbitrationPaid: state.arbitrationPaid,
            arbitrationAmount: state.arbitrationAmount,
            arbitrationMethod: state.paymentMethod,
            arbitrationNote: state.notes?.trim() || undefined,
          };
        }
        return {
          playerId: state.playerId,
          fullName: state.fullName,
          jerseyNumber: state.jerseyNumber,
          phone: state.phone,
          status: 'Confirmado',
          attended: state.attended,
          isScholarship: state.isScholarship,
          arbitrationPaid: state.arbitrationPaid,
          arbitrationAmount: state.arbitrationAmount,
          arbitrationMethod: state.paymentMethod,
          arbitrationNote: state.notes?.trim() || undefined,
          confirmedAt: new Date().toISOString(),
        };
      });

      const updatedMatch: Match = {
        ...match,
        callups: updatedCallups,
        postMatchDone: true,
        postMatchFeePerPlayer: feePerPlayer,
        refereeCollectorName: refereeCollectorName.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      // 2. Sync to Finances (Charges collection)
      const existingCharges = getLocalCharges();
      const chargesToSave: Charge[] = [];
      const now = new Date().toISOString();

      for (const p of playersState) {
        const existing = existingCharges.find(
          (c: Charge) => c.matchId === match.id && c.playerId === p.playerId && c.type === 'arbitraje'
        );

        if (p.attended) {
          const chargeId = existing ? existing.id : `charge_${match.id}_${p.playerId}`;
          const isBec = p.isScholarship;
          const charge: Charge = {
            id: chargeId,
            teamId: match.teamId,
            playerId: p.playerId,
            playerName: p.fullName,
            jerseyNumber: p.jerseyNumber,
            conceptName: isBec ? `Arbitraje vs ${match.rival} (Becado)` : `Arbitraje vs ${match.rival}`,
            type: 'arbitraje',
            matchId: match.id,
            amount: isBec ? (p.arbitrationAmount || 0) : p.arbitrationAmount,
            status: isBec ? 'Pagado' : (p.arbitrationPaid ? 'Pagado' : 'Pendiente'),
            paymentMethod: isBec ? 'Otro' : (p.arbitrationPaid ? p.paymentMethod : undefined),
            isScholarship: isBec,
            notes: p.notes?.trim() || undefined,
            collectedBy: refereeCollectorName.trim() || undefined,
            paidAt: (isBec || p.arbitrationPaid) ? (existing?.paidAt || now) : undefined,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now,
          };
          chargesToSave.push(charge);
        } else if (existing && !p.attended) {
          chargesToSave.push({
            ...existing,
            status: 'Pendiente',
            amount: 0,
            updatedAt: now,
          });
        }
      }

      await Promise.all([
        saveMatch(updatedMatch),
        saveChargesBatch(chargesToSave),
      ]);

      setSaveSuccess(true);
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 800);
    } catch (err) {
      console.error('Error saving post-match:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Error al guardar el control post-partido');
    } finally {
      setIsSaving(false);
    }
  };

  const renderPlayerCard = (player: PlayerPostMatchState, isUnconfirmedSection: boolean) => {
    const isAbsentAfterConfirm = player.originalStatus === 'Confirmado' && !player.attended;
    const isScholarship = player.isScholarship;
    const diffFromBase = player.arbitrationAmount - feePerPlayer;
    const isCollector = !!refereeCollectorName && (
      refereeCollectorName.trim().toLowerCase() === player.fullName.trim().toLowerCase() ||
      refereeCollectorName.trim().toLowerCase().startsWith(player.fullName.trim().toLowerCase())
    );
    const isUnexpectedArrival = isUnconfirmedSection && player.attended;

    return (
      <div
        key={player.playerId}
        className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
          player.attended
            ? isCollector
              ? 'bg-purple-50/60 border-purple-300 shadow-sm ring-1 ring-purple-200'
              : isScholarship
              ? 'bg-purple-50/50 border-purple-200 shadow-2xs'
              : player.arbitrationPaid
              ? 'bg-white border-emerald-300 shadow-2xs ring-1 ring-emerald-100'
              : 'bg-amber-50/50 border-amber-200 shadow-2xs'
            : isAbsentAfterConfirm
            ? 'bg-red-50/60 border-red-200 opacity-90'
            : 'bg-gray-50 border-gray-200 opacity-75'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Player Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl font-mono font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs ${
              player.attended ? 'bg-emerald-800 text-white' : 'bg-gray-700 text-gray-300'
            }`}>
              {player.jerseyNumber}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm text-gray-900 truncate">
                  {player.fullName}
                </h4>
                {isCollector && (
                  <span className="text-[10px] font-black bg-purple-700 text-white px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                    <UserCheck className="w-3 h-3 text-purple-200" />
                    <span>Recogió Arbitraje</span>
                  </span>
                )}
                {isAbsentAfterConfirm && (
                  <span className="text-[10px] font-black bg-red-100 text-red-800 px-2 py-0.5 rounded-md border border-red-200">
                    ✕ Faltó al partido
                  </span>
                )}
                {isUnexpectedArrival && (
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>¡Llegó a jugar!</span>
                  </span>
                )}
                {isScholarship && (
                  <span className="text-[10px] font-black bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md border border-purple-200">
                    🎓 Becado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-[11px] text-gray-500">
                  Previa convocatoria:{' '}
                  <span className={player.originalStatus === 'Confirmado' ? 'text-emerald-700 font-bold' : 'text-gray-600 font-medium'}>
                    {player.originalStatus}
                  </span>
                </p>
                {player.attended && (
                  <button
                    type="button"
                    onClick={() => setRefereeCollectorName(isCollector ? '' : player.fullName)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 border ${
                      isCollector
                        ? 'bg-purple-100 text-purple-900 border-purple-300'
                        : 'bg-white hover:bg-purple-50 text-gray-500 hover:text-purple-800 border-gray-200'
                    }`}
                    title={isCollector ? 'Quitar como recaudador' : `Marcar a ${player.fullName} como quien recogió el arbitraje`}
                  >
                    <UserCheck className="w-2.5 h-2.5 text-purple-600" />
                    <span>{isCollector ? 'Quitar rol' : '¿Recogió él?'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Asistencia + Becado + Monto Editable + Estado de Pago */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 justify-end">
            {/* 1. Asistencia Real Toggle (MANUAL OBLIGATORIO) */}
            <button
              type="button"
              onClick={() => handleToggleAttendance(player.playerId)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                player.attended
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-300'
              }`}
              title="Cambiar manualmente asistencia de este jugador"
            >
              {player.attended ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Asistió</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-red-500" />
                  <span>No asistió</span>
                </>
              )}
            </button>

            {player.attended && (
              <>
                {/* 2. Botón Becado (Exento) */}
                <button
                  type="button"
                  onClick={() => handleToggleBecado(player.playerId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isScholarship
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-white hover:bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                  title={isScholarship ? 'Quitar condición de becado' : 'Marcar como becado (exento de pago)'}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{isScholarship ? 'Becado' : 'Beca'}</span>
                </button>

                {/* 3. Input de Monto Personalizado */}
                {!isScholarship && (
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-300 shadow-2xs">
                    <span className="text-xs font-bold text-gray-400 pl-1">$</span>
                    <input
                      type="number"
                      step={500}
                      value={player.arbitrationAmount}
                      onChange={(e) => handleChangePlayerAmount(player.playerId, Number(e.target.value) || 0)}
                      className="w-20 text-xs font-black text-gray-900 focus:outline-none"
                    />
                    {diffFromBase !== 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${diffFromBase > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {diffFromBase > 0 ? `+${diffFromBase / 1000}k` : `${diffFromBase / 1000}k`}
                      </span>
                    )}
                  </div>
                )}

                {/* 4. Botón Pagó vs Debe */}
                <button
                  type="button"
                  disabled={isScholarship}
                  onClick={() => handleTogglePaid(player.playerId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer border ${
                    isScholarship
                      ? 'bg-purple-100 text-purple-900 border-purple-300 opacity-90 cursor-default'
                      : player.arbitrationPaid
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                  }`}
                  title="Alternar estado de pago"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                  <span>
                    {isScholarship
                      ? 'Exento ($0)'
                      : player.arbitrationPaid
                      ? `Pagó ($${player.arbitrationAmount.toLocaleString('es-CO')})`
                      : `Debe ($${player.arbitrationAmount.toLocaleString('es-CO')})`}
                  </span>
                  {player.arbitrationPaid ? (
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                  )}
                </button>

                {/* 5. Selector de Método de Pago */}
                {player.arbitrationPaid && !isScholarship && (
                  <select
                    value={player.paymentMethod}
                    onChange={(e) => handleChangeMethod(player.playerId, e.target.value as PaymentMethod)}
                    className="text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-300 rounded-lg py-1 px-1.5 focus:outline-none"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Transferencia">Transf.</option>
                  </select>
                )}

                {/* 6. Botón Nota / Mensaje */}
                <button
                  type="button"
                  onClick={() => togglePlayerNoteOpen(player.playerId)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    player.notes && player.notes.trim().length > 0
                      ? isScholarship
                        ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-2xs'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs'
                      : openNotePlayerIds.has(player.playerId)
                      ? 'bg-gray-200 text-gray-800 border-gray-300'
                      : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-300'
                  }`}
                  title={
                    player.notes
                      ? `Nota: "${player.notes}". Toca para ver o editar.`
                      : 'Agregar nota o motivo (ej. por qué se becó hoy)'
                  }
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{player.notes && player.notes.trim().length > 0 ? 'Nota' : '+ Nota'}</span>
                  {player.notes && player.notes.trim().length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  )}
                </button>
              </>
            )}

            {!player.attended && (
              <span className="text-[11px] text-gray-400 italic px-2">
                Sin cobro (No jugó)
              </span>
            )}
          </div>
        </div>

        {/* Note message section (especially for becados or arbitration remarks) */}
        {player.attended && (isScholarship || openNotePlayerIds.has(player.playerId) || (player.notes && player.notes.trim().length > 0)) && (
          <div className={`mt-2.5 pt-2.5 border-t border-dashed rounded-xl p-2.5 space-y-2 transition-all ${
            isScholarship
              ? 'bg-purple-50/70 border-purple-200'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <MessageSquareText className={`w-3.5 h-3.5 ${isScholarship ? 'text-purple-700' : 'text-emerald-700'}`} />
                <span className={isScholarship ? 'text-purple-950 font-extrabold' : 'text-gray-800'}>
                  {isScholarship ? '🎓 Motivo de Beca para este partido:' : '💬 Nota / Mensaje del pago:'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {player.notes && (
                  <button
                    type="button"
                    onClick={() => handleChangePlayerNote(player.playerId, '')}
                    className="text-[10px] font-semibold text-gray-400 hover:text-red-600 transition cursor-pointer"
                    title="Borrar mensaje"
                  >
                    ✕ Limpiar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => togglePlayerNoteOpen(player.playerId)}
                  className="text-[10px] text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  {openNotePlayerIds.has(player.playerId) ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {/* Quick reason suggestions when becado */}
            {isScholarship && (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-purple-900 font-bold flex-shrink-0">Motivos frecuentes:</span>
                {[
                  'Apoyo con transporte',
                  'Destacada actuación',
                  'Apoyo con implementos',
                  'Lesión durante partido',
                  'Convenio DT / Club',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleChangePlayerNote(player.playerId, sug)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer flex-shrink-0 ${
                      player.notes === sug
                        ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                        : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-300'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Note text input */}
            <div className="relative">
              <input
                type="text"
                value={player.notes || ''}
                onChange={(e) => handleChangePlayerNote(player.playerId, e.target.value)}
                placeholder={
                  isScholarship
                    ? 'Escribe el motivo de por qué se becó hoy a este jugador...'
                    : 'Deja una nota tipo mensaje sobre este jugador o su cuota de arbitraje...'
                }
                className={`w-full text-xs px-3 py-1.5 rounded-xl border bg-white focus:outline-none transition font-medium ${
                  isScholarship
                    ? 'border-purple-300 focus:border-purple-600 focus:ring-1 focus:ring-purple-200 text-purple-950 placeholder-purple-300'
                    : 'border-gray-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 text-gray-900 placeholder-gray-400'
                }`}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-gray-950 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <CheckCircle2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-emerald-950 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span>💰 Tesorería y Arbitrajes</span>
                </span>
                <span className="text-xs text-emerald-200">
                  {match.tournamentName || 'Torneo'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Gestión Financiera, Arbitraje y Pagos
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Match Quick Summary Card */}
          <div className="bg-gradient-to-br from-emerald-50/70 via-gray-50 to-white p-3.5 sm:p-4 rounded-2xl border border-emerald-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <TeamCrest name={team?.name || 'Nuestro Equipo'} isOurTeam logoUrl={team?.logoUrl} size="md" />
              <div>
                <p className="text-xs font-black text-gray-900 uppercase">
                  {team?.name || 'Nuestro Equipo'}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    {formatMatchDate(match.date)}
                  </span>
                  <span>vs</span>
                  <strong className="text-gray-800">{match.rival}</strong>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-gray-500 block">Costo Arbitraje</span>
              <span className="text-base font-black text-emerald-800">
                ${totalRefereeCost.toLocaleString('es-CO')}
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-800 rounded-2xl text-xs flex items-center gap-2 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl text-xs flex items-center gap-2 border border-emerald-200 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="font-bold">¡Control post-partido y finanzas guardadas con éxito!</p>
            </div>
          )}

          {/* Fee Configuration & Real-Time Dashboard */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              {/* Total Fee Setting */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block">
                    Costo Total del Arbitraje
                  </label>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      value={totalRefereeCost}
                      onChange={(e) => setTotalRefereeCost(Math.max(0, Number(e.target.value) || 0))}
                      className="w-24 text-sm font-black text-gray-900 border-b-2 border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Per Player Standard Base Fee */}
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-gray-500 block">
                    Cuota Base Sugerida
                  </label>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      value={feePerPlayer}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value) || 0);
                        setFeePerPlayer(val);
                      }}
                      className="w-24 text-sm font-black text-emerald-700 border-b-2 border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAutoCalculateFee}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition cursor-pointer"
                      title="Calcular Cuota = Total Arbitraje / Asistentes Pagantes"
                    >
                      Dividir entre asistentes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN: ¿QUIÉN RECOGIÓ EL ARBITRAJE ESE DÍA? */}
            <div className="bg-purple-50/70 p-3 sm:p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-2 rounded-xl bg-purple-600 text-white flex-shrink-0 shadow-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs font-black uppercase text-purple-950 block tracking-tight">
                      ¿Quién recogió ese día el arbitraje?
                    </label>
                    <p className="text-[11px] text-purple-700 font-medium">
                      Registra el responsable del recaudo para control de caja del equipo
                    </p>
                  </div>
                </div>

                {refereeCollectorName && (
                  <span className="self-start sm:self-auto text-[11px] font-bold text-purple-900 bg-white px-2.5 py-1 rounded-xl border border-purple-200 shadow-2xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Recaudador: <strong>{refereeCollectorName}</strong></span>
                  </span>
                )}
              </div>

              {/* Input + Suggestions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={refereeCollectorName}
                    onChange={(e) => setRefereeCollectorName(e.target.value)}
                    placeholder="Escribe el nombre de quien recogió el dinero (ej. Capitán Andrés, DT Profe, etc.)..."
                    className="w-full text-xs font-bold text-gray-900 bg-white pl-3 pr-8 py-2 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder:text-gray-400 placeholder:font-normal shadow-2xs"
                  />
                  {refereeCollectorName && (
                    <button
                      type="button"
                      onClick={() => setRefereeCollectorName('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                      title="Borrar nombre"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Quick suggestion chips */}
                {suggestedCollectors.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-purple-800 uppercase flex-shrink-0">
                      Sugerir:
                    </span>
                    {suggestedCollectors.map((sug) => {
                      const isSelected = refereeCollectorName.trim().toLowerCase() === sug.trim().toLowerCase();
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setRefereeCollectorName(isSelected ? '' : sug)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition cursor-pointer ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                              : 'bg-white hover:bg-purple-100 text-purple-900 border-purple-200 shadow-2xs'
                          }`}
                          title={`Asignar a ${sug}`}
                        >
                          {isSelected ? `✓ ${sug}` : sug}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary Metric Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
              <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                <span className="text-[10px] font-bold text-gray-500 block uppercase">
                  Asistencia Real
                </span>
                <span className="text-base font-black text-gray-900">
                  {totalAttended} <span className="text-xs font-normal text-gray-500">jug.</span>
                </span>
                {totalAbsentAfterConfirm > 0 && (
                  <span className="text-[10px] font-bold text-red-600 block mt-0.5">
                    ({totalAbsentAfterConfirm} faltaron)
                  </span>
                )}
              </div>

              <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                <span className="text-[10px] font-bold text-purple-700 block uppercase">
                  Becados / Exentos
                </span>
                <span className="text-base font-black text-purple-900">
                  {totalBecadosCount} <span className="text-xs font-normal text-purple-600">🎓</span>
                </span>
                <span className="text-[10px] font-bold text-purple-700 block mt-0.5">
                  Sin deuda ($0)
                </span>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                  Recaudado Real
                </span>
                <span className="text-base font-black text-emerald-800">
                  ${totalCollectedMoney.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
                  {totalPaidCount} pagaron
                </span>
                {refereeCollectorName && (
                  <span
                    className="text-[10px] font-bold text-purple-900 bg-purple-100/90 px-1.5 py-0.5 rounded-md block mt-1 truncate max-w-full border border-purple-200"
                    title={`Arbitraje recogido por: ${refereeCollectorName}`}
                  >
                    👤 {refereeCollectorName}
                  </span>
                )}
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 block uppercase">
                  Por Cobrar
                </span>
                <span className="text-base font-black text-amber-800">
                  ${totalPendingMoney.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] font-bold text-amber-700 block mt-0.5">
                  {totalPendingCount} deben
                </span>
              </div>

              <div className={`p-2.5 rounded-xl border col-span-2 sm:col-span-1 ${balanceMoney >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <span className="text-[10px] font-bold block uppercase">
                  Balance Arbitraje
                </span>
                <span className="text-base font-black">
                  {balanceMoney >= 0 ? `+$${balanceMoney.toLocaleString('es-CO')}` : `-$${Math.abs(balanceMoney).toLocaleString('es-CO')}`}
                </span>
                <span className="text-[10px] font-semibold block mt-0.5 opacity-80">
                  {balanceMoney >= 0 ? 'Cubierto con éxito' : 'Faltante de caja'}
                </span>
              </div>
            </div>
          </div>

          {/* Mass action quick buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
              Lista de Jugadores ({playersState.length})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllAttended}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition cursor-pointer"
              >
                ✓ Confirmados asistieron
              </button>
              <button
                type="button"
                onClick={handleMarkAllPaid}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition cursor-pointer"
              >
                💰 Todos los asistentes pagaron
              </button>
              <button
                type="button"
                onClick={handleResetStandardFee}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 transition cursor-pointer"
                title="Pone el valor sugerido en todos los no becados"
              >
                ↺ Cuota sugerida
              </button>
            </div>
          </div>

          {/* Players List: Grouped by Confirmed first, then Unconfirmed / Pending */}
          <div className="space-y-6">
            {/* GRUPO 1: JUGADORES CONFIRMADOS (PRIMEROS EN LA LISTA) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    1
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2">
                      <span>Jugadores Confirmados</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 text-[11px] font-black">
                        {confirmedPlayersList.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      Confirmaron asistencia previa. Si alguno no vino al partido, márcalo aquí como [✕ No asistió].
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 self-end sm:self-auto">
                  <span className="bg-white/80 px-2.5 py-1 rounded-xl border border-emerald-200">
                    {confirmedPlayersList.filter((p) => p.attended).length} asistieron
                  </span>
                  {confirmedPlayersList.filter((p) => !p.attended).length > 0 && (
                    <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-xl border border-red-200 font-bold">
                      {confirmedPlayersList.filter((p) => !p.attended).length} faltaron
                    </span>
                  )}
                </div>
              </div>

              {confirmedPlayersList.length === 0 ? (
                <div className="p-4 rounded-2xl border border-dashed border-gray-300 text-center text-xs text-gray-500 bg-gray-50/50">
                  No hay jugadores marcados como confirmados en este partido.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {confirmedPlayersList.map((player) => renderPlayerCard(player, false))}
                </div>
              )}
            </div>

            {/* GRUPO 2: NO CONFIRMADOS / PENDIENTES / OTRAS RESPUESTAS (DE ÚLTIMAS) */}
            <div className="space-y-3 pt-3 border-t-2 border-dashed border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-100/90 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-gray-700 text-white text-xs font-black flex items-center justify-center shadow-xs">
                    2
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-gray-900 flex items-center gap-2">
                      <span>No Confirmados / Pendientes / Suplentes</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-800 text-[11px] font-black">
                        {unconfirmedPlayersList.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-600 font-medium">
                      No habían confirmado previamente. Si alguno llegó a jugar hoy, haz clic en [✓ Asistió] para registrar su arbitraje.
                    </p>
                  </div>
                </div>

                {unconfirmedPlayersList.filter((p) => p.attended).length > 0 && (
                  <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-xl border border-amber-300 text-xs font-black self-end sm:self-auto flex items-center gap-1.5">
                    <span>⚡ {unconfirmedPlayersList.filter((p) => p.attended).length} llegaron a jugar</span>
                  </span>
                )}
              </div>

              {unconfirmedPlayersList.length === 0 ? (
                <div className="p-3 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 bg-gray-50/50">
                  No hay convocados pendientes ni rechazados.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {unconfirmedPlayersList.map((player) => renderPlayerCard(player, true))}
                </div>
              )}

              {/* Botón / Widget para agregar jugadores del plantel que no estaban en la convocatoria pero llegaron a jugar */}
              {availableUncalledPlayers.length > 0 && (
                <div className="mt-3 p-3.5 bg-gradient-to-r from-emerald-50/60 to-blue-50/60 rounded-2xl border border-emerald-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                      <span>➕ ¿Llegó otro jugador del plantel sin previa convocatoria?</span>
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Agrégalo directamente para incluirlo en la asistencia, el cobro y las finanzas de este partido.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={selectedNewPlayerId}
                      onChange={(e) => setSelectedNewPlayerId(e.target.value)}
                      className="text-xs px-3 py-2 rounded-xl border border-gray-300 bg-white font-medium text-gray-800 focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">-- Seleccionar jugador --</option>
                      {availableUncalledPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} {p.fullName}{p.isCaptain ? ' (C)' : ''}{p.isScholarship ? ' [Becado]' : ''}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedNewPlayerId}
                      onClick={() => {
                        if (selectedNewPlayerId) {
                          handleAddUncalledPlayer(selectedNewPlayerId);
                          setSelectedNewPlayerId('');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0 shadow-lg">
          <div className="text-xs text-gray-600 text-center sm:text-left">
            <span>Al guardar se actualizarán las </span>
            <strong className="text-emerald-800">finanzas del club</strong>
            <span> con los valores reales aportados y los becados quedan sin deuda.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar Finanzas del Partido</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
