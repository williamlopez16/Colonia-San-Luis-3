/**
 * Data Service for Convocatoria Fútbol
 * Manages all persistence and real-time synchronization.
 * Uses Firebase Firestore when configured and reachable.
 * Seamlessly provides real-time multi-tab reactive sync (BroadcastChannel + LocalStorage)
 * and guarantees that local data is NEVER wiped by an empty Firestore collection.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
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

// Track if Cloud Firestore backend is responding or operating in local/offline mode
let isCloudFirestoreOnline = isFirebaseConfigured;

export function isFirestoreOnline(): boolean {
  return isCloudFirestoreOnline;
}

function handleSnapshotError(context: string, error: unknown): void {
  const err = error as { code?: string; message?: string };
  const isConnectionIssue =
    err.code === 'unavailable' ||
    err.message?.includes('offline') ||
    err.message?.includes('unavailable') ||
    err.message?.includes('not found') ||
    err.message?.includes('The operation could not be completed') ||
    err.message?.includes('Failed to get document because the client is offline');

  if (isConnectionIssue) {
    if (isCloudFirestoreOnline) {
      isCloudFirestoreOnline = false;
      console.info(`[${context}] Firestore operando en modo local/offline.`);
    }
  } else {
    console.warn(`[${context}] Advertencia de suscripción Firestore:`, err.message || error);
  }
}

function handleFirestoreSyncError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn(`${context} Firestore sync warning:`, msg);

  if (
    msg.includes('unavailable') ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('The operation could not be completed') ||
    msg.includes('Failed to get document because the client is offline')
  ) {
    console.info(`${context}: guardado localmente, se sincronizará con Firestore cuando la conexión esté disponible.`);
    return;
  }

  throw new Error(`No se pudo sincronizar con Firestore: ${msg}`);
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

// BroadcastChannel for instant multi-tab sync when using local storage
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

// Local storage retrieval helpers with team fallback
function getLocalTeam(): Team {
  if (typeof window === 'undefined') return INITIAL_TEAM;
  const raw = localStorage.getItem(STORAGE_KEYS.TEAM);
  return raw ? JSON.parse(raw) : INITIAL_TEAM;
}

function getLocalTournaments(teamId?: string): Tournament[] {
  if (typeof window === 'undefined') return INITIAL_TOURNAMENTS;
  const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
  const list: Tournament[] = raw ? JSON.parse(raw) : INITIAL_TOURNAMENTS;
  if (!teamId) return list;
  return list.filter((t) => t.teamId === teamId || t.teamId === DEFAULT_TEAM_ID || !t.teamId);
}

function getLocalPlayers(teamId?: string): Player[] {
  if (typeof window === 'undefined') return INITIAL_PLAYERS;
  const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  const list: Player[] = raw ? JSON.parse(raw) : INITIAL_PLAYERS;
  if (!teamId) return list;
  return list.filter((p) => p.teamId === teamId || p.teamId === DEFAULT_TEAM_ID || !p.teamId);
}

function getLocalConcepts(teamId?: string): Concept[] {
  if (typeof window === 'undefined') return INITIAL_CONCEPTS;
  const raw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
  const list: Concept[] = raw ? JSON.parse(raw) : INITIAL_CONCEPTS;
  if (!teamId) return list;
  return list.filter((c) => c.teamId === teamId || c.teamId === DEFAULT_TEAM_ID || !c.teamId);
}

function getLocalMatches(teamId?: string): Match[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  if (!teamId) return list;
  return list.filter((m) => m.teamId === teamId || m.teamId === DEFAULT_TEAM_ID || !m.teamId);
}

function migrateLocalTeamId(newTeamId: string) {
  try {
    const rawT = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
    if (rawT) {
      const tournaments: Tournament[] = JSON.parse(rawT);
      const updated = tournaments.map((t) => ({ ...t, teamId: newTeamId }));
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(updated));
    }
    const rawP = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (rawP) {
      const players: Player[] = JSON.parse(rawP);
      const updated = players.map((p) => ({ ...p, teamId: newTeamId }));
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(updated));
    }
    const rawC = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
    if (rawC) {
      const concepts: Concept[] = JSON.parse(rawC);
      const updated = concepts.map((c) => ({ ...c, teamId: newTeamId }));
      localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(updated));
    }
    const rawM = localStorage.getItem(STORAGE_KEYS.MATCHES);
    if (rawM) {
      const matches: Match[] = JSON.parse(rawM);
      const updated = matches.map((m) => ({ ...m, teamId: newTeamId }));
      localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('Error migrating local team ID:', err);
  }
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

  if (isCloudFirestoreOnline && db) {
    try {
      const q = query(collection(db, 'teams'));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as Team;
            localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(data));
            callback(data);
          } else {
            // Cloud is empty: NEVER wipe local data with null!
            // Keep local team and upload it to Firestore if online
            const currentLocal = loadLocal();
            const targetDb = db;
            if (currentLocal && targetDb) {
              setDoc(doc(targetDb, 'teams', currentLocal.id), cleanForFirestore(currentLocal)).catch(() => {});
            }
          }
        },
        (error) => {
          handleSnapshotError('teams', error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError('teams', err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
    syncChannel?.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

export async function saveTeam(team: Team): Promise<void> {
  const updatedTeam = { ...team, updatedAt: new Date().toISOString() };

  // Always update local cache for instant UI response
  localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(updatedTeam));

  // Migrate records if team.id changed
  migrateLocalTeamId(updatedTeam.id);

  notifySync('team');
  notifySync('tournaments');
  notifySync('players');
  notifySync('concepts');
  notifySync('matches');

  if (isFirebaseConfigured && db) {
    try {
      const teamRef = doc(db, 'teams', updatedTeam.id);
      await setDoc(teamRef, cleanForFirestore(updatedTeam));
      isCloudFirestoreOnline = true;
    } catch (err) {
      handleFirestoreSyncError('saveTeam', err);
    }
  }
}

// ==========================================
// 2. TOURNAMENTS OPERATIONS
// ==========================================

export function subscribeToTournaments(
  teamId: string,
  callback: (tournaments: Tournament[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalTournaments(teamId);
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

  if (isCloudFirestoreOnline && db) {
    try {
      const q = query(collection(db, 'tournaments'), where('teamId', '==', teamId));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Cloud is empty: do NOT wipe local tournaments!
            const currentLocal = loadLocal();
            const targetDb = db;
            if (currentLocal.length > 0 && targetDb) {
              currentLocal.forEach((t) => {
                setDoc(doc(targetDb, 'tournaments', t.id), cleanForFirestore(t)).catch(() => {});
              });
            }
          } else {
            const remoteList = snapshot.docs.map((d) => d.data() as Tournament);
            const localRaw = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
            let merged = localRaw ? (JSON.parse(localRaw) as Tournament[]) : [];
            remoteList.forEach((r) => {
              const idx = merged.findIndex((m) => m.id === r.id);
              if (idx >= 0) merged[idx] = r;
              else merged.push(r);
            });
            localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(merged));
            const filtered = merged.filter((t) => t.teamId === teamId || t.teamId === DEFAULT_TEAM_ID || !t.teamId);
            callback(filtered);
          }
        },
        (error) => {
          handleSnapshotError('tournaments', error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError('tournaments', err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
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

  // Local storage
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'tournaments', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
      isCloudFirestoreOnline = true;
    } catch (err) {
      handleFirestoreSyncError('saveTournament', err);
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
  const loadLocal = () => {
    const list = getLocalPlayers(teamId);
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

  if (isCloudFirestoreOnline && db) {
    try {
      const q = query(collection(db, 'players'), where('teamId', '==', teamId));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Cloud is empty: do NOT wipe local players!
            const currentLocal = loadLocal();
            const targetDb = db;
            if (currentLocal.length > 0 && targetDb) {
              currentLocal.forEach((p) => {
                setDoc(doc(targetDb, 'players', p.id), cleanForFirestore(p)).catch(() => {});
              });
            }
          } else {
            const remoteList = snapshot.docs.map((d) => d.data() as Player);
            const localRaw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
            let merged = localRaw ? (JSON.parse(localRaw) as Player[]) : [];
            remoteList.forEach((r) => {
              const idx = merged.findIndex((m) => m.id === r.id);
              if (idx >= 0) merged[idx] = r;
              else merged.push(r);
            });
            localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(merged));
            const filtered = merged.filter((p) => p.teamId === teamId || p.teamId === DEFAULT_TEAM_ID || !p.teamId);
            filtered.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
            callback(filtered);
          }
        },
        (error) => {
          handleSnapshotError('players', error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError('players', err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'players', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
      isCloudFirestoreOnline = true;
    } catch (err) {
      handleFirestoreSyncError('savePlayer', err);
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

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'players', playerId));
    } catch (err) {
      handleFirestoreSyncError('deletePlayer', err);
    }
  }
}

// ==========================================
// 4. CONCEPTS OPERATIONS
// ==========================================

export function subscribeToConcepts(
  teamId: string,
  callback: (concepts: Concept[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalConcepts(teamId);
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

  if (isCloudFirestoreOnline && db) {
    try {
      const q = query(collection(db, 'concepts'), where('teamId', '==', teamId));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Cloud is empty: do NOT wipe local concepts!
            const currentLocal = loadLocal();
            const targetDb = db;
            if (currentLocal.length > 0 && targetDb) {
              currentLocal.forEach((c) => {
                setDoc(doc(targetDb, 'concepts', c.id), cleanForFirestore(c)).catch(() => {});
              });
            }
          } else {
            const remoteList = snapshot.docs.map((d) => d.data() as Concept);
            const localRaw = localStorage.getItem(STORAGE_KEYS.CONCEPTS);
            let merged = localRaw ? (JSON.parse(localRaw) as Concept[]) : [];
            remoteList.forEach((r) => {
              const idx = merged.findIndex((m) => m.id === r.id);
              if (idx >= 0) merged[idx] = r;
              else merged.push(r);
            });
            localStorage.setItem(STORAGE_KEYS.CONCEPTS, JSON.stringify(merged));
            const filtered = merged.filter((c) => c.teamId === teamId || c.teamId === DEFAULT_TEAM_ID || !c.teamId);
            callback(filtered);
          }
        },
        (error) => {
          handleSnapshotError('concepts', error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError('concepts', err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
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

  // If setting default arbitration, unset other defaults
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'concepts', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
      isCloudFirestoreOnline = true;
    } catch (err) {
      handleFirestoreSyncError('saveConcept', err);
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

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'concepts', conceptId));
    } catch (err) {
      handleFirestoreSyncError('deleteConcept', err);
    }
  }
}

// ==========================================
// 5. MATCHES OPERATIONS & REAL-TIME CALLUP
// ==========================================

export function subscribeToMatches(
  teamId: string,
  callback: (matches: Match[]) => void
): Unsubscribe {
  const loadLocal = () => {
    const list = getLocalMatches(teamId);
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

  if (isCloudFirestoreOnline && db) {
    try {
      const q = query(collection(db, 'matches'), where('teamId', '==', teamId));
      firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Cloud is empty: do NOT wipe local matches!
            const currentLocal = loadLocal();
            const targetDb = db;
            if (currentLocal.length > 0 && targetDb) {
              currentLocal.forEach((m) => {
                setDoc(doc(targetDb, 'matches', m.id), cleanForFirestore(m)).catch(() => {});
              });
            }
          } else {
            const remoteList = snapshot.docs.map((d) => d.data() as Match);
            const localRaw = localStorage.getItem(STORAGE_KEYS.MATCHES);
            let merged = localRaw ? (JSON.parse(localRaw) as Match[]) : [];
            remoteList.forEach((r) => {
              const idx = merged.findIndex((m) => m.id === r.id);
              if (idx >= 0) merged[idx] = r;
              else merged.push(r);
            });
            localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(merged));
            const filtered = merged.filter((m) => m.teamId === teamId || m.teamId === DEFAULT_TEAM_ID || !m.teamId);
            filtered.sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')).getTime() - new Date(a.date + ' ' + (a.time || '00:00')).getTime());
            callback(filtered);
          }
        },
        (error) => {
          handleSnapshotError('matches', error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError('matches', err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
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

  if (isCloudFirestoreOnline && db) {
    try {
      const matchDocRef = doc(db, 'matches', matchId);
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
            // Document not found in Firestore: check local before returning null!
            loadLocal();
          }
        },
        (error) => {
          handleSnapshotError(`match_${matchId}`, error);
          loadLocal();
        }
      );
    } catch (err) {
      handleSnapshotError(`match_${matchId}`, err);
    }
  }

  return () => {
    if (firestoreUnsub) {
      try {
        firestoreUnsub();
      } catch {
        // Ignore unsubscribe error
      }
    }
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'matches', updated.id);
      await setDoc(docRef, cleanForFirestore(updated));
      isCloudFirestoreOnline = true;
    } catch (err) {
      handleFirestoreSyncError('saveMatch', err);
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

  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'matches', matchId));
    } catch (err) {
      handleFirestoreSyncError('deleteMatch', err);
    }
  }
}

/**
 * Public or admin attendance update
 */
export async function updatePlayerAttendance(
  matchId: string,
  playerId: string,
  newStatus: AttendanceStatus,
  reason?: string
): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.MATCHES);
  const list: Match[] = raw ? JSON.parse(raw) : [];
  const matchIndex = list.findIndex((m) => m.id === matchId);

  if (matchIndex === -1) {
    throw new Error('Partido no encontrado o enlace inválido');
  }

  const match = list[matchIndex];
  if (match.status === 'Cerrada') {
    throw new Error('La convocatoria para este partido ya ha sido cerrada por el administrador.');
  }

  const callupIndex = match.callups.findIndex((c) => c.playerId === playerId);
  if (callupIndex === -1) {
    throw new Error('El jugador no forma parte de la convocatoria de este partido.');
  }

  match.callups[callupIndex] = {
    ...match.callups[callupIndex],
    status: newStatus,
    reason: newStatus === 'No asiste' ? reason || 'No especificado' : undefined,
    confirmedAt: new Date().toISOString(),
  };
  match.updatedAt = new Date().toISOString();

  list[matchIndex] = match;
  localStorage.setItem(STORAGE_KEYS.MATCHES, JSON.stringify(list));
  notifySync('matches');
  notifySync(`match_${matchId}`);

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'matches', matchId);
      await setDoc(docRef, cleanForFirestore(match), { merge: true });
    } catch (err) {
      handleFirestoreSyncError('updatePlayerAttendance', err);
    }
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'matches', matchId);
      await setDoc(
        docRef,
        cleanForFirestore({ status: 'Cerrada', updatedAt: match.updatedAt }),
        { merge: true }
      );
    } catch (err) {
      handleFirestoreSyncError('closeMatchCallup', err);
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

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'matches', matchId);
      await setDoc(
        docRef,
        cleanForFirestore({ status: 'Abierta', updatedAt: match.updatedAt }),
        { merge: true }
      );
    } catch (err) {
      handleFirestoreSyncError('reopenMatchCallup', err);
    }
  }

  return match;
}
