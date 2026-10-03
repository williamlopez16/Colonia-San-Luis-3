import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-4 right-4 md:right-auto z-50 flex items-center gap-3 rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white shadow-xl max-w-md animate-bounce"
    >
      <WifiOff className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Sin conexión a Internet</p>
        <p className="text-xs text-amber-100">
          Los datos se guardan de forma local y se sincronizarán al recuperar la conexión.
        </p>
      </div>
    </div>
  );
};
