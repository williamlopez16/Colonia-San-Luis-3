/**
 * Convocatoria Fútbol - Main Application Component
 * Production-ready React + TypeScript + Firebase Firestore
 * High-reliability, mobile-first, Verdolaga branding (San Luis, Antioquia).
 */

import React, { useState, useEffect } from 'react';
import type { Team, Tournament, Player, Concept, Match } from './types';
import {
  subscribeToTeam,
  subscribeToTournaments,
  subscribeToPlayers,
  subscribeToConcepts,
  subscribeToMatches,
  deleteMatch,
  DEFAULT_TEAM_ID,
} from './services/dataService';
import { Header } from './components/Header';
import { MatchList } from './components/MatchList';
import { MatchForm } from './components/MatchForm';
import { MatchAdminView } from './components/MatchAdminView';
import { PlayerManagement } from './components/PlayerManagement';
import { ConceptsCatalog } from './components/ConceptsCatalog';
import { TeamTournamentModal } from './components/TeamTournamentModal';
import { PublicConfirmView } from './components/PublicConfirmView';
import { MatchdayGraphicModal } from './components/MatchdayGraphicModal';
import { OfflineBanner } from './components/OfflineBanner';
import { FirebaseStatusBanner } from './components/FirebaseStatusBanner';

export default function App() {
  // Navigation & Routing state
  const [publicMatchId, setPublicMatchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matches' | 'players' | 'concepts' | 'team'>('matches');

  // Application Data States
  const [team, setTeam] = useState<Team | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  // Sub-views in Match tab
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isCreatingMatch, setIsCreatingMatch] = useState<boolean>(false);
  const [showMatchdayGraphic, setShowMatchdayGraphic] = useState<boolean>(false);
  const [showTeamModal, setShowTeamModal] = useState<boolean>(false);

  // Loading states
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);

  // Parse route on mount and when hash/path changes
  useEffect(() => {
    const parseRoute = () => {
      if (typeof window === 'undefined') return;

      const path = window.location.pathname;
      const hash = window.location.hash;

      // Check path /confirmar/{id}
      const pathMatch = path.match(/\/confirmar\/([a-zA-Z0-9_-]+)/);
      if (pathMatch && pathMatch[1]) {
        setPublicMatchId(pathMatch[1]);
        return;
      }

      // Check hash #confirmar/{id}
      const hashMatch = hash.match(/#confirmar\/([a-zA-Z0-9_-]+)/);
      if (hashMatch && hashMatch[1]) {
        setPublicMatchId(hashMatch[1]);
        return;
      }

      // Root path
      setPublicMatchId(null);
    };

    parseRoute();
    window.addEventListener('hashchange', parseRoute);
    window.addEventListener('popstate', parseRoute);

    return () => {
      window.removeEventListener('hashchange', parseRoute);
      window.removeEventListener('popstate', parseRoute);
    };
  }, []);

  // 1. Subscribe to Team
  useEffect(() => {
    const unsubscribe = subscribeToTeam((loadedTeam) => {
      setTeam(loadedTeam);
      setIsInitialLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Tournaments, Players, Concepts, Matches
  useEffect(() => {
    const currentTeamId = team?.id || DEFAULT_TEAM_ID;

    const unsubTournaments = subscribeToTournaments(currentTeamId, (tList) => {
      setTournaments(tList);
    });

    const unsubPlayers = subscribeToPlayers(currentTeamId, (pList) => {
      setPlayers(pList);
    });

    const unsubConcepts = subscribeToConcepts(currentTeamId, (cList) => {
      setConcepts(cList);
    });

    const unsubMatches = subscribeToMatches(currentTeamId, (mList) => {
      setMatches(mList);
    });

    return () => {
      unsubTournaments();
      unsubPlayers();
      unsubConcepts();
      unsubMatches();
    };
  }, [team?.id]);

  // Selected match for admin view
  const currentAdminMatch = matches.find((m) => m.id === selectedMatchId) || null;

  const handleMatchCreated = (newMatch: Match) => {
    setIsCreatingMatch(false);
    setSelectedMatchId(newMatch.id);
  };

  const handleDeleteMatch = async (matchId: string) => {
    try {
      await deleteMatch(matchId);
      if (selectedMatchId === matchId) {
        setSelectedMatchId(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar partido');
    }
  };

  const handleExitPublicView = () => {
    if (typeof window !== 'undefined') {
      window.location.hash = '';
      window.history.pushState(null, '', '/');
    }
    setPublicMatchId(null);
  };

  // If URL points to public confirmation page: render without navigation headers or auth requirements
  if (publicMatchId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <PublicConfirmView
          matchId={publicMatchId}
          team={team}
          onGoToAdmin={handleExitPublicView}
        />
        <div className="text-center py-4 bg-gray-100/60 border-t border-gray-200">
          <button
            onClick={handleExitPublicView}
            className="text-xs font-semibold text-emerald-800 hover:underline cursor-pointer"
          >
            ← Ir al Panel de Administración del Equipo
          </button>
        </div>
        <OfflineBanner />
      </div>
    );
  }

  // Loading screen
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold">Cargando Convocatoria Fútbol...</h2>
        <p className="text-xs text-emerald-200 mt-1">San Luis, Antioquia 🟢⚪</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Firebase sync status banner */}
      <FirebaseStatusBanner />

      {/* Main App Header with Tabs & Install Button */}
      <Header
        team={team}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setIsCreatingMatch(false);
          setSelectedMatchId(null);
        }}
        onOpenTeamModal={() => setShowTeamModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 pb-16">
        {/* Tab 1: Matches & Callups */}
        {activeTab === 'matches' && (
          <>
            {isCreatingMatch ? (
              <MatchForm
                team={team}
                tournaments={tournaments}
                players={players}
                concepts={concepts}
                onMatchCreated={handleMatchCreated}
                onCancel={() => setIsCreatingMatch(false)}
              />
            ) : currentAdminMatch ? (
              <MatchAdminView
                team={team}
                match={currentAdminMatch}
                onBack={() => setSelectedMatchId(null)}
                onOpenMatchdayGraphic={() => setShowMatchdayGraphic(true)}
              />
            ) : (
              <MatchList
                matches={matches}
                onSelectMatch={(id) => setSelectedMatchId(id)}
                onNewMatch={() => setIsCreatingMatch(true)}
                onDeleteMatch={handleDeleteMatch}
              />
            )}
          </>
        )}

        {/* Tab 2: Players */}
        {activeTab === 'players' && (
          <PlayerManagement team={team} players={players} />
        )}

        {/* Tab 3: Concepts */}
        {activeTab === 'concepts' && (
          <ConceptsCatalog team={team} concepts={concepts} />
        )}

        {/* Tab 4: Team and Tournaments */}
        {activeTab === 'team' && (
          <TeamTournamentModal
            team={team}
            tournaments={tournaments}
            onClose={() => setActiveTab('matches')}
          />
        )}
      </main>

      {/* Modal: Team & Tournament Settings (Opened from Header) */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-6">
            <TeamTournamentModal
              team={team}
              tournaments={tournaments}
              onClose={() => setShowTeamModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal: Matchday Visual Graphic (Canvas 1:1) */}
      {showMatchdayGraphic && currentAdminMatch && (
        <MatchdayGraphicModal
          team={team}
          match={currentAdminMatch}
          onClose={() => setShowMatchdayGraphic(false)}
        />
      )}

      {/* Offline Connectivity Banner */}
      <OfflineBanner />
    </div>
  );
}
