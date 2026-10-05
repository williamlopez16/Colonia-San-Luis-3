import React from 'react';
import type { Team } from '../types';
import { useAccessMode } from '../context/AccessModeContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Shield,
  Settings2,
  BarChart3,
  Tag,
  Wallet,
  Lock,
  Unlock,
} from 'lucide-react';

export type AppTab = 'home' | 'matches' | 'players' | 'stats' | 'finance' | 'concepts' | 'team';

interface HeaderProps {
  team: Team | null;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenTeamModal: () => void;
  onOpenAdminModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  team,
  activeTab,
  onTabChange,
  onOpenTeamModal,
  onOpenAdminModal,
}) => {
  const { isAdminMode, lockAdminMode } = useAccessMode();

  const handleToggleAccessMode = () => {
    if (isAdminMode) {
      lockAdminMode();
    } else {
      onOpenAdminModal();
    }
  };

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top bar with team name and quick actions */}
        <div className="flex items-center justify-between py-3 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            {/* Verdolaga circular crest */}
            <div
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 shadow-sm border-2 border-emerald-950 flex-shrink-0 cursor-pointer"
              onClick={onOpenTeamModal}
              title="Configurar equipo"
            >
              <div className="w-full h-full rounded-full bg-emerald-700 flex items-center justify-center text-white font-black text-sm">
                ⚽
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  onClick={onOpenTeamModal}
                  className="font-extrabold text-base sm:text-lg leading-tight hover:text-emerald-200 cursor-pointer transition flex items-center gap-1.5"
                >
                  <span>{team?.name || 'Mi Equipo de Fútbol'}</span>
                  <Settings2 className="w-3.5 h-3.5 text-emerald-300 opacity-80" />
                </h1>
              </div>
              <p className="text-[11px] sm:text-xs text-emerald-200 font-bold tracking-wider uppercase">
                {team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Access Mode Lock / Unlock Toggle */}
            <button
              onClick={handleToggleAccessMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-2xs ${
                isAdminMode
                  ? 'bg-amber-400 hover:bg-amber-300 text-amber-950 border-amber-500'
                  : 'bg-emerald-900/80 hover:bg-emerald-700 text-emerald-100 hover:text-white border-emerald-700'
              }`}
              title={
                isAdminMode
                  ? 'Modo Administrador activo. Toca para volver a Modo Jugador.'
                  : 'Modo Jugador (solo lectura). Toca para ingresar clave de Administrador.'
              }
            >
              {isAdminMode ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-950" />
                  <span className="hidden sm:inline">Modo Administrador</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Modo Jugador</span>
                </>
              )}
            </button>

            <PWAInstallButton />
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar text-xs sm:text-sm font-semibold">
          <button
            onClick={() => onTabChange('home')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'home'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          <button
            onClick={() => onTabChange('matches')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'matches'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Partidos y Convocatorias</span>
          </button>

          <button
            onClick={() => onTabChange('players')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'players'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Jugadores</span>
          </button>

          <button
            onClick={() => onTabChange('stats')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Estadísticas</span>
          </button>

          <button
            onClick={() => onTabChange('finance')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'finance'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finanzas</span>
          </button>

          <button
            onClick={() => onTabChange('concepts')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Conceptos</span>
          </button>

          <button
            onClick={() => onTabChange('team')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition whitespace-nowrap cursor-pointer ${
              activeTab === 'team'
                ? 'bg-white text-emerald-900 shadow-sm'
                : 'text-emerald-100 hover:bg-emerald-700/60 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Equipo y Torneos</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
