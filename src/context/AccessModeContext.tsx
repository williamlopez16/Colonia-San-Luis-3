import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Team } from '../types';

interface AccessModeContextType {
  isAdminMode: boolean;
  unlockAdminMode: (password: string) => boolean;
  lockAdminMode: () => void;
}

const AccessModeContext = createContext<AccessModeContextType>({
  isAdminMode: false,
  unlockAdminMode: () => false,
  lockAdminMode: () => {},
});

const STORAGE_KEY = 'convocatoria_admin_unlocked';

interface AccessModeProviderProps {
  children: React.ReactNode;
  team: Team | null;
}

export const AccessModeProvider: React.FC<AccessModeProviderProps> = ({ children, team }) => {
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Restore on mount or storage changes
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored === 'true') {
        setIsAdminMode(true);
      }
    } catch {
      // Ignore sessionStorage disabled
    }
  }, []);

  const unlockAdminMode = (password: string): boolean => {
    const trimmedInput = password.trim();
    if (!trimmedInput) return false;

    // Active team password or fallback 'admin'
    const targetPassword = (team?.adminPassword || 'admin').trim();

    // Match either the configured password or initial fallback 'admin'
    if (trimmedInput === targetPassword || (!team?.adminPassword && (trimmedInput.toLowerCase() === 'admin' || trimmedInput === '1234'))) {
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
      setIsAdminMode(true);
      return true;
    }

    return false;
  };

  const lockAdminMode = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsAdminMode(false);
  };

  return (
    <AccessModeContext.Provider value={{ isAdminMode, unlockAdminMode, lockAdminMode }}>
      {children}
    </AccessModeContext.Provider>
  );
};

export function useAccessMode(): AccessModeContextType {
  const context = useContext(AccessModeContext);
  if (!context) {
    throw new Error('useAccessMode must be used within an AccessModeProvider');
  }
  return context;
}
