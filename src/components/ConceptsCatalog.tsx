import React, { useState } from 'react';
import type { Concept, Team } from '../types';
import { saveConcept, deleteConcept, generateUUID } from '../services/dataService';
import { DollarSign, Plus, Trash2, Edit3, CheckCircle2, AlertCircle, Sparkles, X, Check } from 'lucide-react';

interface ConceptsCatalogProps {
  team: Team | null;
  concepts: Concept[];
}

export const ConceptsCatalog: React.FC<ConceptsCatalogProps> = ({ team, concepts }) => {
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [suggestedValue, setSuggestedValue] = useState<string>('');
  const [isDefaultArbitration, setIsDefaultArbitration] = useState<boolean>(false);

  // Edit / Delete State
  const [editingConcept, setEditingConcept] = useState<Concept | null>(null);
  const [deletingConcept, setDeletingConcept] = useState<Concept | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
      showToast('Por favor ingresa un valor numérico válido para el arbitraje.', 'error');
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
      showToast('¡Arbitraje por defecto actualizado con éxito!');
      setTimeout(() => setArbitrationSuccess(false), 3000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar arbitraje', 'error');
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
      showToast(`¡Concepto "${trimmedName}" registrado con éxito!`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar concepto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConcept) return;

    const form = e.currentTarget as HTMLFormElement;
    const nameInput = form.elements.namedItem('editName') as HTMLInputElement;
    const valueInput = form.elements.namedItem('editValue') as HTMLInputElement;

    const trimmedName = nameInput.value.trim();
    const val = parseFloat(valueInput.value);

    if (!trimmedName || trimmedName.length < 2) {
      showToast('El nombre debe tener al menos 2 caracteres', 'error');
      return;
    }
    if (isNaN(val) || val < 0) {
      showToast('Ingresa un valor numérico válido', 'error');
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated: Concept = {
        ...editingConcept,
        name: trimmedName,
        suggestedValue: val,
        updatedAt: new Date().toISOString(),
      };
      await saveConcept(updated);
      setEditingConcept(null);
      showToast(`¡Concepto "${trimmedName}" actualizado con éxito!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar concepto', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingConcept) return;
    setIsDeleting(true);
    try {
      await deleteConcept(deletingConcept.id);
      const deletedName = deletingConcept.name;
      setDeletingConcept(null);
      showToast(`¡Concepto "${deletedName}" eliminado del catálogo!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar concepto', 'error');
    } finally {
      setIsDeleting(false);
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
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-md animate-fade-in ${
            toastType === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-red-50 text-red-900 border-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingConcept(concept)}
                    className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                    title="Editar concepto"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {!concept.isDefaultArbitration && (
                    <button
                      type="button"
                      onClick={() => setDeletingConcept(concept)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Eliminar concepto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Catalog Concept Modal */}
      {editingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 my-auto animate-scale-up">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-base text-white">Editar Concepto del Catálogo</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingConcept(null)}
                className="text-white hover:text-gray-300 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditConcept} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Nombre del Concepto *</label>
                <input
                  type="text"
                  name="editName"
                  defaultValue={editingConcept.name}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300 font-bold text-gray-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Valor Sugerido ($ COP) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    name="editValue"
                    defaultValue={editingConcept.suggestedValue}
                    min="0"
                    step="500"
                    required
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-300 font-mono font-bold text-gray-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingConcept(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit ? (
                    <span>Guardando...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Cambios</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Catalog Concept Modal */}
      {deletingConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-red-100 my-auto animate-scale-up">
            <div className="bg-red-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base text-white">¿Eliminar Concepto?</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingConcept(null)}
                className="text-white hover:text-gray-300 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-700 leading-relaxed">
                ¿Estás seguro de que deseas eliminar el concepto <b>"{deletingConcept.name}"</b> ({formatCurrency(deletingConcept.suggestedValue)}) de la lista de conceptos frecuentes?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDeletingConcept(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isDeleting ? (
                    <span>Eliminando...</span>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Concepto</span>
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
