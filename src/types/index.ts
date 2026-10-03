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
}

export interface Match {
  id: string;
  teamId: string;
  tournamentId: string;
  tournamentName: string;
  rival: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  refereeFee: string; // Pre-filled formatted currency string, e.g. "$12.000"
  status: MatchStatus;
  callups: Callup[];
  createdAt: string;
  updatedAt: string;
}

export interface MatchAttendanceCounters {
  confirmed: number;
  declined: number;
  pending: number;
  total: number;
}
