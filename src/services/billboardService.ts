/**
 * Matchday Visual Billboard Graphic Generator
 * Generates a 1:1 professional soccer matchday roster graphic using native HTML5 Canvas.
 * Styled in Verdolaga green & white tones (San Luis, Antioquia).
 * Completely self-contained and failsafe.
 */

import type { Team, Match, Callup } from '../types';
import { formatMatchDate } from './whatsappService';

export function renderMatchdayToCanvas(
  canvas: HTMLCanvasElement,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto 2D del Canvas');
      }

      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // 1. Background Gradient (Deep Forest Verdolaga)
      const bgGrad = ctx.createLinearGradient(0, 0, size, size);
      bgGrad.addColorStop(0, '#052e16'); // Dark emerald
      bgGrad.addColorStop(0.4, '#14532d');
      bgGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, size, size);

      // 2. Geometric Layered Accents (White & Green geometric stripes)
      ctx.save();
      // Diagonal Green Shape
      ctx.beginPath();
      ctx.moveTo(-100, 300);
      ctx.lineTo(size + 100, -100);
      ctx.lineTo(size + 100, 180);
      ctx.lineTo(-100, 580);
      ctx.closePath();
      ctx.fillStyle = 'rgba(21, 128, 61, 0.25)';
      ctx.fill();

      // Sharp White Accent Ribbon
      ctx.beginPath();
      ctx.moveTo(-100, 520);
      ctx.lineTo(size + 100, 120);
      ctx.lineTo(size + 100, 140);
      ctx.lineTo(-100, 540);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Subtle Pitch Center Circle Graphic in bottom background
      ctx.beginPath();
      ctx.arc(size / 2, size - 150, 320, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size / 2, size - 470);
      ctx.lineTo(size / 2, size);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // 3. Header Section
      // Top badge
      ctx.save();
      ctx.fillStyle = '#22c55e'; // Bright green pill
      ctx.beginPath();
      const pillWidth = 260;
      const pillHeight = 36;
      const pillX = (size - pillWidth) / 2;
      const pillY = 48;
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 18);
      ctx.fill();

      ctx.fillStyle = '#052e16';
      ctx.font = 'bold 16px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CONVOCATORIA OFICIAL', size / 2, pillY + pillHeight / 2);
      ctx.restore();

      // Team Name
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 12;
      ctx.fillText(team.name.toUpperCase(), size / 2, 96);

      // Match Details Card
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      const cardX = 60;
      const cardY = 168;
      const cardW = size - 120;
      const cardH = 135;
      ctx.roundRect(cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Tournament Name
      ctx.fillStyle = '#86efac';
      ctx.font = '600 18px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(match.tournamentName ? `🏆 ${match.tournamentName.toUpperCase()}` : 'PARTIDO OFICIAL', size / 2, cardY + 16);

      // Rival matchup
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 32px "Inter", "Segoe UI", sans-serif';
      ctx.fillText(`VS  ${match.rival.toUpperCase()}`, size / 2, cardY + 44);

      // Date, Time, Location bar
      const infoParts: string[] = [];
      const formattedDate = formatMatchDate(match.date);
      if (formattedDate) infoParts.push(`📅 ${formattedDate}`);
      if (match.time) infoParts.push(`🕐 ${match.time}`);
      if (match.location) infoParts.push(`📍 ${match.location}`);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '500 17px "Inter", "Segoe UI", sans-serif';
      ctx.fillText(infoParts.join('  •  '), size / 2, cardY + 95);
      ctx.restore();

      // 4. Confirmed Players Roster Section
      const rosterY = 328;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`JUGADORES CONFIRMADOS (${confirmedPlayers.length})`, 60, rosterY);

      // Accent underline
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(60, rosterY + 10, 120, 4);
      ctx.restore();

      if (confirmedPlayers.length === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = 'italic 22px "Inter", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No se registraron jugadores confirmados antes del cierre.', size / 2, 540);
        ctx.restore();
      } else {
        // Render players in 2 columns
        const colW = (size - 120 - 30) / 2;
        const startY = 360;
        const itemH = 50;
        const maxPerCol = 10;

        confirmedPlayers.slice(0, 20).forEach((player, idx) => {
          const col = idx < maxPerCol ? 0 : 1;
          const row = idx % maxPerCol;
          const x = 60 + col * (colW + 30);
          const y = startY + row * itemH;

          // Item background container
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.beginPath();
          ctx.roundRect(x, y, colW, 42, 8);
          ctx.fill();

          // Circular dorsal badge
          const circleR = 17;
          const circleX = x + 24;
          const circleY = y + 21;

          ctx.beginPath();
          ctx.arc(circleX, circleY, circleR, 0, Math.PI * 2);
          ctx.fillStyle = '#16a34a'; // Emerald badge
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Dorsal number
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Inter", "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.jerseyNumber), circleX, circleY);

          // Player Full Name
          ctx.fillStyle = '#ffffff';
          ctx.font = '600 16px "Inter", "Segoe UI", sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          
          let displayName = player.fullName;
          if (displayName.length > 22) {
            displayName = displayName.substring(0, 20) + '...';
          }
          ctx.fillText(displayName, x + 50, circleY);
          ctx.restore();
        });
      }

      // 5. Footer Section
      const footerY = size - 140;
      ctx.save();
      // Divider
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, footerY);
      ctx.lineTo(size - 60, footerY);
      ctx.stroke();

      // Motivational Message
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Inter", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('¡VAMOS CON TODO POR LA VICTORIA! 💪', size / 2, footerY + 36);

      // Hashtag / Location
      ctx.fillStyle = '#86efac';
      ctx.font = '600 18px "Inter", "Segoe UI", sans-serif';
      ctx.fillText('#SanLuisAntioquia  •  #VamosEquipo  •  #FútbolAmateur', size / 2, footerY + 70);
      ctx.restore();

      resolve();
    } catch (error) {
      console.error('Error rendering matchday graphic:', error);
      reject(error);
    }
  });
}

export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  try {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Error exporting canvas as PNG:', err);
    throw new Error('No se pudo descargar la imagen en este navegador.');
  }
}
