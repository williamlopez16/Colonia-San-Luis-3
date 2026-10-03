import React, { useState } from 'react';
import type { Concept, Team } from '../types';
import { saveConcept, deleteConcept, generateUUID } from '../services/dataService';
import { DollarSign, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, X } from 'lucide-react';

interface ConceptsCatalogProps {
  team: Team | null;
  concepts: Concept[];
}

export const ConceptsCatalog: React.FC<ConceptsCatalogProps> = ({ team, concepts }) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [suggestedValue, setSuggestedValue] = useState<string>('');
  const [isDefaultArbitration, setIsDefaultArbitration] = useState<boolean>(false);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick edit for default arbitration
  const defaultArbitrationConcept = concepts.find((c) => c.isDefaultArbitration);
  const [arbitrationInput, setArbitrationInput] = useState<string>(
    defaultArbitrationConcept ? String(defaultArbitrationConcept.suggestedValue) : '12000'
  );
  const [isUpdatingArbitration, setIsUpdatingArbitration] = useState<boolean>(false);
  const [arbitrationSuccess, setArbitrationSuccess] = useState<boolean>(false);

  const handleSaveDefaultArbitration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const val = parseFloat(arbitrationInput);
    if (isNaN(val) || val < 0) {
      alert('Por favor ingresa un valor numérico válido para el arbitraje.');
      return;
    }

    setIsUpdatingArbitration(true);
    setArbitrationSuccess(false);
    try {
      const conceptToSave: Concept = {
        id: defaultArbitrationConcept?.id || generateUUID(),
        teamId: team.id,
        name: 'Arbitraje por partido',
        suggestedValue: val,
        isDefaultArbitration: true,
        createdAt: defaultArbitrationConcept?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveConcept(conceptToSave);
      setArbitrationSuccess(true);
      setTimeout(() => setArbitrationSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar arbitraje');
    } finally {
      setIsUpdatingArbitration(false);
    }
  };

  const handleCreateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!team) {
      setFormError('Primero debes configurar y guardar el equipo.');
      return;
    }

    const trimmedName = name.trim();
    const val = parseFloat(suggestedValue);

    if (!trimmedName || trimmedName.length < 2) {
      setFormError('El nombre del concepto es obligatorio.');
      return;
    }
    if (isNaN(val) || val < 0) {
      setFormError('El valor sugerido debe ser un número válido mayor o igual a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newConcept: Concept = {
        id: generateUUID(),
        teamId: team.id,
        name: trimmedName,
        suggestedValue: val,
        isDefaultArbitration,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveConcept(newConcept);
      setName('');
      setSuggestedValue('');
      setIsDefaultArbitration(false);
      setShowAddForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar concepto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteConcept(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900">Conceptos y Rubros Frecuentes</h2>
        </div>
        <p className="text-xs text-gray-500">
          Configura el valor de arbitraje por defecto y rubros reutilizables (uniformes, inscripciones, hidratación)
          para agilizar la creación de partidos. Nunca son obligatorios: siempre podrás escribir uno libremente.
        </p>
      </div>

      {/* Default Arbitration Settings Box */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-700">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Configuración Predeterminada
            </span>
            <h3 className="text-base sm:text-lg font-bold">Valor de Arbitraje por Defecto</h3>
            <p className="text-xs text-emerald-100 max-w-md">
              Este valor se prellenará automáticamente al programar un partido, pero podrás cambiarlo en cada caso.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveDefaultArbitration} className="mt-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
              $
            </span>
            <input
              type="number"
              min="0"
              step="1000"
              value={arbitrationInput}
              onChange={(e) => setArbitrationInput(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 bg-white text-gray-900 font-bold rounded-xl text-base outline-hidden focus:ring-2 focus:ring-emerald-400"
              placeholder="12000"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isUpdatingArbitration}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isUpdatingArbitration ? 'Guardando...' : 'Actualizar Arbitraje'}
          </button>

          {arbitrationSuccess && (
            <span className="text-xs text-emerald-200 font-semibold flex items-center gap-1 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" /> ¡Guardado!
            </span>
          )}
        </form>
      </div>

      {/* Other reusable concepts list */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Conceptos de Cobro Reutilizables</h3>
            <p className="text-xs text-gray-500">
              Plantillas de cobro disponibles para selección rápida
            </p>
          </div>

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-3.5 py-2 text-xs font-semibold border border-emerald-200 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Concepto</span>
            </button>
          )}
        </div>

        {/* Add Concept Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateConcept}
            className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Registrar Concepto Frecuente
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre del Concepto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Hidratación y frutas"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Valor Sugerido ($ COP) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={suggestedValue}
                  onChange={(e) => setSuggestedValue(e.target.value)}
                  placeholder="5000"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-300 outline-hidden"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="defaultArbCheckbox"
                checked={isDefaultArbitration}
                onChange={(e) => setIsDefaultArbitration(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-400"
              />
              <label htmlFor="defaultArbCheckbox" className="text-xs text-gray-700 cursor-pointer">
                Marcar como el valor de arbitraje predeterminado del equipo
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Concepto'}
              </button>
            </div>
          </form>
        )}

        {/* Concepts list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {concepts.length === 0 ? (
            <div className="col-span-full py-8 text-center text-gray-400 text-xs bg-gray-50 rounded-xl">
              No hay conceptos registrados. Agrega cobros frecuentes para usarlos en partidos.
            </div>
          ) : (
            concepts.map((concept) => (
              <div
                key={concept.id}
                className={`p-3.5 rounded-xl border transition flex items-center justify-between shadow-2xs ${
                  concept.isDefaultArbitration
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{concept.name}</span>
                    {concept.isDefaultArbitration && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        Arbitraje Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5">
                    {formatCurrency(concept.suggestedValue)}
                  </p>
                </div>

                {!concept.isDefaultArbitration && (
                  <button
                    onClick={() => handleDelete(concept.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="Eliminar concepto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
