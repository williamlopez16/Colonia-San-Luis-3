import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, X, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already running as an installed PWA, do not show button
  if (isInstalled) {
    return null;
  }

  // Handle Chrome / Android installation
  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          onClick={handleInstallClick}
          disabled={isInstalling}
          aria-label="Instalar aplicación"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition border border-emerald-500/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isInstalling ? 'Instalando...' : 'Instalar App'}</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSModal(true)}
          aria-label="Instalar en iPhone"
          className="flex items-center gap-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-sm transition border border-emerald-500/30"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>App iPhone</span>
        </button>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-600" />
                Instalar en iPhone o iPad
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <p>
                  Toca el botón <strong className="inline-flex items-center gap-1 text-emerald-700"><Share2 className="w-3.5 h-3.5" /> Compartir</strong> en la barra inferior de Safari.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  2
                </div>
                <p>
                  Desliza hacia abajo y selecciona <strong>«Agregar a pantalla de inicio»</strong>.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <p>
                  Toca <strong>«Agregar»</strong> en la esquina superior derecha. ¡Listo!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
