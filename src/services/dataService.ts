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
  TEAM: 'cf_team_data',
  TOURNAMENTS: 'cf_tournaments_data',
  PLAYERS: 'cf_players_data',
  CONCEPTS: 'cf_concepts_data',
  MATCHES: 'cf_matches_data',
};

export const DEFAULT_TEAM_ID = 'team-san-luis-01';

export function getActiveTeamId(): string {
  if (typeof window === 'undefined') return DEFAULT_TEAM_ID;
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
    syncChannel.postMessage({ topic, timestamp: Date.now() });
  }
}

// Initial demo seed data for San Luis, Antioquia
const INITIAL_TEAM: Team = {
  id: DEFAULT_TEAM_ID,
  name: 'Club San Luis',
  category: 'Categoría Libre',
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
function getLocalTeam(): Team {
  if (typeof window === 'undefined') return INITIAL_TEAM;
  const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
  return raw ? JSON.parse(raw) : INITIAL_TEAM;
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

// ==========================================
// 1. TEAM OPERATIONS
// ==========================================

export function subscribeToTeam(callback: (team: Team | null) => void): Unsubscribe {
  const loadLocal = () => {
    const localTeam = getLocalTeam();
    callback(localTeam);
    return localTeam;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'team') loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TEAM) loadLocal();
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'teams'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as Team;
            localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(data));
            callback(data);
          } else {
            // If cloud is empty, seed with local team
            const currentLocal = loadLocal();
            if (currentLocal) {
              setDoc(doc(targetDb, 'teams', currentLocal.id), cleanForFirestore(currentLocal)).catch(() => {});
            }
          }
        },
        (error) => {
          console.warn('Teams firestore subscription warning:', error);
          loadLocal();
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
  };
}

export async function saveTeam(team: Team): Promise<void> {
  const updatedTeam = { ...team, updatedAt: new Date().toISOString() };

  // Update local cache
  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(updatedTeam));
  notifySync('team');

  // Push to Cloud Firestore
  const targetDb = db;
  if (targetDb) {
    try {
      const teamRef = doc(targetDb, 'teams', updatedTeam.id);
      await setDoc(teamRef, cleanForFirestore(updatedTeam));
    } catch (err) {
      console.warn('saveTeam Firestore error:', err);
    }
  }
}

// ==========================================
// 2. TOURNAMENTS OPERATIONS
// ==========================================

export function subscribeToTournaments(
  _teamId: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalTournaments();
    callback(list);
    return list;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'tournaments') loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.TOURNAMENTS) loadLocal();
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
          if (!snapshot.empty) {
            const remoteList = snapshot.docs.map((d) => d.data() as Tournament);
            localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(remoteList));
            callback(remoteList);
          } else {
            // Seed cloud if empty
            const currentLocal = loadLocal();
            if (currentLocal.length > 0) {
              currentLocal.forEach((t) => {
                setDoc(doc(targetDb, 'tournaments', t.id), cleanForFirestore(t)).catch(() => {});
              });
            }
          }
        },
        (error) => {
          console.warn('Tournaments snapshot warning:', error);
          loadLocal();
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
  const updated = {
    ...tournament,
    id: tournament.id || generateUUID(),
    updatedAt: new Date().toISOString(),
  };

  const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
  let list: Tournament[] = raw ? JSON.parse(raw) : INITIAL_TOURNAMENTS;
  const index = list.findIndex((t) => t.id === updated.id);
  if (index >= 0) {
    list[index] = updated;
  } else {
    list.push(updated);
  }
  localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(list));
  notifySync('tournaments');

  const targetDb = db;
  if (targetDb) {
    try {
      const docRef = doc(targetDb, 'tournaments', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
    } catch (err) {
      console.warn('saveTournament Firestore error:', err);
    }
  }
}

// ==========================================
// 3. PLAYERS OPERATIONS
// ==========================================

export function subscribeToPlayers(
  _teamId: string,
  callback: (players: Player[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalPlayers();
    list.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    callback(list);
    return list;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'players') loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.PLAYERS) loadLocal();
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
            remoteList.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(remoteList));
            callback(remoteList);
          } else {
            // Seed cloud if empty
            const currentLocal = loadLocal();
            if (currentLocal.length > 0) {
              currentLocal.forEach((p) => {
                setDoc(doc(targetDb, 'players', p.id), cleanForFirestore(p)).catch(() => {});
              });
            }
          }
        },
        (error) => {
          console.warn('Players snapshot warning:', error);
          loadLocal();
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
  const updated: Player = {
    ...player,
    id: player.id || generateUUID(),
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
    try {
      const docRef = doc(targetDb, 'players', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
    } catch (err) {
      console.warn('savePlayer Firestore error:', err);
    }
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
    try {
      await deleteDoc(doc(targetDb, 'players', playerId));
    } catch (err) {
      console.warn('deletePlayer Firestore error:', err);
    }
  }
}

// ==========================================
// 4. CONCEPTS OPERATIONS
// ==========================================

export function subscribeToConcepts(
  _teamId: string,
  callback: (concepts: Concept[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalConcepts();
    callback(list);
    return list;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'concepts') loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.CONCEPTS) loadLocal();
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
            callback(remoteList);
          } else {
            const currentLocal = loadLocal();
            if (currentLocal.length > 0) {
              currentLocal.forEach((c) => {
                setDoc(doc(targetDb, 'concepts', c.id), cleanForFirestore(c)).catch(() => {});
              });
            }
          }
        },
        (error) => {
          console.warn('Concepts snapshot warning:', error);
          loadLocal();
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
  const updated: Concept = {
    ...concept,
    id: concept.id || generateUUID(),
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
    try {
      const docRef = doc(targetDb, 'concepts', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
    } catch (err) {
      console.warn('saveConcept Firestore error:', err);
    }
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
    try {
      await deleteDoc(doc(targetDb, 'concepts', conceptId));
    } catch (err) {
      console.warn('deleteConcept Firestore error:', err);
    }
  }
}

// ==========================================
// 5. MATCHES OPERATIONS & REAL-TIME CALLUP
// ==========================================

export function subscribeToMatches(
  _teamId: string,
  callback: (matches: Match[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalMatches();
    list.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
    callback(list);
    return list;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'matches') loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MATCHES) loadLocal();
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

  if (targetDb) {
    try {
      const q = query(collection(targetDb, 'matches'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          const remoteList = snapshot.docs.map((d) => d.data() as Match);
          remoteList.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
          
          if (!snapshot.empty) {
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(remoteList));
            callback(remoteList);
          } else {
            // Check if local storage has unsynced matches, upload them to cloud
            const currentLocal = loadLocal();
            if (currentLocal.length > 0) {
              currentLocal.forEach((m) => {
                setDoc(doc(targetDb, 'matches', m.id), cleanForFirestore(m)).catch(() => {});
              });
            } else {
              callback([]);
            }
          }
        },
        (error) => {
          console.warn('Matches snapshot warning:', error);
          loadLocal();
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

  const loadLocal = () => {
    const list = getLocalMatches();
    const found = list.find((m) => m.id === matchId) || null;
    callback(found);
    return found;
  };
  loadLocal();

  const handleMessage = (e: MessageEvent) => {
    if (e.data?.topic === 'matches' || e.data?.topic === `match_${matchId}`) loadLocal();
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.MATCHES) loadLocal();
  };

  syncChannel?.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  let firestoreUnsub: Unsubscribe | null = null;
  const targetDb = db;

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
            loadLocal();
          }
        },
        (error) => {
          console.warn(`match_${matchId} snapshot warning:`, error);
          loadLocal();
        }
      );
    } catch (err) {
      console.warn(`match_${matchId} listen error:`, err);
    }
  }

  return () => {
    firestoreUnsub?.();
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveMatch(match: Match): Promise<void> {
  const updated: Match = {
    ...match,
    id: match.id || generateUUID(),
    updatedAt: new Date().toISOString(),
  };

  // Optimistic local update
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

  // Push directly to Cloud Firestore
  const targetDb = db;
  if (targetDb) {
    try {
      const docRef = doc(targetDb, 'matches', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
    } catch (err) {
      console.warn('saveMatch Firestore error:', err);
    }
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
    try {
      await deleteDoc(doc(targetDb, 'matches', matchId));
    } catch (err) {
      console.warn('deleteMatch Firestore error:', err);
    }
  }
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

  // Save to local cache
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  const matchIndex = list.findIndex((m) => m.id === matchId);
  if (matchIndex >= 0) list[matchIndex] = matchToUpdate;
  else list.unshift(matchToUpdate);
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${matchId}`);

  // Persist directly to Cloud Firestore so all other devices receive it instantly
  if (targetDb) {
    const docRef = doc(targetDb, 'matches', matchId);
    await setDoc(docRef, cleanForFirestore(matchToUpdate));
  }
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
    try {
      const docRef = doc(targetDb, 'matches', matchId);
      await setDoc(docRef, cleanForFirestore(match));
    } catch (err) {
      console.warn('closeMatchCallup Firestore error:', err);
    }
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
    try {
      const docRef = doc(targetDb, 'matches', matchId);
      await setDoc(docRef, cleanForFirestore(match));
    } catch (err) {
      console.warn('reopenMatchCallup Firestore error:', err);
    }
  }

  return match;
}
