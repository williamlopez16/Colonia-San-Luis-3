/**
 * Data Service for Convocatoria Fútbol
 * Manages all persistence and real-time synchronization across devices.
 * Uses Cloud Firestore database (ai-studio-convocatoriaftbo-e97628d4-acaf-4ce0-b59f-503104eb0721)
 * with instant local cache for zero latency and offline tolerance.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import type {
  Team,
  Tournament,
  Player,
  Concept,
  Match,
  AttendanceStatus,
  MatchScore,
  MatchState,
  PlayerMatchStats,
  Charge,
  ChargeType,
  ChargeStatus,
  PaymentMethod,
} from '../types';

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Deeply sanitizes any object or array to ensure no `undefined` properties
 * are passed to Firestore setDoc/updateDoc, which strictly rejects `undefined`.
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (value !== undefined) {
        result[key] = cleanForFirestore(value);
      }
    }
    return result as T;
  }
  return data;
}

export function isFirestoreOnline(): boolean {
  return isFirebaseConfigured && db !== null;
}

// Keys for LocalStorage
const STORAGE_KEYS = {
  TEAMS: 'cf_teams_data',
  ACTIVE_TEAM_ID: 'cf_active_team_id',
  TEAM: 'cf_team_data',
  TOURNAMENTS: 'cf_tournaments_data',
  PLAYERS: 'cf_players_data',
  CONCEPTS: 'cf_concepts_data',
  MATCHES: 'cf_matches_data',
  CHARGES: 'cf_charges_data',
};

export const DEFAULT_TEAM_ID = 'team-san-luis-01';

export function getActiveTeamId(): string {
  if (typeof window === 'undefined') return DEFAULT_TEAM_ID;
  const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM_ID);
  if (activeId) return activeId;

  const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
    } catch {
      // fallback
    }
  }
  return DEFAULT_TEAM_ID;
}

export function setActiveTeamId(teamId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, teamId);
  const teams = getLocalTeams();
  const found = teams.find((t) => t.id === teamId);
  if (found) {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(found));
  }
  notifySync('team');
  notifySync('teams');
}

// BroadcastChannel for instant same-browser tab sync
let syncChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new BroadcastChannel('convocatoria_futbol_sync');
  } catch (err) {
    console.warn('BroadcastChannel not supported or restricted:', err);
  }
}

function notifySync(topic: string) {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ topic, timestamp: Date.now() });
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cf_sync', { detail: { topic, timestamp: Date.now() } }));
  }
}

// Initial demo seed data for San Luis, Antioquia
const INITIAL_TEAM: Team = {
  id: DEFAULT_TEAM_ID,
  name: 'Colonia de San Luis',
  category: 'Categoría Libre',
  slogan: 'LA PERLA VERDE DE ANTIOQUIA',
  logoUrl: '/team_logo.png',
  adminPassword: 'admin',
  primaryColor: '#15803d', // Verde
  secondaryColor: '#ffffff', // Blanco
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tour-01',
    teamId: DEFAULT_TEAM_ID,
    name: 'Torneo Municipal San Luis 2026',
    year: '2026',
    description: 'Campeonato local nocturno',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tour-02',
    teamId: DEFAULT_TEAM_ID,
    name: 'Copa Intermunicipal del Oriente',
    year: '2026',
    description: 'Copa regional de fin de semana',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_CONCEPTS: Concept[] = [
  {
    id: 'conc-01',
    teamId: DEFAULT_TEAM_ID,
    name: 'Arbitraje por partido',
    suggestedValue: 12000,
    isDefaultArbitration: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conc-02',
    teamId: DEFAULT_TEAM_ID,
    name: 'Inscripción Torneo',
    suggestedValue: 35000,
    isDefaultArbitration: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'conc-03',
    teamId: DEFAULT_TEAM_ID,
    name: 'Uniforme Oficial Verde y Blanco',
    suggestedValue: 65000,
    isDefaultArbitration: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p-01',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Mateo Gómez',
    jerseyNumber: 1,
    phone: '3001234567',
    idCard: '1020304050',
    eps: 'Sura',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-02',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Carlos Henao',
    jerseyNumber: 4,
    phone: '3109876543',
    idCard: '1030405060',
    eps: 'Nueva EPS',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-03',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Andrés Morales',
    jerseyNumber: 8,
    phone: '3157778899',
    idCard: '1040506070',
    eps: 'Sanitas',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-04',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Juan David Ramírez',
    jerseyNumber: 10,
    phone: '3205551122',
    idCard: '1050607080',
    eps: 'Sura',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-05',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Santiago Restrepo',
    jerseyNumber: 9,
    phone: '3124443322',
    idCard: '1060708090',
    eps: 'Salud Total',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-06',
    teamId: DEFAULT_TEAM_ID,
    fullName: 'Felipe Ceballos',
    jerseyNumber: 7,
    phone: '3183332211',
    idCard: '',
    eps: 'Sura',
    status: 'Activo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to initialize local storage if empty
function initializeLocalStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.TEAM)) {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(INITIAL_TEAM));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEAMS)) {
    const single = localStorage.getItem(STORAGE_KEYS.TEAM);
    const initialList = single ? [JSON.parse(single)] : [INITIAL_TEAM];
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(initialList));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_TEAM_ID)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, DEFAULT_TEAM_ID);
  }
  if (!localStorage.getItem(STORAGE_KEYS.TOURNAMENTS)) {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(INITIAL_TOURNAMENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PLAYERS)) {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(INITIAL_PLAYERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONCEPTS)) {
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(INITIAL_CONCEPTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MATCHES)) {
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify([]));
  }
}

initializeLocalStorage();

// Local storage retrieval helpers
export function getLocalTeams(): Team[] {
  if (typeof window === 'undefined') return [INITIAL_TEAM];
  const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t: Team) => {
          if (!t.logoUrl || t.logoUrl.endsWith('.jpg')) {
            t.logoUrl = '/team_logo.png';
          }
          return t;
        });
      }
    } catch {
      // fallback
    }
  }

  // Fallback to single team in storage
  const single = getLocalTeam();
  const list = [single];
  try {
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(list));
  } catch {}
  return list;
}

function getLocalTeam(): Team {
  if (typeof window === 'undefined') return INITIAL_TEAM;
  const activeId = getActiveTeamId();
  const rawTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (rawTeams) {
    try {
      const teams: Team[] = JSON.parse(rawTeams);
      const found = teams.find((t) => t.id === activeId);
      if (found) {
        if (!found.logoUrl || found.logoUrl.endsWith('.jpg')) {
          found.logoUrl = '/team_logo.png';
        }
        return found;
      }
      if (teams.length > 0) {
        const first = teams[0];
        if (!first.logoUrl || first.logoUrl.endsWith('.jpg')) {
          first.logoUrl = '/team_logo.png';
        }
        return first;
      }
    } catch {}
  }

  const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
  if (!raw) return INITIAL_TEAM;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.logoUrl || parsed.logoUrl.endsWith('.jpg')) {
      parsed.logoUrl = '/team_logo.png';
    }
    return parsed;
  } catch {
    return INITIAL_TEAM;
  }
}

function getLocalTournaments(): Tournament[] {
  if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
  return raw ? JSON.parse(raw) : INITIAL_TOURNAMENTS;
}

function getLocalPlayers(): Player[] {
  if (typeof window === 'undefined') return INITIAL_PLAYERS;
  const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  return raw ? JSON.parse(raw) : INITIAL_PLAYERS;
}

function getLocalConcepts(): Concept[] {
  if (typeof window === 'undefined') return INITIAL_CONCEPTS;
  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
  return raw ? JSON.parse(raw) : INITIAL_CONCEPTS;
}

function getLocalMatches(): Match[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  return raw ? JSON.parse(raw) : [];
}

export function parseRefereeFee(feeStr: string | number | undefined): number {
  if (typeof feeStr === 'number') return Math.max(0, feeStr);
  if (!feeStr) return 0;
  const digitsOnly = feeStr.replace(/[^0-9]/g, '');
  return digitsOnly ? parseInt(digitsOnly, 10) : 0;
}

export function getLocalCharges(): Charge[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  return raw ? JSON.parse(raw) : [];
}

// ==========================================
// 1. TEAM OPERATIONS (MULTI-TEAM SUPPORT)
// ==========================================

export function subscribeToTeams(callback: (teams: Team[]) => void): Unsubscribe {
  callback(getLocalTeams());

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'teams' || e.data?.topic === 'team') callback(getLocalTeams());
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TEAMS || e.key === STORAGE_KEYS.TEAM) callback(getLocalTeams());
  };
  const handleCfSync = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.topic === 'teams' || detail?.topic === 'team') callback(getLocalTeams());
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
  window.addEventListener('cf_sync', handleCfSync);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'teams'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList = snapshot.docs.map((d) => {
              const data = d.data() as Team;
              if (!data.logoUrl || data.logoUrl.endsWith('.jpg')) {
                data.logoUrl = '/team_logo.png';
              }
              return data;
            });
            localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(remoteList));
            
            // Check active team
            const activeId = getActiveTeamId();
            const currentActive = remoteList.find((t) => t.id === activeId) || remoteList[0];
            if (currentActive) {
              localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(currentActive));
              localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, currentActive.id);
            }
            callback(remoteList);
          } else {
            const currentLocal = getLocalTeams();
            currentLocal.forEach((t) => {
              setDoc(doc(targetDb, 'teams', t.id), cleanForFirestore(t)).catch(() => {});
            });
          }
        },
        (error) => {
          console.warn('Teams firestore subscription warning:', error);
          callback(getLocalTeams());
        }
      );
    } catch (err) {
      console.warn('Teams firestore error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('cf_sync', handleCfSync);
  };
}

export function subscribeToTeam(callback: (team: Team | null) => void): Unsubscribe {
  const localTeam = getLocalTeam();
  callback(localTeam);

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'team' || e.data?.topic === 'teams') callback(getLocalTeam());
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TEAM || e.key === STORAGE_KEYS.TEAMS || e.key === STORAGE_KEYS.ACTIVE_TEAM_ID) {
      callback(getLocalTeam());
    }
  };
  const handleCfSync = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail?.topic === 'team' || detail?.topic === 'teams') callback(getLocalTeam());
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);
  window.addEventListener('cf_sync', handleCfSync);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'teams'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList = snapshot.docs.map((d) => {
              const data = d.data() as Team;
              if (!data.logoUrl || data.logoUrl.endsWith('.jpg')) {
                data.logoUrl = '/team_logo.png';
              }
              return data;
            });
            localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(remoteList));
            const activeId = getActiveTeamId();
            const matchingTeam = remoteList.find((t) => t.id === activeId) || remoteList[0];
            if (matchingTeam) {
              localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(matchingTeam));
              callback(matchingTeam);
            }
          } else {
            const currentLocal = getLocalTeam();
            if (currentLocal) {
              setDoc(doc(targetDb, 'teams', currentLocal.id), cleanForFirestore(currentLocal)).catch(() => {});
            }
          }
        },
        (error) => {
          console.warn('Team firestore subscription warning:', error);
          callback(getLocalTeam());
        }
      );
    } catch (err) {
      console.warn('Team firestore error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('cf_sync', handleCfSync);
  };
}

export async function saveTeam(team: Team): Promise<void> {
  const updatedTeam: Team = {
    ...team,
    id: team.id || generateUUID(),
    logoUrl: (!team.logoUrl || team.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : team.logoUrl,
    updatedAt: new Date().toISOString(),
  };

  // Update in teams list
  const currentTeams = getLocalTeams();
  const existingIdx = currentTeams.findIndex((t) => t.id === updatedTeam.id);
  let updatedList: Team[];
  if (existingIdx >= 0) {
    updatedList = [...currentTeams];
    updatedList[existingIdx] = updatedTeam;
  } else {
    updatedList = [...currentTeams, updatedTeam];
  }
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedList));

  // If this is the active team, update active storage
  if (updatedTeam.id === getActiveTeamId() || currentTeams.length === 0) {
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(updatedTeam));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, updatedTeam.id);
  }

  notifySync('team');
  notifySync('teams');

  // Push to Cloud Firestore
  const targetDb = db;
  if (targetDb) {
    try {
      const teamRef = doc(targetDb, 'teams', updatedTeam.id);
      await setDoc(teamRef, cleanForFirestore(updatedTeam));
    } catch (err) {
      console.warn('Error saving team to Firestore:', err);
    }
  }
}

export async function createTeam(newTeamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
  const newTeam: Team = {
    ...newTeamData,
    id: generateUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    logoUrl: (!newTeamData.logoUrl || newTeamData.logoUrl.endsWith('.jpg')) ? '/team_logo.png' : newTeamData.logoUrl,
  };

  await saveTeam(newTeam);
  setActiveTeamId(newTeam.id);

  // Initialize a default Arbitraje concept for this new team
  const defaultConcept: Concept = {
    id: generateUUID(),
    teamId: newTeam.id,
    name: 'Arbitraje',
    suggestedValue: 12000,
    isDefaultArbitration: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await saveConcept(defaultConcept);

  return newTeam;
}

export async function deleteTeam(teamId: string): Promise<void> {
  const currentTeams = getLocalTeams();
  if (currentTeams.length <= 1) {
    throw new Error('No se puede eliminar el único equipo registrado. Debe haber al menos un equipo en la app.');
  }

  const updatedList = currentTeams.filter((t) => t.id !== teamId);
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(updatedList));

  if (teamId === getActiveTeamId()) {
    const nextActive = updatedList[0];
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEAM_ID, nextActive.id);
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(nextActive));
  }

  notifySync('team');
  notifySync('teams');

  const targetDb = db;
  if (targetDb) {
    try {
      await deleteDoc(doc(targetDb, 'teams', teamId));
    } catch (err) {
      console.warn('Error deleting team from Firestore:', err);
    }
  }

  // Also clean up team-specific data in localStorage and Firestore
  try {
    // 1. Tournaments
    const rawTournaments = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    if (rawTournaments) {
      const list: Tournament[] = JSON.parse(rawTournaments);
      const teamTournaments = list.filter((t) => t.teamId === teamId);
      for (const t of teamTournaments) {
        await deleteTournament(t.id);
      }
    }
    // 2. Players
    const rawPlayers = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (rawPlayers) {
      const list: Player[] = JSON.parse(rawPlayers);
      const teamPlayers = list.filter((p) => p.teamId === teamId);
      for (const p of teamPlayers) {
        await deletePlayer(p.id);
      }
    }
    // 3. Matches
    const rawMatches = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (rawMatches) {
      const list: Match[] = JSON.parse(rawMatches);
      const teamMatches = list.filter((m) => m.teamId === teamId);
      for (const m of teamMatches) {
        await deleteMatch(m.id);
      }
    }
    // 4. Charges
    const rawCharges = localStorage.getItem(STORAGE_KEYS.CHARGES);
    if (rawCharges) {
      const list: Charge[] = JSON.parse(rawCharges);
      const teamCharges = list.filter((c) => c.teamId === teamId);
      for (const c of teamCharges) {
        await deleteCharge(c.id);
      }
    }
    // 5. Concepts
    const rawConcepts = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    if (rawConcepts) {
      const list: Concept[] = JSON.parse(rawConcepts);
      const teamConcepts = list.filter((c) => c.teamId === teamId);
      for (const c of teamConcepts) {
        await deleteConcept(c.id);
      }
    }
  } catch (err) {
    console.warn('Error cleaning up data for deleted team:', err);
  }
}

// ==========================================
// 2. TOURNAMENTS OPERATIONS
// ==========================================

export function subscribeToTournaments(
  teamId: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe {
  const filterByTeam = (list: Tournament[]) => {
    if (!teamId) return list;
    return list.filter((t) => {
      // Discriminate tournaments strictly per team
      if (t.teamId) {
        return t.teamId === teamId;
      }
      return teamId === DEFAULT_TEAM_ID;
    });
  };

  callback(filterByTeam(getLocalTournaments()));

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'tournaments') callback(filterByTeam(getLocalTournaments()));
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TOURNAMENTS) callback(filterByTeam(getLocalTournaments()));
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'tournaments'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => d.data() as Tournament);
          const rawLocal = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
          if (snapshot.empty && rawLocal === null) {
            const initial = INITIAL_TOURNAMENTS;
            localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(initial));
            initial.forEach((t) => {
              setDoc(doc(targetDb, 'tournaments', t.id), cleanForFirestore(t)).catch(() => {});
            });
            callback(filterByTeam(initial));
          } else {
            localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(remoteList));
            callback(filterByTeam(remoteList));
          }
        },
        (error) => {
          console.warn('Tournaments snapshot warning:', error);
          callback(filterByTeam(getLocalTournaments()));
        }
      );
    } catch (err) {
      console.warn('Tournaments listen error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveTournament(tournament: Tournament): Promise<void> {
  const updated: Tournament = {
    ...tournament,
    id: tournament.id || generateUUID(),
    teamId: tournament.teamId || getActiveTeamId(),
    updatedAt: new Date().toISOString(),
  };

  const currentList = getLocalTournaments();
  const index = currentList.findIndex((t) => t.id === updated.id);
  let updatedList: Tournament[];
  if (index >= 0) {
    updatedList = [...currentList];
    updatedList[index] = updated;
  } else {
    updatedList = [...currentList, updated];
  }

  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(updatedList));
  notifySync('tournaments');

  const targetDb = db;
  if (targetDb) {
    try {
      const docRef = doc(targetDb, 'tournaments', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
    } catch (err) {
      console.warn('Error saving tournament to Firestore:', err);
    }
  }
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  const currentList = getLocalTournaments();
  const filtered = currentList.filter((t) => t.id !== tournamentId);
  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(filtered));
  notifySync('tournaments');

  const targetDb = db;
  if (targetDb) {
    try {
      await deleteDoc(doc(targetDb, 'tournaments', tournamentId));
    } catch (err) {
      console.warn('Error deleting tournament from Firestore:', err);
    }
  }
}

// ==========================================
// 3. PLAYERS OPERATIONS
// ==========================================

export function subscribeToPlayers(
  teamId: string,
  callback: (players: Player[]) => void
): Unsubscribe {
  const filterByTeam = (list: Player[]) => {
    if (!teamId) return list;
    return list.filter((p) => {
      if (p.teamId) return p.teamId === teamId;
      return teamId === DEFAULT_TEAM_ID;
    });
  };

  const deliver = (rawList: Player[]) => {
    const filtered = filterByTeam(rawList);
    filtered.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    callback(filtered);
  };

  deliver(getLocalPlayers());

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'players') {
      deliver(getLocalPlayers());
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.PLAYERS) {
      deliver(getLocalPlayers());
    }
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'players'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList = snapshot.docs.map((d) => d.data() as Player);
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(remoteList));
            deliver(remoteList);
          } else {
            const currentLocal = getLocalPlayers();
            if (currentLocal.length > 0) {
              currentLocal.forEach((p) => {
                setDoc(doc(targetDb, 'players', p.id), cleanForFirestore(p)).catch(() => {});
              });
            }
            deliver(currentLocal);
          }
        },
        (error) => {
          console.warn('Players snapshot warning:', error);
          deliver(getLocalPlayers());
        }
      );
    } catch (err) {
      console.warn('Players listen error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function savePlayer(player: Player): Promise<void> {
  const activeId = getActiveTeamId();
  const updated: Player = {
    ...player,
    id: player.id || generateUUID(),
    teamId: player.teamId || activeId,
    updatedAt: new Date().toISOString(),
  };

  const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  let list: Player[] = raw ? JSON.parse(raw) : INITIAL_PLAYERS;
  const index = list.findIndex((p) => p.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.push(updated);
  }
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(list));
  notifySync('players');

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'players', updated.id);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function deletePlayer(playerId: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (raw) {
    const list: Player[] = JSON.parse(raw);
    const filtered = list.filter((p) => p.id !== playerId);
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(filtered));
    notifySync('players');
  }

  const targetDb = db;
  if (targetDb) {
    await deleteDoc(doc(targetDb, 'players', playerId));
  }

  // Clean up pending charges for this player
  try {
    const charges = getLocalCharges();
    const pendingPlayerCharges = charges.filter(
      (c) => c.playerId === playerId && c.status === 'Pendiente'
    );
    for (const c of pendingPlayerCharges) {
      await deleteCharge(c.id);
    }
  } catch (err) {
    console.warn('Error cleaning up charges for deleted player:', err);
  }
}

// ==========================================
// 4. CONCEPTS OPERATIONS
// ==========================================

export function subscribeToConcepts(
  teamId: string,
  callback: (concepts: Concept[]) => void
): Unsubscribe {
  const filterByTeam = (list: Concept[]) => {
    if (!teamId) return list;
    return list.filter((c) => {
      if (c.teamId) return c.teamId === teamId;
      return teamId === DEFAULT_TEAM_ID;
    });
  };

  callback(filterByTeam(getLocalConcepts()));

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'concepts') callback(filterByTeam(getLocalConcepts()));
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.CONCEPTS) callback(filterByTeam(getLocalConcepts()));
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'concepts'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteList = snapshot.docs.map((d) => d.data() as Concept);
            localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(remoteList));
            callback(filterByTeam(remoteList));
          } else {
            const currentLocal = getLocalConcepts();
            if (currentLocal.length > 0) {
              currentLocal.forEach((c) => {
                setDoc(doc(targetDb, 'concepts', c.id), cleanForFirestore(c)).catch(() => {});
              });
            }
            callback(filterByTeam(currentLocal));
          }
        },
        (error) => {
          console.warn('Concepts snapshot warning:', error);
          callback(filterByTeam(getLocalConcepts()));
        }
      );
    } catch (err) {
      console.warn('Concepts listen error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveConcept(concept: Concept): Promise<void> {
  const activeId = getActiveTeamId();
  const updated: Concept = {
    ...concept,
    id: concept.id || generateUUID(),
    teamId: concept.teamId || activeId,
    updatedAt: new Date().toISOString(),
  };

  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
  let list: Concept[] = raw ? JSON.parse(raw) : INITIAL_CONCEPTS;

  if (updated.isDefaultArbitration) {
    list = list.map((c) => ({
      ...c,
      isDefaultArbitration: c.id === updated.id,
    }));
  }

  const index = list.findIndex((c) => c.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.push(updated);
  }
  localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(list));
  notifySync('concepts');

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'concepts', updated.id);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function deleteConcept(conceptId: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
  if (raw) {
    const list: Concept[] = JSON.parse(raw);
    const filtered = list.filter((c) => c.id !== conceptId);
    localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(filtered));
    notifySync('concepts');
  }

  const targetDb = db;
  if (targetDb) {
    await deleteDoc(doc(targetDb, 'concepts', conceptId));
  }
}

// ==========================================
// 5. MATCHES OPERATIONS & REAL-TIME CALLUP
// ==========================================

export function subscribeToMatches(
  teamId: string,
  callback: (matches: Match[]) => void
): Unsubscribe {
  const filterByTeam = (list: Match[]) => {
    if (!teamId) return list;
    return list.filter((m) => {
      if (m.teamId) return m.teamId === teamId;
      return teamId === DEFAULT_TEAM_ID;
    });
  };

  const deliver = (rawList: Match[]) => {
    const filtered = filterByTeam(rawList);
    filtered.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
    callback(filtered);
  };

  // 1. Deliver local cached matches if any exist
  deliver(getLocalMatches());

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'matches') {
      deliver(getLocalMatches());
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MATCHES) {
      deliver(getLocalMatches());
    }
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  // 2. Connect to Cloud Firestore in real time
  if (targetDb) {
    try {
      firestoreUnsub = onSnapshot(
        collection(targetDb, 'matches'),
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => d.data() as Match);
          remoteList.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());

          // Save to local cache so next reload is instant
          localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(remoteList));
          deliver(remoteList);

          // If cloud has zero matches, but local has unsynced matches, upload them to cloud
          if (snapshot.empty) {
            const currentLocal = getLocalMatches();
            if (currentLocal.length > 0) {
              currentLocal.forEach((m) => {
                setDoc(doc(targetDb, 'matches', m.id), cleanForFirestore(m)).catch(() => {});
              });
            }
          }
        },
        (error) => {
          console.warn('Matches Cloud Firestore subscription warning:', error);
          deliver(getLocalMatches());
        }
      );
    } catch (err) {
      console.warn('Matches listen error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export function subscribeToMatch(
  matchId: string,
  callback: (match: Match | null) => void
): Unsubscribe {
  if (!matchId || typeof matchId !== 'string') {
    callback(null);
    return () => {};
  }

  // 1. Deliver local match IF AND ONLY IF it exists (do NOT call callback(null) yet!)
  const localList = getLocalMatches();
  const localFound = localList.find((m) => m.id === matchId) || null;
  if (localFound) {
    callback(localFound);
  }

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'matches' || e.data?.topic === `match_${matchId}`) {
      const list = getLocalMatches();
      const found = list.find((m) => m.id === matchId) || null;
      if (found) callback(found);
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MATCHES) {
      const list = getLocalMatches();
      const found = list.find((m) => m.id === matchId) || null;
      if (found) callback(found);
    }
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  // 2. Fetch/listen directly from Cloud Firestore
  if (targetDb) {
    try {
      const matchDocRef = doc(targetDb, 'matches', matchId);
      firestoreUnsub = onSnapshot(
        matchDocRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Match;
            // Update local copy
            const list = getLocalMatches();
            const idx = list.findIndex((m) => m.id === matchId);
            if (idx >= 0) list[idx] = data;
            else list.unshift(data);
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
            callback(data);
          } else {
            // Firestore explicitly confirms document does NOT exist
            const list = getLocalMatches();
            const fallback = list.find((m) => m.id === matchId) || null;
            callback(fallback);
          }
        },
        (error) => {
          console.warn(`match_${matchId} snapshot warning:`, error);
          const list = getLocalMatches();
          const fallback = list.find((m) => m.id === matchId) || null;
          callback(fallback);
        }
      );
    } catch (err) {
      console.warn(`match_${matchId} listen error:`, err);
      const list = getLocalMatches();
      const fallback = list.find((m) => m.id === matchId) || null;
      callback(fallback);
    }
  } else {
    // If no db, return local fallback
    callback(localFound);
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveMatch(match: Match): Promise<void> {
  const activeId = getActiveTeamId();
  const updated: Match = {
    ...match,
    id: match.id || generateUUID(),
    teamId: match.teamId || activeId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Optimistic local update
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  let list: Match[] = raw ? JSON.parse(raw) : [];
  const index = list.findIndex((m) => m.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${updated.id}`);

  // 2. Push directly to Cloud Firestore and wait for confirmation
  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'matches', updated.id);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function deleteMatch(matchId: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  if (raw) {
    const list: Match[] = JSON.parse(raw);
    const filtered = list.filter((m) => m.id !== matchId);
    localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(filtered));
    notifySync('matches');
  }

  const targetDb = db;
  if (targetDb) {
    await deleteDoc(doc(targetDb, 'matches', matchId));
  }

  // Clean up pending arbitraje charges associated with this match
  try {
    const charges = getLocalCharges();
    const pendingMatchCharges = charges.filter(
      (c) => c.matchId === matchId && c.type === 'arbitraje' && c.status === 'Pendiente'
    );
    for (const c of pendingMatchCharges) {
      await deleteCharge(c.id);
    }
  } catch (err) {
    console.warn('Error cleaning up charges for deleted match:', err);
  }
}

/**
 * Save match result and player match statistics (goals, assists, cards)
 */
export async function saveMatchStats(
  matchId: string,
  score: MatchScore,
  matchState: MatchState,
  playerStats: PlayerMatchStats[]
): Promise<void> {
  const targetDb = db;
  let matchToUpdate: Match | null = null;

  if (targetDb) {
    try {
      const docRef = doc(targetDb, 'matches', matchId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        matchToUpdate = snap.data() as Match;
      }
    } catch (err) {
      console.warn('Error reading match for stats update:', err);
    }
  }

  if (!matchToUpdate) {
    const list = getLocalMatches();
    matchToUpdate = list.find((m) => m.id === matchId) || null;
  }

  if (!matchToUpdate) {
    throw new Error('Partido no encontrado para guardar estadísticas');
  }

  matchToUpdate.score = score;
  matchToUpdate.matchState = matchState;
  matchToUpdate.playerStats = playerStats;
  matchToUpdate.updatedAt = new Date().toISOString();

  await saveMatch(matchToUpdate);
}

/**
 * Public player confirmation from mobile phone or admin attendance update
 */
export async function updatePlayerAttendance(
  matchId: string,
  playerId: string,
  newStatus: AttendanceStatus,
  reason?: string
): Promise<void> {
  const targetDb = db;
  let matchToUpdate: Match | null = null;

  // 1. Try fetching from Cloud Firestore first
  if (targetDb) {
    try {
      const docRef = doc(targetDb, 'matches', matchId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        matchToUpdate = snap.data() as Match;
      }
    } catch (err) {
      console.warn('getDoc for attendance error:', err);
    }
  }

  // 2. Fallback to local storage if not fetched from cloud
  if (!matchToUpdate) {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
    const list: Match[] = raw ? JSON.parse(raw) : [];
    const found = list.find((m) => m.id === matchId);
    if (found) matchToUpdate = JSON.parse(JSON.stringify(found));
  }

  if (!matchToUpdate) {
    throw new Error('Partido no encontrado o enlace inválido.');
  }

  if (matchToUpdate.status === 'Cerrada') {
    throw new Error('La convocatoria para este partido ya ha sido cerrada por el administrador.');
  }

  const callupIndex = matchToUpdate.callups.findIndex((c) => c.playerId === playerId);
  if (callupIndex === -1) {
    throw new Error('El jugador no forma parte de la convocatoria de este partido.');
  }

  matchToUpdate.callups[callupIndex] = {
    ...matchToUpdate.callups[callupIndex],
    status: newStatus,
    reason: newStatus === 'No asiste' ? reason || 'No especificado' : undefined,
    confirmedAt: new Date().toISOString(),
  };
  matchToUpdate.updatedAt = new Date().toISOString();

  // Save to Cloud Firestore first so all devices receive it instantly
  if (targetDb) {
    const docRef = doc(targetDb, 'matches', matchId);
    await setDoc(docRef, cleanForFirestore(matchToUpdate));
  }

  // Save to local cache and notify tabs
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  const matchIndex = list.findIndex((m) => m.id === matchId);
  if (matchIndex >= 0) list[matchIndex] = matchToUpdate;
  else list.unshift(matchToUpdate);
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${matchId}`);
}

/**
 * Close match callup (fixes final attendance)
 */
export async function closeMatchCallup(matchId: string): Promise<Match> {
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  const matchIndex = list.findIndex((m) => m.id === matchId);

  if (matchIndex === -1) {
    throw new Error('Partido no encontrado');
  }

  const match = list[matchIndex];
  match.status = 'Cerrada';
  match.updatedAt = new Date().toISOString();

  list[matchIndex] = match;
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${matchId}`);

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'matches', matchId);
    await setDoc(docRef, cleanForFirestore(match));
  }

  return match;
}

/**
 * Reopen match callup
 */
export async function reopenMatchCallup(matchId: string): Promise<Match> {
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  const matchIndex = list.findIndex((m) => m.id === matchId);

  if (matchIndex === -1) {
    throw new Error('Partido no encontrado');
  }

  const match = list[matchIndex];
  match.status = 'Abierta';
  match.updatedAt = new Date().toISOString();

  list[matchIndex] = match;
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${matchId}`);

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'matches', matchId);
    await setDoc(docRef, cleanForFirestore(match));
  }

  return match;
}

// ==========================================
// 6. CHARGES & FINANCIAL OPERATIONS
// ==========================================

export function subscribeToCharges(
  teamId: string,
  callback: (charges: Charge[]) => void
): Unsubscribe {
  const filterByTeam = (list: Charge[]) => {
    if (!teamId) return list;
    return list.filter((c) => {
      if (c.teamId) return c.teamId === teamId;
      return teamId === DEFAULT_TEAM_ID;
    });
  };

  const deliver = (rawList: Charge[]) => {
    const filtered = filterByTeam(rawList);
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(filtered);
  };

  // 1. Initial cached data
  deliver(getLocalCharges());

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'charges') {
      deliver(getLocalCharges());
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.CHARGES) {
      deliver(getLocalCharges());
    }
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  // 2. Real-time Firestore sync
  if (targetDb) {
    try {
      firestoreUnsub = onSnapshot(
        collection(targetDb, 'charges'),
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => d.data() as Charge);
          localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(remoteList));
          deliver(remoteList);

          // If remote is empty but local has unsynced charges, upload them
          if (snapshot.empty) {
            const currentLocal = getLocalCharges();
            if (currentLocal.length > 0) {
              currentLocal.forEach((c) => {
                setDoc(doc(targetDb, 'charges', c.id), cleanForFirestore(c)).catch(() => {});
              });
            }
          }
        },
        (error) => {
          console.warn('Charges Cloud Firestore subscription warning:', error);
          deliver(getLocalCharges());
        }
      );
    } catch (err) {
      console.warn('Charges listen error:', err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveCharge(charge: Charge): Promise<void> {
  const activeId = getActiveTeamId();
  const updated: Charge = {
    ...charge,
    id: charge.id || generateUUID(),
    teamId: charge.teamId || activeId,
    updatedAt: new Date().toISOString(),
  };

  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  let list: Charge[] = raw ? JSON.parse(raw) : [];
  const index = list.findIndex((c) => c.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }

  localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(list));
  notifySync('charges');

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'charges', updated.id);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function saveChargesBatch(charges: Charge[]): Promise<void> {
  if (charges.length === 0) return;
  const activeId = getActiveTeamId();

  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  let list: Charge[] = raw ? JSON.parse(raw) : [];

  const now = new Date().toISOString();
  const prepared: Charge[] = charges.map((c) => ({
    ...c,
    id: c.id || generateUUID(),
    teamId: c.teamId || activeId,
    createdAt: c.createdAt || now,
    updatedAt: now,
  }));

  prepared.forEach((item) => {
    const index = list.findIndex((c) => c.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
  });

  localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(list));
  notifySync('charges');

  const targetDb = db;
  if (targetDb) {
    for (const item of prepared) {
      const docRef = doc(targetDb, 'charges', item.id);
      await setDoc(docRef, cleanForFirestore(item));
    }
  }
}

export async function markChargePaid(
  chargeId: string,
  paymentMethod: PaymentMethod,
  notes?: string
): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  let list: Charge[] = raw ? JSON.parse(raw) : [];
  const charge = list.find((c) => c.id === chargeId);

  if (!charge) {
    throw new Error('Cobro no encontrado');
  }

  const updated: Charge = {
    ...charge,
    status: 'Pagado',
    paymentMethod,
    notes: notes !== undefined ? (notes.trim() || undefined) : charge.notes,
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const index = list.findIndex((c) => c.id === chargeId);
  list[index] = updated;
  localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(list));
  notifySync('charges');

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'charges', chargeId);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function markChargePending(chargeId: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  let list: Charge[] = raw ? JSON.parse(raw) : [];
  const charge = list.find((c) => c.id === chargeId);

  if (!charge) {
    throw new Error('Cobro no encontrado');
  }

  const updated: Charge = {
    ...charge,
    status: 'Pendiente',
    paymentMethod: undefined,
    paidAt: undefined,
    updatedAt: new Date().toISOString(),
  };

  const index = list.findIndex((c) => c.id === chargeId);
  list[index] = updated;
  localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(list));
  notifySync('charges');

  const targetDb = db;
  if (targetDb) {
    const docRef = doc(targetDb, 'charges', chargeId);
    await setDoc(docRef, cleanForFirestore(updated));
  }
}

export async function deleteCharge(chargeId: string): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.CHARGES);
  if (raw) {
    const list: Charge[] = JSON.parse(raw);
    const filtered = list.filter((c) => c.id !== chargeId);
    localStorage.setItem(STORAGE_KEYS.CHARGES, JSON.stringify(filtered));
    notifySync('charges');
  }

  const targetDb = db;
  if (targetDb) {
    await deleteDoc(doc(targetDb, 'charges', chargeId));
  }
}

/**
 * Automatically syncs referee fee charges for a match.
 * Generates/updates charges following strict financial rules:
 * - 1 Charge of type 'arbitraje' per called-up player with amount = parseRefereeFee(match.refereeFee)
 * - If callup list changes:
 *   - New player added: creates a new pending charge
 *   - Player removed: deletes the pending charge (keeps paid ones)
 * - If referee fee changes:
 *   - Updates amount for pending charges (leaves paid charges untouched)
 */
export async function syncMatchRefereeCharges(match: Match): Promise<void> {
  const amount = parseRefereeFee(match.refereeFee);
  const targetDb = db;

  let allCharges: Charge[] = [];

  if (targetDb) {
    try {
      const snap = await getDocs(collection(targetDb, 'charges'));
      allCharges = snap.docs.map((d) => d.data() as Charge);
    } catch {
      allCharges = getLocalCharges();
    }
  } else {
    allCharges = getLocalCharges();
  }

  // Charges belonging to this match
  const existingMatchCharges = allCharges.filter(
    (c) => c.matchId === match.id && c.type === 'arbitraje'
  );

  const currentCallupMap = new Map(match.callups.map((c) => [c.playerId, c]));
  const existingPlayerMap = new Map(existingMatchCharges.map((c) => [c.playerId, c]));

  // 1. Remove pending charges for players no longer in callups
  for (const existingCharge of existingMatchCharges) {
    if (!currentCallupMap.has(existingCharge.playerId)) {
      if (existingCharge.status === 'Pendiente') {
        await deleteCharge(existingCharge.id);
      }
    }
  }

  // 2. Update fee for existing pending charges if referee fee changed
  for (const existingCharge of existingMatchCharges) {
    if (currentCallupMap.has(existingCharge.playerId)) {
      if (existingCharge.status === 'Pendiente' && existingCharge.amount !== amount) {
        await saveCharge({
          ...existingCharge,
          amount,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  }

  // 3. Create new charges for newly added players
  const newCharges: Charge[] = [];
  const now = new Date().toISOString();

  for (const callup of match.callups) {
    if (!existingPlayerMap.has(callup.playerId)) {
      newCharges.push({
        id: generateUUID(),
        teamId: match.teamId,
        playerId: callup.playerId,
        playerName: callup.fullName,
        jerseyNumber: callup.jerseyNumber,
        conceptName: 'Arbitraje',
        type: 'arbitraje',
        matchId: match.id,
        amount,
        status: 'Pendiente',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (newCharges.length > 0) {
    await saveChargesBatch(newCharges);
  }
}
