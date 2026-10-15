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
  isCaptain?: boolean; // ¿Capitán del equipo?
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

export interface Venue {
  id: string;
  teamId: string;
  name: string; // Nombre de la cancha o escenario deportivo
  address?: string; // Dirección o detalles de ubicación
  isDefault?: boolean; // Cancha habitual del equipo
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

export interface MatchSubstitution {
  id: string;
  minute: number; // Minuto del cambio (ej. 45)
  playerOutId: string;
  playerOutName: string;
  playerInId: string;
  playerInName: string;
  notes?: string; // Motivo opcional (lesión, táctico, rotación)
}

export interface PlayerMatchStats {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  // Control de alineación y minutos
  isStarter?: boolean; // ¿Inició como titular?
  minutesPlayed?: number; // Minutos disputados en el partido
  subbedInMinute?: number; // Minuto en que ingresó desde el banco
  subbedOutMinute?: number; // Minuto en que fue sustituido
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
  matchDurationMinutes?: number; // Duración total del partido en minutos (por defecto 90)
  substitutions?: MatchSubstitution[]; // Lista de cambios/sustituciones del partido
  callups: Callup[];
  postMatchDone?: boolean; // Control postpartido completado (asistencia real y arbitraje validados)
  postMatchFeePerPlayer?: number; // Cuota por jugador definida para este partido
  refereeCollectorName?: string; // Nombre de la persona que recogió el arbitraje ese día
  // Opciones de convocatoria avanzadas
  suggestedArrivalTime?: string; // Hora o anticipación sugerida de llegada a la cancha (ej. "18:45" o "45 min antes")
  confirmationDeadline?: string; // Límite de confirmación / Cierre de convocatoria (YYYY-MM-DDTHH:mm o texto descriptivo)
  itemsToBring?: string[]; // Implementos indispensables a recordar (Uniforme completo, Espinilleras, Cédula, Hidratación, etc.)
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
  collectedBy?: string; // Nombre de quien recibió o recaudó este cobro
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

