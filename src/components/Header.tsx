import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

export type AppTab = 'home' | 'matches' | 'players' | 'stats' | 'finance' | 'concepts' | 'team';

interface HeaderProps {
  team: Team | null;
  teams?: Team[];
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenTeamModal: () => void;
  onOpenAdminModal: () => void;
  onSelectTeam?: (teamId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  team,
  teams = [],
  activeTab,
  onTabChange,
  onOpenTeamModal,
  onOpenAdminModal,
  onSelectTeam,
}) => {
  const { isAdminMode, lockAdminMode } = useAccessMode();
  const [isTeamMenuOpen, setIsTeamMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleAccessMode = () => {
    if (isAdminMode) {
      lockAdminMode();
    } else {
      onOpenAdminModal();
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsTeamMenuOpen(false);
      }
    };
    if (isTeamMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTeamMenuOpen]);

  return (
    <header className="bg-emerald-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Top bar with team name and quick actions */}
        <div className="flex items-center justify-between py-3 border-b border-emerald-700/60">
          <div className="flex items-center gap-3 relative" ref={menuRef}>
            {/* Official Club Logo Crest */}
            <div
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center p-0.5 shadow-xs border border-emerald-400/40 flex-shrink-0 cursor-pointer overflow-hidden hover:scale-105 transition-transform"
              onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
              title="Cambiar de equipo o configurar"
            >
              <img
                src={(team?.logoUrl && !team.logoUrl.includes('.jpg')) ? team.logoUrl : '/team_logo.png?v=3'}
                alt={team?.name || 'Colonia de San Luis'}
                className="w-full h-full object-contain filter drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>

            <div>
              {/* Team Name with Quick Switcher Trigger */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                  className="font-extrabold text-base sm:text-lg leading-tight hover:text-emerald-200 cursor-pointer transition flex items-center gap-1.5 text-left"
                  title="Toca para cambiar rápidamente entre equipos"
                >
                  <span className="truncate max-w-[190px] sm:max-w-[280px]">{team?.name || 'Mi Equipo de Fútbol'}</span>
                  <ChevronDown className={`w-4 h-4 text-emerald-300 transition-transform ${isTeamMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {teams.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                    className="text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-600/70 shadow-2xs transition cursor-pointer"
                  >
                    {teams.length} equipos
                  </button>
                )}
              </div>

              <p className="text-[11px] sm:text-xs text-emerald-200 font-bold tracking-wider uppercase">
                {team?.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}
              </p>
            </div>

            {/* Quick Team Switcher Dropdown */}
            {isTeamMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in text-gray-900">
                <div className="px-3.5 py-1.5 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    Cambiar de Equipo ({teams.length})
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    1 toque
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto py-1">
                  {teams.map((t) => {
                    const isActive = t.id === team?.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onSelectTeam?.(t.id);
                          setIsTeamMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition cursor-pointer ${
                          isActive
                            ? 'bg-emerald-50/80 text-emerald-950 font-bold'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-gray-100 p-0.5 border border-gray-200 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={(!t.logoUrl || t.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : t.logoUrl}
                              alt=""
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/team_logo.png';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-extrabold truncate">{t.name}</p>
                            <span className="text-[10px] text-gray-500 font-semibold">{t.category || 'Categoría Libre'}</span>
                          </div>
                        </div>

                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1.5 mt-1 border-t border-gray-100 px-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTeamMenuOpen(false);
                      onOpenTeamModal();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 text-xs font-bold transition cursor-pointer"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                    <span>Ver todos los equipos y torneos</span>
                  </button>
                </div>
              </div>
            )}
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
