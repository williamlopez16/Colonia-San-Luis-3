import React, { useState, useEffect, useRef } from 'react';
import { useAccessMode } from '../context/AccessModeContext';
import { Lock, Unlock, Eye, EyeOff, X, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminAccessModal: React.FC<AdminAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { unlockAdminMode } = useAccessMode();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setErrorMessage(null);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const success = unlockAdminMode(password);
    if (success) {
      setPassword('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setErrorMessage('Clave incorrecta. Por favor verifica e intenta nuevamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 animate-scale-up my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Modo Administrador</h3>
              <p className="text-xs text-emerald-200">Gestión técnica y edición</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            Ingresa la clave de administrador/DT para habilitar la creación y edición de partidos, convocatoria, cobros y plantilla.
          </p>

          {/* Quick unlock helper for initial/existing teams */}
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Clave por defecto: <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-bold font-mono text-emerald-900">admin</code></span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Si tu equipo ya estaba creado antes o aún no cambiaste la clave, puedes ingresar inmediatamente con <strong>admin</strong>.
            </p>
            <button
              type="button"
              onClick={() => {
                setPassword('admin');
                const success = unlockAdminMode('admin');
                if (success) {
                  if (onSuccess) onSuccess();
                  onClose();
                } else {
                  setErrorMessage('No se pudo desbloquear con "admin". Ingresa la clave configurada.');
                }
              }}
              className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs"
            >
              Desbloquear con clave "admin"
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Clave de Administrador / DT
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Ingresa la clave..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer"
            >
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
