/**
 * WhatsApp Message Generator and Sharing Utility
 * Generates formatted invitation text according to strict specifications:
 * 
 * 🟢⚪ {NOMBRE_EQUIPO} ⚪🟢
 * 
 * 📋 CONVOCATORIA — {fecha_partido}
 * 
 * 🏆 Torneo: {nombre_torneo}
 * 🕐 Hora: {hora_partido}
 * 📍 Lugar: {lugar_partido}
 * 🆚 Rival: {rival}
 * 
 * 💰 Arbitraje: {valor_arbitraje} por jugador
 * 
 * 👉 Confirma tu asistencia aquí:
 * {enlace_confirmacion}
 * 
 * ¡Vamos equipo! 💪
 * 
 * Note: Omit any line where the data is empty.
 */

import type { Team, Match } from '../types';

export function getConfirmationUrl(matchId: string): string {
  if (typeof window === 'undefined') return `/confirmar/${matchId}`;
  const origin = window.location.origin;
  // Support both hash route and path route for maximum static deployment compatibility
  return `${origin}/#confirmar/${matchId}`;
}

export function formatMatchDate(dateString: string): string {
  if (!dateString) return '';
  try {
    // Assuming YYYY-MM-DD
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, monthIndex, day);
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${days[d.getDay()]}, ${day} de ${months[monthIndex]} de ${year}`;
    }
  } catch (err) {
    console.warn('Error formatting date:', err);
  }
  return dateString;
}

export function generateWhatsAppMessage(team: Team, match: Match): string {
  const confirmationUrl = getConfirmationUrl(match.id);
  const formattedDate = formatMatchDate(match.date);

  const lines: string[] = [];

  // Team header
  const teamName = team.name.trim() || 'EQUIPO';
  lines.push(`🟢⚪ ${teamName.toUpperCase()} ⚪🟢`);
  lines.push('');

  // Convocatoria header
  if (formattedDate) {
    lines.push(`📋 CONVOCATORIA — ${formattedDate}`);
  } else {
    lines.push('📋 CONVOCATORIA');
  }
  lines.push('');

  // Info details (omit if empty)
  const detailLines: string[] = [];
  if (match.tournamentName && match.tournamentName.trim()) {
    detailLines.push(`🏆 Torneo: ${match.tournamentName.trim()}`);
  }
  if (match.time && match.time.trim()) {
    detailLines.push(`🕐 Hora: ${match.time.trim()}`);
  }
  if (match.location && match.location.trim()) {
    detailLines.push(`📍 Lugar: ${match.location.trim()}`);
  }
  if (match.rival && match.rival.trim()) {
    detailLines.push(`🆚 Rival: ${match.rival.trim()}`);
  }

  if (detailLines.length > 0) {
    lines.push(...detailLines);
    lines.push('');
  }

  // Referee fee
  if (match.refereeFee && match.refereeFee.trim()) {
    lines.push(`💰 Arbitraje: ${match.refereeFee.trim()} por jugador`);
    lines.push('');
  }

  // Link
  lines.push('👉 Confirma tu asistencia aquí:');
  lines.push(confirmationUrl);
  lines.push('');
  lines.push('¡Vamos equipo! 💪');

  return lines.join('\n');
}

export function openWhatsAppShare(text: string): void {
  const encoded = encodeURIComponent(text);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard writeText failed, falling back:', err);
    }
  }

  // Fallback for older browsers or restricted environments
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
}
