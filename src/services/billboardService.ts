/**
 * Generative Matchday Billboard Graphic Generator
 * Professional-grade HTML5 Canvas renderer for sports matchday announcements.
 * Supports multiple distinct layout templates, 1:1 Feed & 9:16 Story formats,
 * code-generated illustrations (stadium lights, grass patterns, pitch lines, player silhouettes),
 * and custom photo backgrounds with brand overlays.
 */

import type { Team, Match, Callup } from '../types';
import { formatMatchDate } from './whatsappService';

export type BillboardFormat = 'feed' | 'story';

export interface BillboardTemplateInfo {
  id: string;
  name: string;
  description: string;
  badge: string;
}

export const BILLBOARD_TEMPLATES: BillboardTemplateInfo[] = [
  {
    id: 'diagonal_split',
    name: 'Diagonal Split',
    description: 'Corte diagonal audaz, tipografía gigante de impacto y franja dinámica de convocados.',
    badge: 'Dinámico',
  },
  {
    id: 'stadium_spotlight',
    name: 'Stadium Spotlight',
    description: 'Fondo nocturno con reflectores de estadio, foco radial en el escudo y atmósfera dramática.',
    badge: 'Nocturno',
  },
  {
    id: 'bold_grid',
    name: 'Bold Bento Grid',
    description: 'Composición asimétrica tipo mosaico con tarjetas de alto contraste y dorsales resaltados.',
    badge: 'Editorial',
  },
  {
    id: 'geometric_mesh',
    name: 'Geometric Mesh',
    description: 'Polígonos superpuestos con transparencia, silueta de jugador y sensación de alta velocidad.',
    badge: 'Energía',
  },
  {
    id: 'circular_focus',
    name: 'Circular Focus',
    description: 'Gran escudo central con aros orbitales iluminados y lista de convocados en panel inferior.',
    badge: 'Clásico Pro',
  },
];

export function getDeterministicTemplateIndex(matchId: string, count = BILLBOARD_TEMPLATES.length): number {
  if (!matchId) return 0;
  let hash = 0;
  for (let i = 0; i < matchId.length; i++) {
    hash = (hash * 33 + matchId.charCodeAt(i)) & 0x7fffffff;
  }
  return hash % count;
}

/**
 * Ensures Google Fonts and local fonts are loaded before drawing on the Canvas.
 */
async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.allSettled([
      document.fonts.load('900 60px "Anton"'),
      document.fonts.load('700 48px "Bebas Neue"'),
      document.fonts.load('800 36px "Montserrat"'),
    ]);
    await document.fonts.ready;
  } catch (err) {
    console.warn('Advertencia de carga de fuentes; se usarán tipografías de respaldo:', err);
  }
}

/**
 * Helper to load an image element safely.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
    img.src = src;
  });
}

/**
 * Draws custom background image with aspect-ratio cover and brand gradient overlay.
 */
function drawPhotoBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  primaryColor: string
) {
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  let renderW = width;
  let renderH = height;
  let offsetX = 0;
  let offsetY = 0;

  if (imgRatio > canvasRatio) {
    renderH = height;
    renderW = height * imgRatio;
    offsetX = (width - renderW) / 2;
  } else {
    renderW = width;
    renderH = width / imgRatio;
    offsetY = (height - renderH) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, renderW, renderH);

  // Dark brand color overlay for maximum contrast and legibility
  const overlayGrad = ctx.createLinearGradient(0, 0, 0, height);
  overlayGrad.addColorStop(0, 'rgba(5, 46, 22, 0.82)');
  overlayGrad.addColorStop(0.4, 'rgba(10, 30, 18, 0.75)');
  overlayGrad.addColorStop(1, 'rgba(2, 20, 10, 0.94)');
  ctx.fillStyle = overlayGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle primary color tint
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.15;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1.0;
}

/**
 * Procedural grass cut stripe pattern.
 */
function drawGrassPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  const stripeHeight = 65;
  const count = Math.ceil(height / stripeHeight);
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.fillRect(0, i * stripeHeight, width, stripeHeight);
    }
  }
  ctx.restore();
}

/**
 * Procedural pitch lines.
 */
function drawPitchLines(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 3;

  // Center circle
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.45, Math.min(width, height) * 0.28, 0, Math.PI * 2);
  ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.moveTo(0, height * 0.45);
  ctx.lineTo(width, height * 0.45);
  ctx.stroke();

  // Center spot
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.45, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.fill();
  ctx.restore();
}

/**
 * Procedural stadium spotlight flares in upper corners.
 */
function drawStadiumFlares(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  // Flare Top-Left
  const flare1 = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.7);
  flare1.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  flare1.addColorStop(0.3, 'rgba(74, 222, 128, 0.15)');
  flare1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = flare1;
  ctx.fillRect(0, 0, width * 0.7, width * 0.7);

  // Flare Top-Right
  const flare2 = ctx.createRadialGradient(width, 0, 10, width, 0, width * 0.7);
  flare2.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
  flare2.addColorStop(0.3, 'rgba(34, 197, 94, 0.15)');
  flare2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = flare2;
  ctx.fillRect(width * 0.3, 0, width * 0.7, width * 0.7);
  ctx.restore();
}

/**
 * Procedural abstract crowd dots matrix.
 */
function drawCrowdTexture(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
  const step = 28;
  const startY = height * 0.08;
  const endY = height * 0.4;
  for (let x = 30; x < width - 30; x += step) {
    for (let y = startY; y < endY; y += step) {
      if ((x + y) % 3 === 0) {
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

/**
 * Procedural stylized vector player silhouette kicking/running.
 */
function drawPlayerSilhouette(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  color = 'rgba(255, 255, 255, 0.08)'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;

  // Head
  ctx.beginPath();
  ctx.arc(60, 20, 16, 0, Math.PI * 2);
  ctx.fill();

  // Torso & Dynamic Running Motion
  ctx.beginPath();
  ctx.moveTo(50, 40);
  ctx.lineTo(80, 50);
  ctx.lineTo(70, 110);
  ctx.lineTo(40, 95);
  ctx.closePath();
  ctx.fill();

  // Front Leg kicking
  ctx.beginPath();
  ctx.moveTo(70, 105);
  ctx.lineTo(125, 145);
  ctx.lineTo(155, 140);
  ctx.lineTo(120, 160);
  ctx.lineTo(65, 115);
  ctx.closePath();
  ctx.fill();

  // Back Leg
  ctx.beginPath();
  ctx.moveTo(45, 95);
  ctx.lineTo(15, 150);
  ctx.lineTo(5, 185);
  ctx.lineTo(25, 185);
  ctx.lineTo(35, 145);
  ctx.closePath();
  ctx.fill();

  // Forward Arm
  ctx.beginPath();
  ctx.moveTo(78, 52);
  ctx.lineTo(110, 85);
  ctx.lineTo(105, 95);
  ctx.lineTo(72, 65);
  ctx.closePath();
  ctx.fill();

  // Back Arm
  ctx.beginPath();
  ctx.moveTo(50, 48);
  ctx.lineTo(20, 75);
  ctx.lineTo(25, 85);
  ctx.lineTo(58, 60);
  ctx.closePath();
  ctx.fill();

  // Ball
  ctx.beginPath();
  ctx.arc(175, 155, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Procedural stylized Team Crest graphic or real team logo image.
 */
function drawVectorCrest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  teamName: string,
  isOurTeam = true,
  teamLogoImg: HTMLImageElement | null = null
) {
  if (isOurTeam && teamLogoImg) {
    ctx.save();
    ctx.shadowColor = 'rgba(234, 179, 8, 0.45)';
    ctx.shadowBlur = 20;

    // Draw the real official logo image cleanly
    ctx.drawImage(teamLogoImg, x - size / 2, y - size / 2, size, size);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.translate(x - size / 2, y - size / 2);

  // Outer glow shadow
  ctx.shadowColor = isOurTeam ? 'rgba(34, 197, 94, 0.4)' : 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 18;

  // Crest shield shape
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.1);
  ctx.lineTo(size * 0.9, size * 0.1);
  ctx.lineTo(size * 0.9, size * 0.55);
  ctx.bezierCurveTo(size * 0.9, size * 0.85, size * 0.5, size * 0.98, size * 0.5, size);
  ctx.bezierCurveTo(size * 0.5, size * 0.98, size * 0.1, size * 0.85, size * 0.1, size * 0.55);
  ctx.closePath();

  ctx.fillStyle = isOurTeam ? '#15803d' : '#1e293b';
  ctx.fill();
  ctx.shadowBlur = 0;

  // Inner border
  ctx.strokeStyle = isOurTeam ? '#ffffff' : '#94a3b8';
  ctx.lineWidth = size * 0.04;
  ctx.stroke();

  // Emblem icon or initials
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.floor(size * 0.38)}px "Anton", "Bebas Neue", sans-serif`;

  const initials = teamName
    .split(' ')
    .filter((w) => w.length > 0)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'CS';

  ctx.fillText(initials, size / 2, size * 0.48);

  // Small star or soccer symbol on top
  ctx.font = `${Math.floor(size * 0.18)}px sans-serif`;
  ctx.fillText('⚽', size / 2, size * 0.22);

  ctx.restore();
}

/**
 * Formats roster in columns and calculates font size safely so it never truncates.
 */
function drawRosterColumns(
  ctx: CanvasRenderingContext2D,
  players: Callup[],
  startX: number,
  startY: number,
  width: number,
  maxHeight: number
) {
  if (players.length === 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '600 20px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Convocatoria en proceso de confirmación', startX + width / 2, startY + 40);
    ctx.restore();
    return;
  }

  const count = players.length;
  const cols = count > 10 ? 2 : 1;
  const itemsPerCol = Math.ceil(count / cols);

  // Responsive item height
  const itemHeight = Math.min(48, Math.max(30, Math.floor(maxHeight / itemsPerCol)));
  const colWidth = width / cols;

  ctx.save();

  players.forEach((p, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = startX + col * colWidth + 8;
    const y = startY + row * itemHeight;

    // Dorsal Badge
    const badgeSize = Math.floor(itemHeight * 0.72);
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.roundRect(x, y + (itemHeight - badgeSize) / 2, badgeSize, badgeSize, 8);
    ctx.fill();

    ctx.fillStyle = '#052e16';
    ctx.font = `900 ${Math.floor(badgeSize * 0.6)}px "Anton", "Bebas Neue", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.jerseyNumber), x + badgeSize / 2, y + itemHeight / 2);

    // Player Full Name
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${Math.floor(itemHeight * 0.42)}px "Montserrat", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;

    const maxTextWidth = colWidth - badgeSize - 20;
    let nameToRender = p.fullName;
    if (ctx.measureText(nameToRender).width > maxTextWidth) {
      const parts = p.fullName.split(' ');
      if (parts.length > 2) {
        nameToRender = `${parts[0]} ${parts[parts.length - 1]}`;
      }
    }

    ctx.fillText(nameToRender.toUpperCase(), x + badgeSize + 10, y + itemHeight / 2);
  });

  ctx.restore();
}

/* ==========================================================================
   TEMPLATE 1: DIAGONAL SPLIT
   Bold diagonal geometric separation, massive typography, floating crest.
   ========================================================================== */
function renderTemplateDiagonalSplit(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  bgPhotoImg: HTMLImageElement | null,
  teamLogoImg: HTMLImageElement | null = null
) {
  // Background
  if (bgPhotoImg) {
    drawPhotoBackground(ctx, bgPhotoImg, width, height, team.primaryColor || '#15803d');
  } else {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#022c22');
    bg.addColorStop(0.5, '#064e3b');
    bg.addColorStop(1, '#021f18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    drawGrassPattern(ctx, width, height);
    drawStadiumFlares(ctx, width, height);
    drawPitchLines(ctx, width, height);
  }

  // Giant Diagonal Shape
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, height * 0.18);
  ctx.lineTo(width, height * 0.08);
  ctx.lineTo(width, height * 0.42);
  ctx.lineTo(0, height * 0.52);
  ctx.closePath();
  ctx.fillStyle = 'rgba(21, 128, 61, 0.35)';
  ctx.fill();

  // White Accent Blade
  ctx.beginPath();
  ctx.moveTo(0, height * 0.52);
  ctx.lineTo(width, height * 0.42);
  ctx.lineTo(width, height * 0.435);
  ctx.lineTo(0, height * 0.535);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.restore();

  // Silhouette in bottom-right corner
  drawPlayerSilhouette(ctx, width * 0.65, height * 0.58, 2.2, 'rgba(255, 255, 255, 0.06)');

  // Top Badge: MATCHDAY
  ctx.save();
  ctx.fillStyle = '#22c55e';
  const badgeW = 280;
  const badgeH = 40;
  const badgeX = (width - badgeW) / 2;
  const badgeY = 48;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fill();

  ctx.fillStyle = '#052e16';
  ctx.font = '900 20px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MATCHDAY • CONVOCATORIA', width / 2, badgeY + badgeH / 2);

  // Tournament
  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 16px "Montserrat", sans-serif';
  ctx.fillText(
    (match.tournamentName || 'TORNEO OFICIAL').toUpperCase(),
    width / 2,
    badgeY + badgeH + 24
  );

  // Big Team Title
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${width > 1000 ? 56 : 46}px "Anton", sans-serif`;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 16;
  ctx.fillText(team.name.toUpperCase(), width / 2, badgeY + badgeH + 72);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Match Clash Box
  const clashY = height * 0.25;
  const crestSize = 110;
  drawVectorCrest(ctx, width * 0.28, clashY + 30, crestSize, team.name, true, teamLogoImg);

  // VS Badge
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(width / 2, clashY + 30, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.font = '900 20px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', width / 2, clashY + 30);
  ctx.restore();

  drawVectorCrest(ctx, width * 0.72, clashY + 30, crestSize, match.rival, false);

  // Rival Name & Schedule
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, width / 2, clashY + 110);

  ctx.fillStyle = '#fef08a';
  ctx.font = '700 18px "Montserrat", sans-serif';
  ctx.fillText(
    `📅 ${formatMatchDate(match.date)} • ⏰ ${match.time || 'HORA POR DEFINIR'}`,
    width / 2,
    clashY + 145
  );

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 15px "Montserrat", sans-serif';
  ctx.fillText(`📍 ${match.location || 'CANCHA MUNICIPAL'}`, width / 2, clashY + 172);
  ctx.restore();

  // Roster Box
  const rosterY = height * 0.48;
  const rosterH = height - rosterY - 80;
  const rosterW = width * 0.88;
  const rosterX = (width - rosterW) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(5, 46, 22, 0.7)';
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rosterX, rosterY, rosterW, rosterH, 24);
  ctx.fill();
  ctx.stroke();

  // Roster Header
  ctx.fillStyle = '#4ade80';
  ctx.font = '900 20px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('PLANTEL CONFIRMADO', rosterX + 24, rosterY + 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 14px "Montserrat", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${confirmedPlayers.length} JUGADORES`, rosterX + rosterW - 24, rosterY + 32);
  ctx.restore();

  drawRosterColumns(ctx, confirmedPlayers, rosterX + 16, rosterY + 50, rosterW - 32, rosterH - 65);

  // Footer
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `#${team.name.replace(/\s+/g, '')} • ${team.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}`,
    width / 2,
    height - 24
  );
  ctx.restore();
}

/* ==========================================================================
   TEMPLATE 2: STADIUM SPOTLIGHT
   Nocturnal dark stadium atmosphere, dramatic radial light on crest, crowd texture.
   ========================================================================== */
function renderTemplateStadiumSpotlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  bgPhotoImg: HTMLImageElement | null,
  teamLogoImg: HTMLImageElement | null = null
) {
  if (bgPhotoImg) {
    drawPhotoBackground(ctx, bgPhotoImg, width, height, team.primaryColor || '#15803d');
  } else {
    // Pitch Black / Emerald radial gradient
    const bg = ctx.createRadialGradient(width / 2, height * 0.28, 20, width / 2, height * 0.28, width);
    bg.addColorStop(0, '#064e3b');
    bg.addColorStop(0.35, '#022c22');
    bg.addColorStop(0.8, '#011510');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    drawCrowdTexture(ctx, width, height);
    drawStadiumFlares(ctx, width, height);
  }

  // Giant illuminated halo
  ctx.save();
  const halo = ctx.createRadialGradient(width / 2, height * 0.24, 40, width / 2, height * 0.24, 260);
  halo.addColorStop(0, 'rgba(74, 222, 128, 0.45)');
  halo.addColorStop(0.5, 'rgba(34, 197, 94, 0.15)');
  halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.24, 260, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Header Title
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 24px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('CONVOCATORIA OFICIAL DE PARTIDO', width / 2, 54);

  ctx.fillStyle = '#22c55e';
  ctx.font = '900 52px "Anton", sans-serif';
  ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
  ctx.shadowBlur = 18;
  ctx.fillText(team.name.toUpperCase(), width / 2, 114);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Central Hero Crest
  const crestY = height * 0.25;
  drawVectorCrest(ctx, width / 2, crestY, 130, team.name, true, teamLogoImg);

  // Matchup info
  ctx.save();
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 22px "Bebas Neue", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText((match.tournamentName || 'TORNEO 2026').toUpperCase(), width / 2, crestY + 95);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 36px "Anton", sans-serif';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, width / 2, crestY + 138);

  ctx.fillStyle = '#6ee7b7';
  ctx.font = '700 17px "Montserrat", sans-serif';
  ctx.fillText(
    `📅 ${formatMatchDate(match.date)} • ⏰ ${match.time || 'HORA POR CONFIRMAR'}`,
    width / 2,
    crestY + 172
  );

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 15px "Montserrat", sans-serif';
  ctx.fillText(`📍 ${match.location || 'Cancha Principal'}`, width / 2, crestY + 198);
  ctx.restore();

  // Lower Stage Roster Card
  const rosterY = height * 0.48;
  const rosterH = height - rosterY - 70;
  const rosterW = width * 0.9;
  const rosterX = (width - rosterW) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 44, 34, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rosterX, rosterY, rosterW, rosterH, 24);
  ctx.fill();
  ctx.stroke();

  // Golden Ribbon Title
  ctx.fillStyle = '#22c55e';
  ctx.font = '900 18px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LISTA DE JUGADORES CONVOCADOS', rosterX + 24, rosterY + 34);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${confirmedPlayers.length} CONFIRMADOS`, rosterX + rosterW - 24, rosterY + 34);
  ctx.restore();

  drawRosterColumns(ctx, confirmedPlayers, rosterX + 16, rosterY + 50, rosterW - 32, rosterH - 65);

  // Footer Slogan
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${team.slogan || 'LA PERLA BONITA DE ANTIOQUIA'} • #VAMOSVERDOLAGA`,
    width / 2,
    height - 24
  );
  ctx.restore();
}

/* ==========================================================================
   TEMPLATE 3: BOLD BENTO GRID
   Asymmetric modern sports mosaic, bold high-contrast bento cards.
   ========================================================================== */
function renderTemplateBoldGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  bgPhotoImg: HTMLImageElement | null,
  teamLogoImg: HTMLImageElement | null = null
) {
  // Base background
  if (bgPhotoImg) {
    drawPhotoBackground(ctx, bgPhotoImg, width, height, team.primaryColor || '#15803d');
  } else {
    ctx.fillStyle = '#0f172a'; // Deep slate
    ctx.fillRect(0, 0, width, height);

    // Subtle green gradient accents
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, 'rgba(21, 128, 61, 0.45)');
    grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.2)');
    grad.addColorStop(1, 'rgba(5, 46, 22, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    drawPitchLines(ctx, width, height);
  }

  const pad = 36;
  const gridW = width - pad * 2;

  // Bento Block 1: Top Team Banner
  const b1H = height * 0.16;
  ctx.save();
  ctx.fillStyle = '#15803d';
  ctx.beginPath();
  ctx.roundRect(pad, pad, gridW, b1H, 20);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 48px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(team.name.toUpperCase(), pad + 24, pad + b1H / 2 - 8);

  ctx.fillStyle = '#bbf7d0';
  ctx.font = '800 16px "Montserrat", sans-serif';
  ctx.fillText('ALINEACIÓN & CONVOCATORIA OFICIAL', pad + 24, pad + b1H / 2 + 24);

  drawVectorCrest(ctx, width - pad - 60, pad + b1H / 2, 74, team.name, true, teamLogoImg);
  ctx.restore();

  // Bento Block 2: Rival Clash (Asymmetric Large Left block)
  const b2Y = pad + b1H + 16;
  const b2W = gridW * 0.58;
  const b2H = height * 0.22;

  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(pad, b2Y, b2W, b2H, 20);
  ctx.fill();

  ctx.fillStyle = '#15803d';
  ctx.font = '900 16px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('RIVAL DE LA JORNADA', pad + 20, b2Y + 28);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 36px "Anton", sans-serif';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, pad + 20, b2Y + 68);

  ctx.fillStyle = '#475569';
  ctx.font = '700 14px "Montserrat", sans-serif';
  ctx.fillText(`🏆 ${match.tournamentName || 'Torneo Oficial'}`, pad + 20, b2Y + 100);
  ctx.fillText(`📍 ${match.location || 'Cancha Municipal'}`, pad + 20, b2Y + 124);
  ctx.restore();

  // Bento Block 3: Schedule Block (Right block)
  const b3X = pad + b2W + 16;
  const b3W = gridW - b2W - 16;
  ctx.save();
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.roundRect(b3X, b2Y, b3W, b2H, 20);
  ctx.fill();

  ctx.fillStyle = '#052e16';
  ctx.font = '900 15px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FECHA & HORA', b3X + b3W / 2, b2Y + 28);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 38px "Anton", sans-serif';
  ctx.fillText(match.time || '18:00', b3X + b3W / 2, b2Y + 70);

  ctx.fillStyle = '#052e16';
  ctx.font = '800 14px "Montserrat", sans-serif';
  ctx.fillText(formatMatchDate(match.date).toUpperCase(), b3X + b3W / 2, b2Y + 110);
  ctx.restore();

  // Bento Block 4: Confirmed Roster
  const b4Y = b2Y + b2H + 16;
  const b4H = height - b4Y - pad - 24;

  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(pad, b4Y, gridW, b4H, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.font = '900 20px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('JUGADORES CONFIRMADOS', pad + 24, b4Y + 32);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 14px "Montserrat", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${confirmedPlayers.length} EN NÓMINA`, pad + gridW - 24, b4Y + 32);
  ctx.restore();

  drawRosterColumns(ctx, confirmedPlayers, pad + 16, b4Y + 48, gridW - 32, b4H - 60);

  // Footer Tagline
  ctx.save();
  ctx.fillStyle = '#64748b';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `#${team.name.replace(/\s+/g, '')} • ${team.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}`,
    width / 2,
    height - 12
  );
  ctx.restore();
}

/* ==========================================================================
   TEMPLATE 4: GEOMETRIC MESH
   Speed polygons with alpha transparency, vector player silhouette, high energy.
   ========================================================================== */
function renderTemplateGeometricMesh(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  bgPhotoImg: HTMLImageElement | null,
  teamLogoImg: HTMLImageElement | null = null
) {
  if (bgPhotoImg) {
    drawPhotoBackground(ctx, bgPhotoImg, width, height, team.primaryColor || '#15803d');
  } else {
    // Dark Emerald Gradient
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#031f14');
    bg.addColorStop(0.5, '#064e3b');
    bg.addColorStop(1, '#022c22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    drawGrassPattern(ctx, width, height);
  }

  // Dynamic Multi-layered Geometric Polygons
  ctx.save();
  // Big Polygon 1
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width * 0.75, 0);
  ctx.lineTo(width * 0.35, height * 0.45);
  ctx.lineTo(0, height * 0.35);
  ctx.closePath();
  ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
  ctx.fill();

  // Big Polygon 2
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width, height * 0.55);
  ctx.lineTo(width * 0.45, height * 0.45);
  ctx.lineTo(width * 0.65, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(21, 128, 61, 0.28)';
  ctx.fill();

  // Dynamic Neon Speed Lines
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-50, height * 0.38);
  ctx.lineTo(width + 50, height * 0.32);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-50, height * 0.395);
  ctx.lineTo(width + 50, height * 0.335);
  ctx.stroke();
  ctx.restore();

  // Vector Player Silhouette in Action
  drawPlayerSilhouette(ctx, width * 0.08, height * 0.18, 1.9, 'rgba(255, 255, 255, 0.09)');

  // Match Header
  ctx.save();
  ctx.fillStyle = '#22c55e';
  ctx.font = '900 18px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('••• MATCHDAY ALERT •••', width / 2, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 52px "Anton", sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 14;
  ctx.fillText(team.name.toUpperCase(), width / 2, 102);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#fef08a';
  ctx.font = '800 17px "Montserrat", sans-serif';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, width / 2, 138);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 14px "Montserrat", sans-serif';
  ctx.fillText(
    `📅 ${formatMatchDate(match.date)} • ⏰ ${match.time || 'HORA POR DEFINIR'} • 📍 ${match.location || 'CANCHA MUNICIPAL'}`,
    width / 2,
    166
  );
  ctx.restore();

  // Duel Crests in Circle Rings
  const ringY = height * 0.26;
  drawVectorCrest(ctx, width * 0.35, ringY, 95, team.name, true, teamLogoImg);
  drawVectorCrest(ctx, width * 0.65, ringY, 95, match.rival, false);

  // Roster Container
  const rosterY = height * 0.42;
  const rosterH = height - rosterY - 60;
  const rosterW = width * 0.9;
  const rosterX = (width - rosterW) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 44, 34, 0.82)';
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(rosterX, rosterY, rosterW, rosterH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#22c55e';
  ctx.font = '900 20px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LISTA OFICIAL DE CONVOCADOS', rosterX + 24, rosterY + 34);

  ctx.fillStyle = '#a7f3d0';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${confirmedPlayers.length} CONFIRMADOS`, rosterX + rosterW - 24, rosterY + 34);
  ctx.restore();

  drawRosterColumns(ctx, confirmedPlayers, rosterX + 16, rosterY + 50, rosterW - 32, rosterH - 65);

  // Footer Slogan
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `#${team.name.replace(/\s+/g, '')} • ${team.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}`,
    width / 2,
    height - 20
  );
  ctx.restore();
}

/* ==========================================================================
   TEMPLATE 5: CIRCULAR FOCUS
   Large orbital rings around team crest, match perimeter info, ticker roster.
   ========================================================================== */
function renderTemplateCircularFocus(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  bgPhotoImg: HTMLImageElement | null,
  teamLogoImg: HTMLImageElement | null = null
) {
  if (bgPhotoImg) {
    drawPhotoBackground(ctx, bgPhotoImg, width, height, team.primaryColor || '#15803d');
  } else {
    // Radial Background Focus
    const bg = ctx.createRadialGradient(width / 2, height * 0.28, 50, width / 2, height * 0.28, width);
    bg.addColorStop(0, '#064e3b');
    bg.addColorStop(0.5, '#022c22');
    bg.addColorStop(1, '#011c15');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    drawStadiumFlares(ctx, width, height);
  }

  const centerX = width / 2;
  const centerY = height * 0.26;

  // Concentric Orbital Rings
  ctx.save();
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 150, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.arc(centerX, centerY, 175, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Central Emblem Crest
  drawVectorCrest(ctx, centerX, centerY, 140, team.name, true, teamLogoImg);

  // Team Title
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 50px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 14;
  ctx.fillText(team.name.toUpperCase(), centerX, 68);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#4ade80';
  ctx.font = '800 16px "Montserrat", sans-serif';
  ctx.fillText('CONVOCATORIA Y ALINEACIÓN DE PARTIDO', centerX, 102);
  ctx.restore();

  // Match Information Badge Banner
  const infoY = height * 0.38;
  ctx.save();
  ctx.fillStyle = '#22c55e';
  const infoW = width * 0.85;
  const infoH = 80;
  const infoX = (width - infoW) / 2;
  ctx.beginPath();
  ctx.roundRect(infoX, infoY, infoW, infoH, 20);
  ctx.fill();

  ctx.fillStyle = '#052e16';
  ctx.font = '900 24px "Anton", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, centerX, infoY + 32);

  ctx.fillStyle = '#022c22';
  ctx.font = '700 14px "Montserrat", sans-serif';
  ctx.fillText(
    `📅 ${formatMatchDate(match.date)} • ⏰ ${match.time || '18:00'} • 📍 ${match.location || 'Cancha Municipal'}`,
    centerX,
    infoY + 58
  );
  ctx.restore();

  // Roster Box
  const rosterY = infoY + infoH + 20;
  const rosterH = height - rosterY - 60;
  const rosterW = width * 0.9;
  const rosterX = (width - rosterW) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 44, 34, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(rosterX, rosterY, rosterW, rosterH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.font = '900 18px "Anton", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CONVOCADOS CONFIRMADOS', rosterX + 24, rosterY + 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${confirmedPlayers.length} JUGADORES`, rosterX + rosterW - 24, rosterY + 32);
  ctx.restore();

  drawRosterColumns(ctx, confirmedPlayers, rosterX + 16, rosterY + 48, rosterW - 32, rosterH - 60);

  // Footer Slogan
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.font = '700 13px "Montserrat", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `#${team.name.replace(/\s+/g, '')} • ${team.slogan || 'LA PERLA BONITA DE ANTIOQUIA'}`,
    centerX,
    height - 20
  );
  ctx.restore();
}

/* ==========================================================================
   FALLBACK TEMPLATE
   Rock-solid safety net that never fails if anything else errors.
   ========================================================================== */
function renderFallbackTemplate(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[]
) {
  // Simple green gradient
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#052e16');
  bg.addColorStop(1, '#022c22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONVOCATORIA DE PARTIDO', width / 2, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(team.name.toUpperCase(), width / 2, 120);

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`VS. ${match.rival.toUpperCase()}`, width / 2, 180);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(`${formatMatchDate(match.date)} • ${match.time || '18:00'}`, width / 2, 220);

  // Roster
  const rosterY = 270;
  const rosterH = height - rosterY - 60;
  const rosterW = width - 80;
  const rosterX = 40;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.roundRect(rosterX, rosterY, rosterW, rosterH, 16);
  ctx.fill();

  drawRosterColumns(ctx, confirmedPlayers, rosterX + 16, rosterY + 30, rosterW - 32, rosterH - 40);
}

/**
 * Main render function that handles font loading, dimension calculations,
 * deterministic or user-selected template dispatching, and fallback recovery.
 */
export async function renderMatchdayToCanvas(
  canvas: HTMLCanvasElement,
  team: Team,
  match: Match,
  confirmedPlayers: Callup[],
  options?: {
    templateIndex?: number;
    format?: BillboardFormat;
    bgPhotoUrl?: string | null;
  }
): Promise<void> {
  const format: BillboardFormat = options?.format || 'feed';
  const width = 1080;
  const height = format === 'story' ? 1920 : 1080;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del Canvas');
  }

  // Ensure fonts are loaded before painting text
  await ensureFontsLoaded();

  // Load team official logo
  let teamLogoImg: HTMLImageElement | null = null;
  const rawUrl = team.logoUrl || '/team_logo.png?v=3';
  const logoUrl = rawUrl.includes('.jpg') ? '/team_logo.png?v=3' : (rawUrl.includes('?') ? rawUrl : `${rawUrl}?v=3`);
  try {
    teamLogoImg = await loadImage(logoUrl);
  } catch (err) {
    console.warn('No se pudo cargar el logo oficial para la cartelera:', err);
  }

  // Load custom background image if provided
  let bgImg: HTMLImageElement | null = null;
  if (options?.bgPhotoUrl) {
    try {
      bgImg = await loadImage(options.bgPhotoUrl);
    } catch (err) {
      console.warn('No se pudo cargar la foto de fondo, usando diseño ilustrado:', err);
    }
  }

  // Determine template index
  const tIndex =
    options?.templateIndex !== undefined
      ? options.templateIndex % BILLBOARD_TEMPLATES.length
      : getDeterministicTemplateIndex(match.id);

  try {
    switch (tIndex) {
      case 0:
        renderTemplateDiagonalSplit(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
      case 1:
        renderTemplateStadiumSpotlight(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
      case 2:
        renderTemplateBoldGrid(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
      case 3:
        renderTemplateGeometricMesh(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
      case 4:
        renderTemplateCircularFocus(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
      default:
        renderTemplateDiagonalSplit(ctx, width, height, team, match, confirmedPlayers, bgImg, teamLogoImg);
        break;
    }
  } catch (err) {
    console.error('Error renderizando plantilla de cartelera, ejecutando respaldo:', err);
    renderFallbackTemplate(ctx, width, height, team, match, confirmedPlayers);
  }
}

/**
 * Downloads current canvas as PNG file with mobile fallback support.
 */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename = 'matchday.png'): void {
  try {
    canvas.toBlob((blob) => {
      if (!blob) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 150);
        return;
      }
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
    }, 'image/png');
  } catch {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 150);
  }
}
