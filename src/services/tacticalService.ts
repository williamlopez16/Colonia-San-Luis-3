/**
 * Tactical Service for Convocatoria Fútbol - Colonia San Luis F.C
 * Complete presets for F11, F9, F8, F7, F5 (Micro).
 * Accurate coordinates, WhatsApp text formatter, and HTML5 Canvas HD Export.
 */

import type {
  Team,
  Match,
  Player,
  Callup,
  TacticalLineup,
  TacticalPlayerPosition,
  TacticalGameFormat,
  TacticalPitchStyle,
  TacticalRoleCategory,
  TacticalDrawing,
} from '../types';
import { formatMatchDate } from './whatsappService';

export interface FormationPreset {
  id: string;
  name: string;
  gameFormat: TacticalGameFormat;
  playerCount: number; // e.g. 11, 9, 8, 7, 5
  description: string;
  positions: {
    role: string;
    roleCategory: TacticalRoleCategory;
    x: number; // 0 - 100 percentage
    y: number; // 0 - 100 percentage
  }[];
}

export const FORMATION_PRESETS: FormationPreset[] = [
  // --- FÚTBOL 11 ---
  {
    id: '11_433',
    name: '4-3-3 Ofensivo',
    gameFormat: 'Fútbol 11',
    playerCount: 11,
    description: 'Extremos abiertos, volante tapón y dos interiores con llegada.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'LD', roleCategory: 'DEF', x: 86, y: 74 },
      { role: 'DFC', roleCategory: 'DEF', x: 63, y: 77 },
      { role: 'DFC', roleCategory: 'DEF', x: 37, y: 77 },
      { role: 'LI', roleCategory: 'DEF', x: 14, y: 74 },
      { role: 'MCD', roleCategory: 'MED', x: 50, y: 57 },
      { role: 'MC', roleCategory: 'MED', x: 70, y: 44 },
      { role: 'MC', roleCategory: 'MED', x: 30, y: 44 },
      { role: 'ED', roleCategory: 'DEL', x: 84, y: 22 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 16 },
      { role: 'EI', roleCategory: 'DEL', x: 16, y: 22 },
    ],
  },
  {
    id: '11_442',
    name: '4-4-2 Clásico',
    gameFormat: 'Fútbol 11',
    playerCount: 11,
    description: 'Equilibrio puro en dos líneas de cuatro y doble nueve en ataque.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'LD', roleCategory: 'DEF', x: 86, y: 74 },
      { role: 'DFC', roleCategory: 'DEF', x: 62, y: 77 },
      { role: 'DFC', roleCategory: 'DEF', x: 38, y: 77 },
      { role: 'LI', roleCategory: 'DEF', x: 14, y: 74 },
      { role: 'MD', roleCategory: 'MED', x: 85, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 62, y: 52 },
      { role: 'MC', roleCategory: 'MED', x: 38, y: 52 },
      { role: 'MI', roleCategory: 'MED', x: 15, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 62, y: 19 },
      { role: 'DC', roleCategory: 'DEL', x: 38, y: 19 },
    ],
  },
  {
    id: '11_4231',
    name: '4-2-3-1 Moderno',
    gameFormat: 'Fútbol 11',
    playerCount: 11,
    description: 'Doble pivote defensivo, mediapunta creador y 3 volantes de llegada.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'LD', roleCategory: 'DEF', x: 86, y: 74 },
      { role: 'DFC', roleCategory: 'DEF', x: 62, y: 77 },
      { role: 'DFC', roleCategory: 'DEF', x: 38, y: 77 },
      { role: 'LI', roleCategory: 'DEF', x: 14, y: 74 },
      { role: 'MCD', roleCategory: 'MED', x: 63, y: 58 },
      { role: 'MCD', roleCategory: 'MED', x: 37, y: 58 },
      { role: 'ED', roleCategory: 'MED', x: 82, y: 36 },
      { role: 'MCO', roleCategory: 'MED', x: 50, y: 34 },
      { role: 'EI', roleCategory: 'MED', x: 18, y: 36 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 16 },
    ],
  },
  {
    id: '11_352',
    name: '3-5-2 Carrileros',
    gameFormat: 'Fútbol 11',
    playerCount: 11,
    description: 'Línea de 3 atrás, carrileros por banda y superioridad en el medio.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 74, y: 77 },
      { role: 'LIB', roleCategory: 'DEF', x: 50, y: 79 },
      { role: 'DFC', roleCategory: 'DEF', x: 26, y: 77 },
      { role: 'CAD', roleCategory: 'MED', x: 88, y: 52 },
      { role: 'MCD', roleCategory: 'MED', x: 50, y: 58 },
      { role: 'MC', roleCategory: 'MED', x: 66, y: 44 },
      { role: 'MC', roleCategory: 'MED', x: 34, y: 44 },
      { role: 'CAI', roleCategory: 'MED', x: 12, y: 52 },
      { role: 'DC', roleCategory: 'DEL', x: 62, y: 19 },
      { role: 'DC', roleCategory: 'DEL', x: 38, y: 19 },
    ],
  },
  {
    id: '11_532',
    name: '5-3-2 Bloque Fuerte',
    gameFormat: 'Fútbol 11',
    playerCount: 11,
    description: 'Máxima solidez con 5 defensores y transición rápida con dos puntas.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'LD', roleCategory: 'DEF', x: 88, y: 72 },
      { role: 'DFC', roleCategory: 'DEF', x: 68, y: 78 },
      { role: 'DFC', roleCategory: 'DEF', x: 50, y: 80 },
      { role: 'DFC', roleCategory: 'DEF', x: 32, y: 78 },
      { role: 'LI', roleCategory: 'DEF', x: 12, y: 72 },
      { role: 'MCD', roleCategory: 'MED', x: 50, y: 54 },
      { role: 'MC', roleCategory: 'MED', x: 70, y: 42 },
      { role: 'MC', roleCategory: 'MED', x: 30, y: 42 },
      { role: 'DC', roleCategory: 'DEL', x: 62, y: 19 },
      { role: 'DC', roleCategory: 'DEL', x: 38, y: 19 },
    ],
  },

  // --- FÚTBOL 9 ---
  {
    id: '9_332',
    name: '3-3-2 Equilibrado',
    gameFormat: 'Fútbol 9',
    playerCount: 9,
    description: 'Línea de 3 centrales, 3 volantes y doble delantero.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 75, y: 76 },
      { role: 'DFC', roleCategory: 'DEF', x: 50, y: 78 },
      { role: 'DFC', roleCategory: 'DEF', x: 25, y: 76 },
      { role: 'MD', roleCategory: 'MED', x: 80, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 50, y: 50 },
      { role: 'MI', roleCategory: 'MED', x: 20, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 64, y: 20 },
      { role: 'DC', roleCategory: 'DEL', x: 36, y: 20 },
    ],
  },
  {
    id: '9_323',
    name: '3-2-3 Ofensivo',
    gameFormat: 'Fútbol 9',
    playerCount: 9,
    description: 'Tres defensores, doble eje y tridente en la parte alta.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 75, y: 76 },
      { role: 'DFC', roleCategory: 'DEF', x: 50, y: 78 },
      { role: 'DFC', roleCategory: 'DEF', x: 25, y: 76 },
      { role: 'MC', roleCategory: 'MED', x: 65, y: 52 },
      { role: 'MC', roleCategory: 'MED', x: 35, y: 52 },
      { role: 'ED', roleCategory: 'DEL', x: 82, y: 24 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
      { role: 'EI', roleCategory: 'DEL', x: 18, y: 24 },
    ],
  },
  {
    id: '9_431',
    name: '4-3-1 Control',
    gameFormat: 'Fútbol 9',
    playerCount: 9,
    description: 'Línea de 4 sólida atrás, 3 volantes y un centro delantero referente.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'LD', roleCategory: 'DEF', x: 85, y: 74 },
      { role: 'DFC', roleCategory: 'DEF', x: 62, y: 77 },
      { role: 'DFC', roleCategory: 'DEF', x: 38, y: 77 },
      { role: 'LI', roleCategory: 'DEF', x: 15, y: 74 },
      { role: 'MD', roleCategory: 'MED', x: 80, y: 46 },
      { role: 'MC', roleCategory: 'MED', x: 50, y: 50 },
      { role: 'MI', roleCategory: 'MED', x: 20, y: 46 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },

  // --- FÚTBOL 8 ---
  {
    id: '8_331',
    name: '3-3-1 Clásico F8',
    gameFormat: 'Fútbol 8',
    playerCount: 8,
    description: 'El esquema rey en fútbol 8. Solidez defensiva, bandas activas y un referente.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 76, y: 76 },
      { role: 'DFC', roleCategory: 'DEF', x: 50, y: 78 },
      { role: 'DFC', roleCategory: 'DEF', x: 24, y: 76 },
      { role: 'MD', roleCategory: 'MED', x: 82, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 50, y: 52 },
      { role: 'MI', roleCategory: 'MED', x: 18, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },
  {
    id: '8_322',
    name: '3-2-2 Doble Punta',
    gameFormat: 'Fútbol 8',
    playerCount: 8,
    description: '3 atrás, dos mediocampistas mixtos y dos delanteros para presión alta.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 76, y: 76 },
      { role: 'DFC', roleCategory: 'DEF', x: 50, y: 78 },
      { role: 'DFC', roleCategory: 'DEF', x: 24, y: 76 },
      { role: 'MC', roleCategory: 'MED', x: 65, y: 50 },
      { role: 'MC', roleCategory: 'MED', x: 35, y: 50 },
      { role: 'DC', roleCategory: 'DEL', x: 64, y: 20 },
      { role: 'DC', roleCategory: 'DEL', x: 36, y: 20 },
    ],
  },
  {
    id: '8_241',
    name: '2-4-1 Dominio Medio',
    gameFormat: 'Fútbol 8',
    playerCount: 8,
    description: 'Dos defensores rápidos, cuatro en el medio para adueñarse de la pelota.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DFC', roleCategory: 'DEF', x: 65, y: 77 },
      { role: 'DFC', roleCategory: 'DEF', x: 35, y: 77 },
      { role: 'MD', roleCategory: 'MED', x: 84, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 62, y: 52 },
      { role: 'MC', roleCategory: 'MED', x: 38, y: 52 },
      { role: 'MI', roleCategory: 'MED', x: 16, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },

  // --- FÚTBOL 7 ---
  {
    id: '7_231',
    name: '2-3-1 Sintética Pro',
    gameFormat: 'Fútbol 7',
    playerCount: 7,
    description: 'La formación más popular y equilibrada para fútbol 7.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DEF', roleCategory: 'DEF', x: 68, y: 76 },
      { role: 'DEF', roleCategory: 'DEF', x: 32, y: 76 },
      { role: 'MD', roleCategory: 'MED', x: 82, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 50, y: 50 },
      { role: 'MI', roleCategory: 'MED', x: 18, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },
  {
    id: '7_321',
    name: '3-2-1 Cerco Fuerte',
    gameFormat: 'Fútbol 7',
    playerCount: 7,
    description: 'Tres defensas sólidos con carriles y dos volantes para cerrar espacios.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DEF', roleCategory: 'DEF', x: 76, y: 76 },
      { role: 'DEF', roleCategory: 'DEF', x: 50, y: 78 },
      { role: 'DEF', roleCategory: 'DEF', x: 24, y: 76 },
      { role: 'MC', roleCategory: 'MED', x: 65, y: 48 },
      { role: 'MC', roleCategory: 'MED', x: 35, y: 48 },
      { role: 'DC', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },
  {
    id: '7_222',
    name: '2-2-2 Duplas',
    gameFormat: 'Fútbol 7',
    playerCount: 7,
    description: 'Dos defensores, dos volantes y dos delanteros. Ataque vertical constante.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DEF', roleCategory: 'DEF', x: 68, y: 76 },
      { role: 'DEF', roleCategory: 'DEF', x: 32, y: 76 },
      { role: 'MC', roleCategory: 'MED', x: 65, y: 50 },
      { role: 'MC', roleCategory: 'MED', x: 35, y: 50 },
      { role: 'DC', roleCategory: 'DEL', x: 64, y: 20 },
      { role: 'DC', roleCategory: 'DEL', x: 36, y: 20 },
    ],
  },

  // --- FÚTBOL 5 / MICRO / SALA ---
  {
    id: '5_121',
    name: '1-2-1 Rombo',
    gameFormat: 'Fútbol 5',
    playerCount: 5,
    description: 'El clásico rombo de microfútbol: arquero, cierre, dos alas y pívot.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'CIE', roleCategory: 'DEF', x: 50, y: 72 },
      { role: 'ALA', roleCategory: 'MED', x: 82, y: 46 },
      { role: 'ALA', roleCategory: 'MED', x: 18, y: 46 },
      { role: 'PIV', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },
  {
    id: '5_22',
    name: '2-2 Cuadrado',
    gameFormat: 'Fútbol 5',
    playerCount: 5,
    description: 'Dos cierres defensivos y dos puntas. Gran orden de contención y salidas.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DEF', roleCategory: 'DEF', x: 68, y: 70 },
      { role: 'DEF', roleCategory: 'DEF', x: 32, y: 70 },
      { role: 'DEL', roleCategory: 'DEL', x: 68, y: 24 },
      { role: 'DEL', roleCategory: 'DEL', x: 32, y: 24 },
    ],
  },
  {
    id: '5_31',
    name: '3-1 Bloque Bajo',
    gameFormat: 'Fútbol 5',
    playerCount: 5,
    description: 'Tres jugadores en fase de defensa y un pívot rápido para contragolpe.',
    positions: [
      { role: 'POR', roleCategory: 'POR', x: 50, y: 90 },
      { role: 'DEF', roleCategory: 'DEF', x: 76, y: 68 },
      { role: 'DEF', roleCategory: 'DEF', x: 50, y: 71 },
      { role: 'DEF', roleCategory: 'DEF', x: 24, y: 68 },
      { role: 'PIV', roleCategory: 'DEL', x: 50, y: 18 },
    ],
  },
];

export function getPresetsByFormat(gameFormat: TacticalGameFormat): FormationPreset[] {
  return FORMATION_PRESETS.filter((p) => p.gameFormat === gameFormat);
}

/**
 * Creates a brand new default tactical lineup for a match or general team board.
 */
export function createDefaultTacticalLineup(
  teamId: string,
  match?: Match | null,
  availablePlayers: Player[] = [],
  preferredFormat: TacticalGameFormat = 'Fútbol 11'
): TacticalLineup {
  // Find appropriate preset
  const presets = getPresetsByFormat(preferredFormat);
  const preset = presets[0] || FORMATION_PRESETS[0];

  // If match has confirmed callups, prioritize those
  let candidatePlayers: { id: string; fullName: string; jerseyNumber: number; photoUrl?: string; isCaptain?: boolean }[] = [];

  if (match && match.callups && match.callups.length > 0) {
    const confirmedCallups = match.callups.filter((c) => c.status === 'Confirmado');
    candidatePlayers = confirmedCallups.map((c) => {
      const orig = availablePlayers.find((p) => p.id === c.playerId);
      return {
        id: c.playerId,
        fullName: c.fullName,
        jerseyNumber: c.jerseyNumber,
        photoUrl: c.photoUrl || orig?.photoUrl,
        isCaptain: orig?.isCaptain || false,
      };
    });
  }

  // Fallback to active players if no confirmed callups or general board
  if (candidatePlayers.length === 0) {
    candidatePlayers = availablePlayers.map((p) => ({
      id: p.id,
      fullName: p.fullName,
      jerseyNumber: p.jerseyNumber,
      photoUrl: p.photoUrl,
      isCaptain: p.isCaptain || false,
    }));
  }

  // Assign starters to preset positions
  const starters: TacticalPlayerPosition[] = [];
  const assignedIds = new Set<string>();

  // Try to find a goalkeeper for position 0
  const gkCandidate = candidatePlayers.find((p) => p.fullName.toLowerCase().includes('portero') || p.jerseyNumber === 1);
  if (gkCandidate) {
    starters.push({
      playerId: gkCandidate.id,
      fullName: gkCandidate.fullName,
      jerseyNumber: gkCandidate.jerseyNumber,
      photoUrl: gkCandidate.photoUrl,
      isCaptain: gkCandidate.isCaptain,
      role: preset.positions[0].role,
      roleCategory: preset.positions[0].roleCategory,
      x: preset.positions[0].x,
      y: preset.positions[0].y,
    });
    assignedIds.add(gkCandidate.id);
  }

  // Fill remaining starter slots
  for (let i = starters.length; i < preset.positions.length; i++) {
    const nextPlayer = candidatePlayers.find((p) => !assignedIds.has(p.id));
    const pos = preset.positions[i];
    if (nextPlayer) {
      starters.push({
        playerId: nextPlayer.id,
        fullName: nextPlayer.fullName,
        jerseyNumber: nextPlayer.jerseyNumber,
        photoUrl: nextPlayer.photoUrl,
        isCaptain: nextPlayer.isCaptain,
        role: pos.role,
        roleCategory: pos.roleCategory,
        x: pos.x,
        y: pos.y,
      });
      assignedIds.add(nextPlayer.id);
    } else {
      // Empty placeholder slot
      starters.push({
        playerId: `empty_${i}`,
        fullName: `Vacante #${i + 1}`,
        jerseyNumber: i + 1,
        role: pos.role,
        roleCategory: pos.roleCategory,
        x: pos.x,
        y: pos.y,
      });
    }
  }

  // Bench is all remaining candidate players
  const bench: TacticalPlayerPosition[] = candidatePlayers
    .filter((p) => !assignedIds.has(p.id))
    .map((p) => ({
      playerId: p.id,
      fullName: p.fullName,
      jerseyNumber: p.jerseyNumber,
      photoUrl: p.photoUrl,
      isCaptain: p.isCaptain,
      role: 'SUP',
      roleCategory: 'MED',
      x: 0,
      y: 0,
    }));

  return {
    id: `lineup_${Date.now()}`,
    teamId,
    matchId: match?.id,
    name: match ? `Alineación vs ${match.rival}` : `${preset.name} - Colonia San Luis F.C`,
    gameFormat: preferredFormat,
    formation: preset.name.split(' ')[0], // e.g. "4-3-3"
    pitchStyle: 'grass',
    pitchView: 'full',
    starters,
    bench,
    ball: { x: 50, y: 50 },
    drawings: [],
    notes: '',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Re-applies a formation preset to the currently placed starters.
 */
export function applyFormationPreset(
  lineup: TacticalLineup,
  preset: FormationPreset
): TacticalLineup {
  const newStarters: TacticalPlayerPosition[] = [];
  const currentStarters = [...lineup.starters];

  // Try to preserve current goalkeeper
  const currentGk = currentStarters.find((p) => p.roleCategory === 'POR' || p.role === 'POR');
  const availableStarters = currentStarters.filter((p) => p !== currentGk);

  // Position 0 is POR
  const gkPos = preset.positions[0];
  if (currentGk) {
    newStarters.push({
      ...currentGk,
      role: gkPos.role,
      roleCategory: gkPos.roleCategory,
      x: gkPos.x,
      y: gkPos.y,
    });
  } else if (availableStarters.length > 0) {
    const first = availableStarters.shift()!;
    newStarters.push({
      ...first,
      role: gkPos.role,
      roleCategory: gkPos.roleCategory,
      x: gkPos.x,
      y: gkPos.y,
    });
  } else {
    newStarters.push({
      playerId: `empty_0`,
      fullName: 'Vacante #1',
      jerseyNumber: 1,
      role: gkPos.role,
      roleCategory: gkPos.roleCategory,
      x: gkPos.x,
      y: gkPos.y,
    });
  }

  // Fill rest of positions
  for (let i = 1; i < preset.positions.length; i++) {
    const pos = preset.positions[i];
    if (availableStarters.length > 0) {
      const player = availableStarters.shift()!;
      newStarters.push({
        ...player,
        role: pos.role,
        roleCategory: pos.roleCategory,
        x: pos.x,
        y: pos.y,
      });
    } else {
      newStarters.push({
        playerId: `empty_${i}`,
        fullName: `Vacante #${i + 1}`,
        jerseyNumber: i + 1,
        role: pos.role,
        roleCategory: pos.roleCategory,
        x: pos.x,
        y: pos.y,
      });
    }
  }

  // Any remaining starters beyond preset capacity move to bench
  const excessToBench = availableStarters.map((p) => ({
    ...p,
    role: 'SUP',
    x: 0,
    y: 0,
  }));

  return {
    ...lineup,
    gameFormat: preset.gameFormat,
    formation: preset.name.split(' ')[0],
    starters: newStarters,
    bench: [...lineup.bench, ...excessToBench],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Format full lineup as a clean, engaging WhatsApp message ready to copy & paste.
 */
export function formatLineupWhatsAppMessage(params: {
  team: Team | null;
  match?: Match | null;
  lineup: TacticalLineup;
}): string {
  const { team, match, lineup } = params;
  const teamName = team?.name?.trim() || 'COLONIA SAN LUIS F.C';

  const lines: string[] = [];
  lines.push(`🟢⚪ ${teamName.toUpperCase()} ⚪🟢`);
  lines.push(`📋 *ALINEACIÓN OFICIAL Y CONVOCATORIA*`);
  lines.push('');

  if (match) {
    lines.push(`⚔️ *Rival:* ${match.rival}`);
    if (match.tournamentName) lines.push(`🏆 *Torneo:* ${match.tournamentName}`);
    lines.push(`📅 *Fecha:* ${formatMatchDate(match.date)}`);
    lines.push(`⏰ *Hora:* ${match.time}`);
    if (match.location) lines.push(`📍 *Cancha:* ${match.location}`);
    if (match.suggestedArrivalTime) lines.push(`⏱️ *Llegada:* ${match.suggestedArrivalTime}`);
    lines.push('');
  }

  lines.push(`⚽ *Esquema Táctico:* ${lineup.formation} (${lineup.gameFormat})`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // Group starters by line
  const por = lineup.starters.filter((p) => p.roleCategory === 'POR' && !p.playerId.startsWith('empty_'));
  const def = lineup.starters.filter((p) => p.roleCategory === 'DEF' && !p.playerId.startsWith('empty_'));
  const med = lineup.starters.filter((p) => p.roleCategory === 'MED' && !p.playerId.startsWith('empty_'));
  const del = lineup.starters.filter((p) => p.roleCategory === 'DEL' && !p.playerId.startsWith('empty_'));

  if (por.length > 0) {
    lines.push(`🧤 *ARQUERO:*`);
    por.forEach((p) => {
      const cap = p.isCaptain ? ' *(C)*' : '';
      lines.push(`  • #${p.jerseyNumber} ${p.fullName} (${p.role})${cap}`);
    });
    lines.push('');
  }

  if (def.length > 0) {
    lines.push(`🛡️ *DEFENSA:*`);
    def.forEach((p) => {
      const cap = p.isCaptain ? ' *(C)*' : '';
      lines.push(`  • #${p.jerseyNumber} ${p.fullName} (${p.role})${cap}`);
    });
    lines.push('');
  }

  if (med.length > 0) {
    lines.push(`⚙️ *MEDIOCAMPO:*`);
    med.forEach((p) => {
      const cap = p.isCaptain ? ' *(C)*' : '';
      lines.push(`  • #${p.jerseyNumber} ${p.fullName} (${p.role})${cap}`);
    });
    lines.push('');
  }

  if (del.length > 0) {
    lines.push(`⚡ *DELANTERA:*`);
    del.forEach((p) => {
      const cap = p.isCaptain ? ' *(C)*' : '';
      lines.push(`  • #${p.jerseyNumber} ${p.fullName} (${p.role})${cap}`);
    });
    lines.push('');
  }

  // Active bench
  const validBench = lineup.bench.filter((p) => !p.playerId.startsWith('empty_'));
  if (validBench.length > 0) {
    lines.push(`🪑 *SUPLENTES DISPONIBLES (${validBench.length}):*`);
    const benchList = validBench.map((p) => `#${p.jerseyNumber} ${p.fullName}`).join(', ');
    lines.push(`  ${benchList}`);
    lines.push('');
  }

  if (lineup.notes && lineup.notes.trim()) {
    lines.push(`📝 *Indicaciones del DT:*`);
    lines.push(`  ${lineup.notes.trim()}`);
    lines.push('');
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`¡A dejar el corazón en la cancha, San Luis! 🟢⚪🔥`);

  return lines.join('\n');
}

/**
 * Safe roundRect helper for canvas across all browser versions
 */
function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  if (typeof (ctx as unknown as { roundRect?: Function }).roundRect === 'function') {
    try {
      ctx.roundRect(x, y, w, h, radius);
      return;
    } catch {
      // fallback
    }
  }
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Loads an image from URL/Base64 with safe error handling and CORS support.
 * Guaranteed never to hang (1200ms timeout) and never to taint canvas.
 */
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    let resolved = false;
    const safeResolve = (val: HTMLImageElement | null) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // Strict 1200ms timeout so canvas rendering never hangs
    const timer = setTimeout(() => {
      safeResolve(null);
    }, 1200);

    const img = new Image();
    // Only set crossOrigin for remote http(s) URLs, never for data: or blob:
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      clearTimeout(timer);
      safeResolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      // DO NOT retry without crossOrigin: an untainted canvas is strictly required for export
      safeResolve(null);
    };
    img.src = src;
  });
}

/**
 * Renders the Tactical Lineup to a high-resolution Canvas (1080 x 1480 px)
 * suitable for Instagram, WhatsApp status or HD download.
 */
export async function renderTacticalLineupToCanvas(
  canvas: HTMLCanvasElement,
  params: {
    team: Team | null;
    match?: Match | null;
    lineup: TacticalLineup;
    kitStyle?: 'home' | 'away' | 'third';
    playerScale?: number;
  }
): Promise<void> {
  const { team, match, lineup, kitStyle = 'home', playerScale = 1.0 } = params;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const W = 1080;
  const H = 1480;
  canvas.width = W;
  canvas.height = H;

  // 1. Sleek Dark Slate / Emerald Sports Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#062817'); // Dark Verdolaga
  bgGrad.addColorStop(0.3, '#0b3d24');
  bgGrad.addColorStop(0.7, '#072415');
  bgGrad.addColorStop(1, '#03120a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Background subtle grid lines
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 2. Header Section
  const teamName = (team?.name || 'COLONIA SAN LUIS F.C').toUpperCase();
  const slogan = (team?.slogan || 'LA PERLA VERDE DE ANTIOQUIA').toUpperCase();

  // Load Team Crest (try remote logo, fall back to local assets)
  let crestImg: HTMLImageElement | null = null;
  if (team?.logoUrl) {
    crestImg = await loadImageSafe(team.logoUrl);
  }
  if (!crestImg) {
    crestImg = await loadImageSafe('/team_logo.png');
  }
  if (!crestImg) {
    crestImg = await loadImageSafe('/logo.png');
  }

  // Top header card with glass effect
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  safeRoundRect(ctx, 40, 35, W - 80, 165, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Crest in header
  if (crestImg) {
    ctx.drawImage(crestImg, 65, 52, 130, 130);
  } else {
    // Vector shield fallback if image not found
    ctx.save();
    ctx.translate(130, 117);
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(48, -40);
    ctx.lineTo(48, 20);
    ctx.quadraticCurveTo(0, 60, 0, 60);
    ctx.quadraticCurveTo(0, 60, -48, 20);
    ctx.lineTo(-48, -40);
    ctx.closePath();
    ctx.fillStyle = '#047857';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CSL', 0, 0);
    ctx.restore();
  }

  // Header Titles
  const textX = 220;
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px system-ui, -apple-system, sans-serif';
  ctx.fillText(teamName, textX, 90);

  ctx.fillStyle = '#6ee7b7'; // emerald-300
  ctx.font = '800 16px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';
  ctx.fillText(slogan, textX, 118);
  ctx.letterSpacing = '0px';

  // Subtitle with Match or Lineup name
  let subtitle = `ALINEACIÓN OFICIAL • SISTEMA ${lineup.formation}`;
  if (match) {
    subtitle = `VS ${match.rival.toUpperCase()} • SISTEMA ${lineup.formation} (${lineup.gameFormat})`;
  }
  ctx.fillStyle = '#fef08a'; // yellow-200
  ctx.font = '800 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(subtitle, textX, 155);

  if (match) {
    const matchDetails = `📅 ${formatMatchDate(match.date)} • ⏰ ${match.time} • 📍 ${match.location || 'Por definir'}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText(matchDetails, textX, 182);
  }

  // 3. Football Pitch Field Area
  const pitchX = 50;
  const pitchY = 225;
  const pitchW = W - 100;
  const pitchH = 960;

  // Pitch outer container shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 15;
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  safeRoundRect(ctx, pitchX, pitchY, pitchW, pitchH, 24);
  ctx.fill();
  ctx.restore();

  // Draw Pitch Grass & Stripes
  ctx.save();
  ctx.beginPath();
  safeRoundRect(ctx, pitchX, pitchY, pitchW, pitchH, 24);
  ctx.clip();

  // Grass stripes
  const stripeCount = 14;
  const stripeH = pitchH / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#166534';
    ctx.fillRect(pitchX, pitchY + i * stripeH, pitchW, stripeH);
  }

  // Inner border & Pitch Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 3.5;

  const pad = 30;
  const fieldLeft = pitchX + pad;
  const fieldRight = pitchX + pitchW - pad;
  const fieldTop = pitchY + pad;
  const fieldBottom = pitchY + pitchH - pad;
  const fieldW = fieldRight - fieldLeft;
  const fieldH = fieldBottom - fieldTop;

  // Outer boundary line
  ctx.strokeRect(fieldLeft, fieldTop, fieldW, fieldH);

  // Half-way line
  const midY = fieldTop + fieldH / 2;
  ctx.beginPath();
  ctx.moveTo(fieldLeft, midY);
  ctx.lineTo(fieldRight, midY);
  ctx.stroke();

  // Center Circle & Spot
  const midX = fieldLeft + fieldW / 2;
  ctx.beginPath();
  ctx.arc(midX, midY, 90, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(midX, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Box & Goal
  const boxW = fieldW * 0.52;
  const boxH = fieldH * 0.16;
  const smallBoxW = fieldW * 0.28;
  const smallBoxH = fieldH * 0.07;

  // Top large penalty box
  ctx.strokeRect(midX - boxW / 2, fieldTop, boxW, boxH);
  // Top goal area
  ctx.strokeRect(midX - smallBoxW / 2, fieldTop, smallBoxW, smallBoxH);
  // Top penalty spot
  ctx.beginPath();
  ctx.arc(midX, fieldTop + fieldH * 0.11, 5, 0, Math.PI * 2);
  ctx.fill();
  // Top penalty arc
  ctx.beginPath();
  ctx.arc(midX, fieldTop + fieldH * 0.11, 75, 0.65, Math.PI - 0.65);
  ctx.stroke();

  // Bottom Penalty Box & Goal
  ctx.strokeRect(midX - boxW / 2, fieldBottom - boxH, boxW, boxH);
  ctx.strokeRect(midX - smallBoxW / 2, fieldBottom - smallBoxH, smallBoxW, smallBoxH);
  ctx.beginPath();
  ctx.arc(midX, fieldBottom - fieldH * 0.11, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(midX, fieldBottom - fieldH * 0.11, 75, Math.PI + 0.65, Math.PI * 2 - 0.65);
  ctx.stroke();

  // Corner arcs
  const arcR = 25;
  ctx.beginPath();
  ctx.arc(fieldLeft, fieldTop, arcR, 0, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fieldRight, fieldTop, arcR, Math.PI / 2, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fieldLeft, fieldBottom, arcR, -Math.PI / 2, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(fieldRight, fieldBottom, arcR, Math.PI, -Math.PI / 2);
  ctx.stroke();

  // Watermark club shield in center
  if (crestImg) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.drawImage(crestImg, midX - 180, midY - 180, 360, 360);
    ctx.restore();
  }

  // 4. Draw Tactical Drawings if any
  if (lineup.drawings && lineup.drawings.length > 0) {
    lineup.drawings.forEach((d) => {
      if (d.points.length < 2) return;
      ctx.save();
      ctx.strokeStyle = d.color || '#fef08a';
      ctx.fillStyle = d.color || '#fef08a';
      ctx.lineWidth = 4;
      if (d.type === 'pass') {
        ctx.setLineDash([10, 8]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      const startPt = d.points[0];
      const startX = fieldLeft + (startPt.x / 100) * fieldW;
      const startY = fieldTop + (startPt.y / 100) * fieldH;
      ctx.moveTo(startX, startY);

      for (let i = 1; i < d.points.length; i++) {
        const pt = d.points[i];
        const px = fieldLeft + (pt.x / 100) * fieldW;
        const py = fieldTop + (pt.y / 100) * fieldH;
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // If arrow, draw arrowhead at end
      if (d.type === 'arrow' || d.type === 'pass') {
        const last = d.points[d.points.length - 1];
        const prev = d.points[d.points.length - 2];
        const lx = fieldLeft + (last.x / 100) * fieldW;
        const ly = fieldTop + (last.y / 100) * fieldH;
        const px = fieldLeft + (prev.x / 100) * fieldW;
        const py = fieldTop + (prev.y / 100) * fieldH;
        const angle = Math.atan2(ly - py, lx - px);

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx - 18 * Math.cos(angle - Math.PI / 6), ly - 18 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(lx - 18 * Math.cos(angle + Math.PI / 6), ly - 18 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    });
  }

  // 5. Draw Tactical Ball if present
  if (lineup.ball) {
    const bx = fieldLeft + (lineup.ball.x / 100) * fieldW;
    const by = fieldTop + (lineup.ball.y / 100) * fieldH;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bx, by, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Ball pentagon pattern
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Pre-load player photos
  const photoCache = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    lineup.starters.map(async (st) => {
      if (st.photoUrl) {
        const img = await loadImageSafe(st.photoUrl);
        photoCache.set(st.playerId, img);
      }
    })
  );

  // 6. Draw Player Tokens on Field
  // Proportional token sizing that scales according to game format and active starter count,
  // filling the pitch with impact, grandeur and television broadcast aesthetics.
  const activeStarters = lineup.starters.filter((p) => !p.playerId.startsWith('empty_'));
  const starterCount = activeStarters.length || 11;

  let tokenRadius = 52; // F11 baseline (larger & broadcast style)
  if (starterCount <= 5) {
    tokenRadius = 78; // F5 (diameter 156px) - fills the open pitch grandly
  } else if (starterCount <= 7) {
    tokenRadius = 68; // F7 (diameter 136px)
  } else if (starterCount <= 8) {
    tokenRadius = 62; // F8 (diameter 124px)
  } else if (starterCount <= 9) {
    tokenRadius = 57; // F9 (diameter 114px)
  } else {
    tokenRadius = 52; // F11 (diameter 104px)
  }

  if (playerScale && playerScale > 0) {
    tokenRadius = Math.round(tokenRadius * playerScale);
  }

  lineup.starters.forEach((player) => {
    if (player.playerId.startsWith('empty_')) return;

    const px = fieldLeft + (player.x / 100) * fieldW;
    const py = fieldTop + (player.y / 100) * fieldH;
    const isGK = player.roleCategory === 'POR' || player.role === 'POR';

    ctx.save();
    // 3D Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = Math.round(tokenRadius * 0.45);
    ctx.shadowOffsetY = Math.round(tokenRadius * 0.18);

    const ringColor = isGK
      ? '#facc15'
      : kitStyle === 'away'
      ? '#10b981'
      : kitStyle === 'third'
      ? '#f59e0b'
      : '#34d399'; // border ring accent
    const jw = tokenRadius * 2.25;
    const jh = tokenRadius * 2.0;

    ctx.save();

    // 1. Drop shadow for 3D jersey depth
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;

    // Transform to draw vector jersey based on 64x58 grid
    ctx.save();
    ctx.translate(px - jw / 2, py - jh / 2);
    const sx = jw / 64;
    const sy = jh / 58;
    ctx.scale(sx, sy);

    const defineJerseyPath = () => {
      ctx.beginPath();
      ctx.moveTo(22, 5);
      ctx.quadraticCurveTo(32, 11, 42, 5);
      ctx.lineTo(53, 10);
      ctx.lineTo(63, 23);
      ctx.lineTo(54, 29);
      ctx.lineTo(47, 21);
      ctx.lineTo(46, 52);
      ctx.quadraticCurveTo(32, 55, 18, 52);
      ctx.lineTo(17, 21);
      ctx.lineTo(10, 29);
      ctx.lineTo(1, 23);
      ctx.lineTo(11, 10);
      ctx.closePath();
    };

    // Fill Base Jersey
    defineJerseyPath();
    const grad = ctx.createLinearGradient(0, 0, 0, 58);
    if (isGK) {
      // Sol Radiante de San Luis (Golden Amber)
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.45, '#fbbf24');
      grad.addColorStop(1, '#d97706');
    } else if (kitStyle === 'away') {
      // Blanco Antioquia con vivos San Luis
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.6, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
    } else if (kitStyle === 'third') {
      // Azul Río Dormilón / Samaná Norte
      grad.addColorStop(0, '#0284c7');
      grad.addColorStop(0.5, '#0369a1');
      grad.addColorStop(1, '#075985');
    } else {
      // Home: Verde Esmeralda (Perla Verde del Oriente)
      grad.addColorStop(0, '#059669');
      grad.addColorStop(0.5, '#047857');
      grad.addColorStop(1, '#064e3b');
    }
    ctx.fillStyle = grad;
    ctx.fill();

    // Reset shadow for details inside jersey
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Stripes and Official San Luis Flag Graphics
    if (!isGK) {
      ctx.save();
      defineJerseyPath();
      ctx.clip();

      if (kitStyle === 'away') {
        // Double vertical stripe: Verde Antioquia & Azul Río San Luis
        ctx.fillStyle = 'rgba(4, 120, 87, 0.92)';
        ctx.fillRect(22, 0, 9, 58);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.92)';
        ctx.fillRect(33, 0, 9, 58);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(31, 0, 2, 58);
        // Flank accents
        ctx.fillStyle = 'rgba(4, 120, 87, 0.25)';
        ctx.fillRect(16, 0, 3, 58);
        ctx.fillStyle = 'rgba(2, 132, 199, 0.25)';
        ctx.fillRect(45, 0, 3, 58);

        // Mini Golden Sun of San Luis
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(32, 18, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else if (kitStyle === 'third') {
        // Azul Río Dormilón with Emerald flanks & Golden accents
        ctx.fillStyle = 'rgba(5, 150, 105, 0.9)';
        ctx.fillRect(18, 0, 5, 58);
        ctx.fillRect(41, 0, 5, 58);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(23, 0, 1.5, 58);
        ctx.fillRect(39.5, 0, 1.5, 58);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.fillRect(26, 0, 12, 58);

        // Radiant Sun
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(32, 18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      } else {
        // Home: Bandera de San Luis (Verde - Azul Río central - Sol Dorado)
        ctx.fillStyle = 'rgba(2, 132, 199, 0.95)';
        ctx.fillRect(22, 0, 20, 58);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(20.5, 0, 1.5, 58);
        ctx.fillRect(42, 0, 1.5, 58);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fillRect(23.5, 0, 1, 58);
        ctx.fillRect(39.5, 0, 1, 58);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.fillRect(15, 0, 4, 58);
        ctx.fillRect(45, 0, 4, 58);

        // Radiant Golden Sun Emblem of San Luis
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(32, 18, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 0.9;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(32, 13.2); ctx.lineTo(32, 14.5);
        ctx.moveTo(32, 21.5); ctx.lineTo(32, 22.8);
        ctx.moveTo(27.2, 18); ctx.lineTo(28.5, 18);
        ctx.moveTo(35.5, 18); ctx.lineTo(36.8, 18);
        ctx.moveTo(28.6, 14.6); ctx.lineTo(29.5, 15.5);
        ctx.moveTo(34.5, 20.5); ctx.lineTo(35.4, 21.4);
        ctx.moveTo(28.6, 21.4); ctx.lineTo(29.5, 20.5);
        ctx.moveTo(34.5, 15.5); ctx.lineTo(35.4, 14.6);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Goalkeeper shoulder accents (Verde Esmeralda & Azul Río)
    if (isGK) {
      ctx.save();
      defineJerseyPath();
      ctx.clip();
      // Left Shoulder (Verde Esmeralda)
      ctx.fillStyle = 'rgba(4, 120, 87, 0.85)';
      ctx.beginPath();
      ctx.moveTo(11, 10);
      ctx.lineTo(22, 5);
      ctx.lineTo(20, 13);
      ctx.lineTo(10, 16);
      ctx.closePath();
      ctx.fill();
      // Right Shoulder (Azul Río)
      ctx.fillStyle = 'rgba(2, 132, 199, 0.85)';
      ctx.beginPath();
      ctx.moveTo(53, 10);
      ctx.lineTo(42, 5);
      ctx.lineTo(44, 13);
      ctx.lineTo(54, 16);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Jersey Outline
    defineJerseyPath();
    ctx.strokeStyle = isGK
      ? '#0284c7'
      : kitStyle === 'away'
      ? '#0284c7'
      : kitStyle === 'third'
      ? '#38bdf8'
      : '#34d399';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Collar Trim
    ctx.beginPath();
    ctx.moveTo(22, 5);
    ctx.quadraticCurveTo(32, 11, 42, 5);
    ctx.strokeStyle = isGK
      ? '#0c4a6e'
      : kitStyle === 'away'
      ? '#047857'
      : kitStyle === 'third'
      ? '#fbbf24'
      : '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Sleeve Cuffs (Left Verde, Right Azul for rich San Luis identity)
    ctx.beginPath();
    ctx.moveTo(1, 23);
    ctx.lineTo(10, 29);
    ctx.strokeStyle = isGK ? '#047857' : kitStyle === 'away' ? '#047857' : kitStyle === 'third' ? '#fbbf24' : '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(63, 23);
    ctx.lineTo(54, 29);
    ctx.strokeStyle = isGK ? '#0284c7' : kitStyle === 'away' ? '#0284c7' : kitStyle === 'third' ? '#fbbf24' : '#0284c7';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Captain Armband
    if (player.isCaptain) {
      ctx.save();
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(3.5, 21.5);
      ctx.lineTo(10.5, 18);
      ctx.lineTo(11.5, 23.5);
      ctx.lineTo(4.5, 26.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#000000';
      ctx.font = '900 5px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('C', 7.5, 22.5);
      ctx.restore();
    }

    // Photo Crest Badge on Chest
    const playerImg = photoCache.get(player.playerId);
    if (playerImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(21, 20, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.clip();
      ctx.drawImage(playerImg, 15.5, 14.5, 11, 11);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(21, 20, 5.5, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Dorsal Jersey Number
    ctx.save();
    ctx.fillStyle = isGK
      ? '#0c4a6e'
      : kitStyle === 'away'
      ? '#047857'
      : kitStyle === 'third'
      ? '#fef08a'
      : '#ffffff';
    ctx.font = '900 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = isGK
      ? '#ffffff'
      : kitStyle === 'away'
      ? '#ffffff'
      : kitStyle === 'third'
      ? '#0c4a6e'
      : '#0c4a6e';
    ctx.lineWidth = 0.8;
    ctx.strokeText(`${player.jerseyNumber}`, 32, 35);
    ctx.fillText(`${player.jerseyNumber}`, 32, 35);
    ctx.restore();

    ctx.restore(); // end scaled jersey
    ctx.restore(); // end drop shadow

    // Player Name Pill directly under jersey (Grandeur & High Contrast)
    const displayName = formatFirstAndLastName(player.fullName);
    const nameFontSize = Math.round(tokenRadius * 0.4);
    ctx.font = `900 ${nameFontSize}px system-ui, -apple-system, sans-serif`;
    const textWidth = ctx.measureText(displayName).width;
    const pillW = Math.max(textWidth + Math.round(tokenRadius * 0.8), Math.round(tokenRadius * 2.85));
    const pillH = Math.round(tokenRadius * 0.68);
    const pillY = py + jh / 2 + 5;

    // Pill background (dark glass)
    ctx.save();
    ctx.fillStyle = 'rgba(2, 10, 6, 0.95)';
    ctx.beginPath();
    safeRoundRect(ctx, px - pillW / 2, pillY, pillW, pillH, 8);
    ctx.fill();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(displayName, px, pillY + pillH / 2);

    // Role badge underneath pill
    const roleFontSize = Math.round(tokenRadius * 0.28);
    ctx.font = `900 ${roleFontSize}px system-ui, -apple-system, sans-serif`;
    const roleText = player.role.toUpperCase();
    const roleW = Math.max(ctx.measureText(roleText).width + 18, Math.round(tokenRadius * 0.9));
    const roleH = Math.round(tokenRadius * 0.44);
    const roleY = pillY + pillH + 4;

    ctx.fillStyle = isGK ? 'rgba(250, 204, 21, 0.95)' : 'rgba(4, 120, 87, 0.95)';
    ctx.beginPath();
    safeRoundRect(ctx, px - roleW / 2, roleY, roleW, roleH, 6);
    ctx.fill();
    ctx.strokeStyle = isGK ? '#ca8a04' : '#10b981';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = isGK ? '#713f12' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(roleText, px, roleY + roleH / 2);
    ctx.restore();

    ctx.restore();
  });

  ctx.restore(); // end pitch clip

  // 7. Substitutes / Bench Section Footer
  const benchY = pitchY + pitchH + 25;
  const benchH = 185;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  safeRoundRect(ctx, 50, benchY, W - 100, benchH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Bench header
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 18px system-ui, -apple-system, sans-serif';
  ctx.fillText('SUPLENTES / BANCA DE RESERVAS', 75, benchY + 36);

  const activeBench = lineup.bench.filter((p) => !p.playerId.startsWith('empty_'));
  if (activeBench.length === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '600 15px system-ui, -apple-system, sans-serif';
    ctx.fillText('Sin suplentes registrados para este partido', 75, benchY + 75);
  } else {
    // Render bench players in compact two-column chips
    const colW = (W - 170) / 2;
    const startBenchY = benchY + 68;

    activeBench.slice(0, 10).forEach((sub, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const chipX = 75 + col * colW;
      const chipY = startBenchY + row * 26;

      if (row < 4) {
        // Dorsal pill
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        safeRoundRect(ctx, chipX, chipY - 14, 32, 20, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${sub.jerseyNumber}`, chipX + 16, chipY - 4);

        // Name
        ctx.textAlign = 'left';
        ctx.fillStyle = '#e5e7eb';
        ctx.font = '800 15px system-ui, -apple-system, sans-serif';
        const formattedSubName = formatFirstAndLastName(sub.fullName);
        ctx.fillText(formattedSubName, chipX + 40, chipY - 4);
      }
    });

    if (activeBench.length > 8) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#9ca3af';
      ctx.font = '700 12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`+${activeBench.length - 8} más en banca`, W - 80, benchY + 36);
    }
  }

  // Footer branding tag
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '600 12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Colonia San Luis F.C • Convocatoria Fútbol App', W / 2, H - 20);

  ctx.restore();
}

const COMPOUND_FIRST_NAMES = new Set([
  'carlos', 'jose', 'josé', 'maria', 'maría', 'andres', 'andrés',
  'felipe', 'david', 'eduardo', 'fernando', 'manuel', 'antonio',
  'alberto', 'alejandro', 'guillermo', 'alexander', 'esteban',
  'camilo', 'sebastian', 'sebastián', 'luis', 'miguel', 'juan',
  'jorge', 'daniel', 'diego', 'cristian', 'victor', 'víctor',
  'pablo', 'mario', 'javier', 'julian', 'julián', 'gustavo',
  'alvaro', 'álvaro', 'angel', 'ángel', 'arturo', 'stiven',
  'steven', 'santiago', 'ricardo', 'leonardo', 'gabriel', 'brayan'
]);

function toCleanTitle(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formats full name to cleanly display One First Name and One Last Name.
 * e.g. "Juan Carlos Pérez Gómez" -> "Juan Pérez"
 * "Carlos Ruiz" -> "Carlos Ruiz"
 * "Mateo Londoño Mejía" -> "Mateo Londoño"
 * "Pipe Buho" -> "Pipe Buho"
 * "BRAYAN STIVEN GOMEZ" -> "Brayan Gómez"
 */
export function formatFirstAndLastName(fullName: string): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  if (trimmed.startsWith('Vacante')) return trimmed;
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return toCleanTitle(parts[0]);
  if (parts.length === 2) return `${toCleanTitle(parts[0])} ${toCleanTitle(parts[1])}`;

  const first = toCleanTitle(parts[0]);
  const secondLower = parts[1].toLowerCase();

  // If 2nd word is a known compound first name (e.g., "Juan Carlos Pérez"),
  // pick the 3rd word as surname
  if (COMPOUND_FIRST_NAMES.has(secondLower)) {
    const surname = parts[2] ? toCleanTitle(parts[2]) : toCleanTitle(parts[1]);
    return `${first} ${surname}`;
  }

  // If 2nd word is already the surname (e.g., "Mateo Londoño Mejía"),
  // pick the 2nd word as surname
  return `${first} ${toCleanTitle(parts[1])}`;
}

/**
 * Helper to get clean short name for visual tokens
 */
export function getShortPlayerName(fullName: string, _maxLen = 22): string {
  return formatFirstAndLastName(fullName);
}

/**
 * Robust canvas download helper using Blob & ObjectURL with reliable fallback.
 * Prevents blank image downloads and handles high-resolution canvas seamlessly.
 */
export async function downloadTacticalCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<boolean> {
  if (!canvas) return false;

  try {
    const blobPromise = new Promise<Blob | null>((resolve) => {
      try {
        canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
      } catch {
        resolve(null);
      }
    });

    const blob = await blobPromise;
    if (blob && blob.size > 1000) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 1000);
      return true;
    }

    // Direct DataURL fallback
    const dataUrl = canvas.toDataURL('image/png', 0.95);
    if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 1000) {
      throw new Error('Canvas data URL is empty');
    }
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 200);
    return true;
  } catch (err) {
    console.error('Error downloading tactical canvas:', err);
    return false;
  }
}
