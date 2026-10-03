import React, { useState } from 'react';
import { isFirebaseConfigured } from '../services/firebaseConfig';
import { isFirestoreOnline } from '../services/dataService';
import { Cloud, CheckCircle2, ChevronRight, X, Info, WifiOff } from 'lucide-react';

export const FirebaseStatusBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  if (isDismissed) return null;

  const isOnline = isFirestoreOnline();

  return (
    <>
      <aside aria-label="Información de sincronización" className="bg-emerald-950/90 text-emerald-100 text-xs px-4 py-2 border-b border-emerald-800/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          {isFirebaseConfigured && isOnline ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">Sincronización en la nube <strong>Firebase Firestore Activa</strong>.</span>
            </>
          ) : isFirebaseConfigured && !isOnline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span className="truncate">
                Persistencia local activa. <strong>Firestore en modo sin conexión / pendiente de inicializar base de datos</strong>.
              </span>
            </>
          ) : (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <span className="truncate">
                Persistencia activa en tiempo real. <strong>Listo para desplegar en Vercel con Firestore</strong>.
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowConfigModal(true)}
            className="underline hover:text-white flex items-center gap-0.5 cursor-pointer"
          >
            <span>Ver detalles</span>
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
                Configuración y Estado de Firebase
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
                  <Info className="w-4 h-4" /> Estado actual de la aplicación
                </p>
                <p>
                  {isFirebaseConfigured && isOnline
                    ? 'Tu proyecto está conectado directamente a Firebase Firestore en la nube.'
                    : isFirebaseConfigured && !isOnline
                    ? 'La configuración de Firebase está detectada. Actualmente el backend de Firestore no está respondiendo o la base de datos (default) aún no ha sido creada en la consola de Firebase. La app continúa guardando y sincronizando todo en tiempo real de forma local.'
                    : 'La aplicación está funcionando con almacenamiento local reactivo + sincronización en tiempo real entre pestañas (BroadcastChannel). Si configuras las variables en Vercel, se conectará automáticamente a Firebase Firestore.'}
                </p>
              </div>

              {isFirebaseConfigured && !isOnline && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
                  <p className="font-bold mb-1 text-xs">Para habilitar Cloud Firestore en tu proyecto Firebase:</p>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                    <li>Ingresa a la consola de Firebase con tu cuenta de Google.</li>
                    <li>Ve a tu proyecto y selecciona <strong>Firestore Database</strong>.</li>
                    <li>Haz clic en <strong>Crear base de datos</strong> (modo de producción o prueba) con ID <code>(default)</code>.</li>
                    <li>¡Listo! La aplicación detectará automáticamente la base de datos.</li>
                  </ol>
                </div>
              )}

              <div>
                <p className="font-bold text-gray-800 mb-1.5 text-sm">
                  Variables de Entorno para Vercel:
                </p>
                <pre className="bg-gray-900 text-emerald-400 p-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
{`VITE_FIREBASE_API_KEY="tu_api_key"
VITE_FIREBASE_AUTH_DOMAIN="tu-proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu-proyecto"
VITE_FIREBASE_STORAGE_BUCKET="tu-proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
VITE_FIREBASE_APP_ID="tu_app_id"`}
                </pre>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1 text-sm">
                  Reglas de Seguridad listas (firestore.rules):
                </p>
                <p>
                  El proyecto ya incluye el archivo <code className="bg-gray-100 px-1 py-0.5 rounded font-mono text-emerald-700">firestore.rules</code> con validación estricta de documentos y esquemas para despliegue directo con <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">firebase deploy --only firestore:rules</code>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
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
