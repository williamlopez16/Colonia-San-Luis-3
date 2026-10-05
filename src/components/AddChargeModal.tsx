import React, { useState, useMemo } from 'react';
import type { Team, Player, Concept, Charge } from '../types';
import { saveChargesBatch, generateUUID, getActiveTeamId } from '../services/dataService';
import { X, Plus, DollarSign, Users, Check, AlertCircle, Sparkles } from 'lucide-react';

interface AddChargeModalProps {
  team: Team | null;
  players: Player[];
  concepts: Concept[];
  existingCharges: Charge[];
  preselectedPlayerId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddChargeModal: React.FC<AddChargeModalProps> = ({
  team,
  players,
  concepts,
  existingCharges,
  preselectedPlayerId,
  onClose,
  onSuccess,
}) => {
  const activePlayers = useMemo(() => players.filter((p) => p.status === 'Activo'), [players]);

  // Concept suggestions from catalog and prior charges
  const suggestions = useMemo(() => {
    const set = new Set<string>();
    // Pre-populate with typical soccer items if empty
    ['Uniforme Oficial', 'Inscripción Torneo', 'Transporte', 'Fisioterapia / Botiquín', 'Hidratación'].forEach((s) =>
      set.add(s)
    );
    // Add concepts from catalog
    concepts.forEach((c) => {
      if (!c.isDefaultArbitration) set.add(c.name);
    });
    // Add from previous charges
    existingCharges.forEach((ch) => {
      if (ch.type === 'esporadico' && ch.conceptName) {
        set.add(ch.conceptName);
      }
    });
    return Array.from(set);
  }, [concepts, existingCharges]);

  // Form states
  const [conceptName, setConceptName] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(() => {
    if (preselectedPlayerId) {
      return new Set([preselectedPlayerId]);
    }
    return new Set(activePlayers.map((p) => p.id));
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePlayer = (id: string) => {
    const next = new Set(selectedPlayerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedPlayerIds(next);
  };

  const handleSelectAllActive = () => {
    setSelectedPlayerIds(new Set(activePlayers.map((p) => p.id)));
  };

  const handleClearSelection = () => {
    setSelectedPlayerIds(new Set());
  };

  const handlePickSuggestion = (name: string) => {
    setConceptName(name);
    // If it matches a catalog concept, auto-fill suggested value
    const matchedConcept = concepts.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (matchedConcept && matchedConcept.suggestedValue > 0) {
      setAmountStr(String(matchedConcept.suggestedValue));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedConcept = conceptName.trim();
    if (!trimmedConcept) {
      setError('Por favor ingresa el nombre del concepto de cobro.');
      return;
    }

    const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setError('Por favor ingresa un valor válido mayor a $0.');
      return;
    }

    if (selectedPlayerIds.size === 0) {
      setError('Debes seleccionar al menos un jugador para asignar el cobro.');
      return;
    }

    setIsSubmitting(true);
    try {
      const teamId = team?.id || getActiveTeamId();
      const now = new Date().toISOString();

      const newCharges: Charge[] = [];
      players.forEach((p) => {
        if (selectedPlayerIds.has(p.id)) {
          newCharges.push({
            id: generateUUID(),
            teamId,
            playerId: p.id,
            playerName: p.fullName,
            jerseyNumber: p.jerseyNumber,
            conceptName: trimmedConcept,
            type: 'esporadico',
            amount: cleanAmount,
            status: 'Pendiente',
            createdAt: now,
            updatedAt: now,
          });
        }
      });

      await saveChargesBatch(newCharges);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cobros');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Agregar Cobro</h3>
              <p className="text-xs text-emerald-200">
                Crea cobros esporádicos (uniformes, inscripción, etc.) sin catálogo obligatorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Concept Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Nombre del Concepto *
            </label>
            <input
              type="text"
              value={conceptName}
              onChange={(e) => setConceptName(e.target.value)}
              placeholder="Ej. Uniforme Oficial, Cuota Inscripción, Transporte..."
              className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition font-medium"
              required
            />

            {/* Quick Suggestions Pills */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Sugerencias:
              </span>
              {suggestions.slice(0, 6).map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => handlePickSuggestion(sugg)}
                  className="text-[11px] font-semibold bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 px-2.5 py-1 rounded-lg transition border border-gray-200 cursor-pointer"
                >
                  {sugg}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
              Valor a Cobrar por Jugador (COP) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">$</span>
              <input
                type="number"
                min="0"
                step="500"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="Ej. 45000"
                className="w-full rounded-xl border border-gray-300 pl-8 pr-3.5 py-2.5 text-sm font-mono font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                required
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="mt-1.5 flex items-center gap-1.5">
              {[15000, 25000, 40000, 50000, 80000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountStr(String(val))}
                  className="text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-emerald-100 hover:text-emerald-800 px-2 py-0.5 rounded transition cursor-pointer"
                >
                  ${(val / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
          </div>

          {/* Player Selection */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Asignar a ({selectedPlayerIds.size} seleccionados)</span>
              </label>

              <div className="flex items-center gap-2 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={handleSelectAllActive}
                  className="text-emerald-700 hover:underline cursor-pointer"
                >
                  Todo el Roster Activo ({activePlayers.length})
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-gray-500 hover:text-red-600 cursor-pointer"
                >
                  Ninguno
                </button>
              </div>
            </div>

            {/* Player Grid List */}
            <div className="max-h-52 overflow-y-auto rounded-2xl border border-gray-200 divide-y divide-gray-100 bg-gray-50/50 p-1">
              {players.map((p) => {
                const isSelected = selectedPlayerIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePlayer(p.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                        : 'hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-black text-[11px] flex items-center justify-center flex-shrink-0">
                        {p.jerseyNumber}
                      </span>
                      <span className="text-xs">{p.fullName}</span>
                      {p.status !== 'Activo' && (
                        <span className="text-[10px] text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">
                          {p.status}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Guardando...'
                  : `Crear Cobro para ${selectedPlayerIds.size} jugador(es)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
