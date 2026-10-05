import React, { useState } from 'react';
import type { Charge, PaymentMethod } from '../types';
import { markChargePaid } from '../services/dataService';
import { Check, X, DollarSign, CreditCard, Banknote, Smartphone, HelpCircle } from 'lucide-react';

interface PaymentModalProps {
  charge: Charge;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'Nequi', label: 'Nequi', icon: <Smartphone className="w-5 h-5" />, color: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' },
  { id: 'Daviplata', label: 'Daviplata', icon: <Smartphone className="w-5 h-5" />, color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
  { id: 'Efectivo', label: 'Efectivo', icon: <Banknote className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' },
  { id: 'Transferencia', label: 'Transferencia Bancaria', icon: <CreditCard className="w-5 h-5" />, color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  { id: 'Otro', label: 'Otro Medio', icon: <HelpCircle className="w-5 h-5" />, color: 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100' },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  charge,
  onClose,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('Nequi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(charge.amount);

  const handleConfirmPayment = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await markChargePaid(charge.id, selectedMethod);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Registrar Pago</h3>
              <p className="text-xs text-emerald-200">Selecciona el método de pago recibido</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium border border-red-200">
              {error}
            </div>
          )}

          {/* Charge Summary Box */}
          <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 text-center">
            <p className="text-xs text-gray-500 font-medium">Jugador</p>
            <p className="text-sm font-black text-gray-900">
              #{charge.jerseyNumber} {charge.playerName}
            </p>

            <div className="mt-2 pt-2 border-t border-emerald-100 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-semibold">{charge.conceptName}</span>
              <span className="text-base font-black text-emerald-800 font-mono">
                {formattedAmount}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
              ¿Por qué medio pagó?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50 text-emerald-900'
                        : `${method.color}`
                    }`}
                  >
                    {method.icon}
                    <span className="flex-1 truncate">{method.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmPayment}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : `Confirmar Pago (${formattedAmount})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
