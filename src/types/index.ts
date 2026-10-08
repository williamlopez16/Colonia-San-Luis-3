/**
 * Core Data Models & Types for Convocatoria Fútbol
 * Strict typing across all components and services. No any types allowed.
 */

export type PlayerStatus = 'Activo' | 'Inactivo' | 'Lesionado';

export type AttendanceStatus = 'Confirmado' | 'No asiste' | 'Pendiente';

export type MatchStatus = 'Abierta' | 'Cerrada';

export interface Team {
  id: string;
  name: string;
  category: string;
  slogan?: string;
  logoUrl?: string; // URL fija del escudo/logo oficial del club
  adminPassword?: string; // Clave de modo gestión (administrador/DT)
  backgroundPhotos?: string[]; // Fotos de fondo para carteleras matchday
  primaryColor: string; // Hex color, e.g. #15803d
  secondaryColor: string; // Hex color, e.g. #ffffff
  createdAt: string;
  updatedAt: string;
}

export interface Tournament {
  id: string;
  teamId: string;
  name: string;
  year?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  teamId: string;
  fullName: string;
  jerseyNumber: number; // Unique dorsal number per team among active players
  phone: string; // Phone / WhatsApp number
  idCard?: string; // Cédula (optional)
  eps?: string; // EPS (optional)
  status: PlayerStatus;
  isScholarship?: boolean; // ¿Jugador becado / exento de cuotas?
  createdAt: string;
  updatedAt: string;
}

export interface Concept {
  id: string;
  teamId: string;
  name: string;
  suggestedValue: number;
  isDefaultArbitration?: boolean; // Default referee cost prefilled in matches
  createdAt: string;
  updatedAt: string;
}

export interface Callup {
  playerId: string;
  fullName: string;
  jerseyNumber: number;
  phone: string;
  status: AttendanceStatus;
  reason?: string;
  confirmedAt?: string;
  // Post-match validation fields
  attended?: boolean; // Re-validación: true si asistió a la cancha, false si faltó tras confirmar
  arbitrationPaid?: boolean; // Check simple: ¿Pagó su cuota de arbitraje?
  arbitrationAmount?: number; // Valor personalizado de la cuota de arbitraje (puede ser mayor o menor)
  arbitrationMethod?: PaymentMethod; // Método de pago (Efectivo, Nequi, etc.)
  arbitrationChargeId?: string; // ID del cobro vinculado en finanzas
  isScholarship?: boolean; // ¿Marcado como becado en este partido?
  arbitrationNote?: string; // Nota / mensaje / motivo de beca o aporte ese día
}

export type MatchState = 'Programado' | 'Finalizado';

export interface MatchScore {
  homeGoals: number; // Goles de nuestro equipo
  awayGoals: number; // Goles del rival
  isPlayed?: boolean;
}

export interface PlayerMatchStats {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface Match {
  id: string;
  teamId: string;
  tournamentId: string;
  tournamentName: string;
  rival: string;
  rivalLogo?: string;
  teamLogo?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  refereeFee: string; // Pre-filled formatted currency string, e.g. "$12.000"
  status: MatchStatus;
  matchState?: MatchState;
  score?: MatchScore;
  playerStats?: PlayerMatchStats[];
  callups: Callup[];
  postMatchDone?: boolean; // Control postpartido completado (asistencia real y arbitraje validados)
  postMatchFeePerPlayer?: number; // Cuota por jugador definida para este partido
  createdAt: string;
  updatedAt: string;
}

export interface MatchAttendanceCounters {
  confirmed: number;
  declined: number;
  pending: number;
  total: number;
}

export type ChargeType = 'arbitraje' | 'esporadico';
export type ChargeStatus = 'Pendiente' | 'Pagado';
export type PaymentMethod = 'Nequi' | 'Daviplata' | 'Efectivo' | 'Transferencia' | 'Otro';

export interface Charge {
  id: string;
  teamId: string;
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  conceptName: string; // "Arbitraje", "Uniforme", "Inscripción torneo", etc.
  type: ChargeType;
  matchId?: string; // solo si type === 'arbitraje', referencia al partido
  amount: number;
  status: ChargeStatus;
  paymentMethod?: PaymentMethod;
  isScholarship?: boolean; // Indicador de cuota becada / exenta
  notes?: string; // Motivo de beca o notas de pago / mensaje explicativo
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

