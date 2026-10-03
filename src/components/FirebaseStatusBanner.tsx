import React, { useState } from 'react';
import { isFirebaseConfigured, activeFirebaseConfig } from '../services/firebaseConfig';
import { isFirestoreOnline } from '../services/dataService';
import { Cloud, CheckCircle2, ChevronRight, X, Info, Copy, Check } from 'lucide-react';

export const FirebaseStatusBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  if (isDismissed) return null;

  const isOnline = isFirestoreOnline();

  const envText = `VITE_FIREBASE_API_KEY="${activeFirebaseConfig.apiKey || ''}"
VITE_FIREBASE_AUTH_DOMAIN="${activeFirebaseConfig.authDomain || ''}"
VITE_FIREBASE_PROJECT_ID="${activeFirebaseConfig.projectId || ''}"
VITE_FIREBASE_DATABASE_ID="${activeFirebaseConfig.databaseId || ''}"
VITE_FIREBASE_STORAGE_BUCKET="${activeFirebaseConfig.storageBucket || ''}"
VITE_FIREBASE_MESSAGING_SENDER_ID="${activeFirebaseConfig.messagingSenderId || ''}"
VITE_FIREBASE_APP_ID="${activeFirebaseConfig.appId || ''}"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <aside aria-label="Información de sincronización" className="bg-emerald-950/90 text-emerald-100 text-xs px-4 py-2 border-b border-emerald-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {isFirebaseConfigured ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Sincronización multidispositivo <strong>Cloud Firestore Activa</strong>.</span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span className="truncate">
                Persistencia activa en tiempo real.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="underline hover:text-white flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver detalles de conexión</span>
            <ChevronRight className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-emerald-400 hover:text-white p-0.5 cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-600" />
                Sincronización en la Nube y Variables para Vercel
              </h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-gray-600">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5 mb-1 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Base de datos Cloud Firestore Conectada
                </p>
                <p>
                  Esta aplicación está configurada con la base de datos centralizada <strong>{activeFirebaseConfig.projectId}</strong> ({activeFirebaseConfig.databaseId}). Toda la información de partidos, jugadores y confirmaciones se guarda en la nube y se sincroniza automáticamente en tiempo real entre todos los dispositivos (computadores, celulares y tablets).
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-gray-800 text-sm">
                    Variables de Entorno para Vercel:
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition font-medium cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar Variables</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="bg-gray-900 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed select-all">
                  {envText}
                </pre>
                <p className="text-gray-500 mt-1.5 text-[11px]">
                  Pega estas variables en tu proyecto de Vercel (<strong>Project Settings &gt; Environment Variables</strong>) para que tu despliegue en producción comparta exactamente la misma base de datos en tiempo real.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
