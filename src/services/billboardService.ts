/**
 * ============================================================================
 * MOTOR GRÁFICO PUBLICITARIO DE ÉLITE - COLONIA SAN LUIS F.C.
 * ============================================================================
 * Generador de Carteleras Oficiales y Piezas Publicitarias Deportivas HD
 * Renderizado profesional en HTML5 Canvas con calidad de agencia internacional:
 * - Haces volumétricos de luz de estadio (Stadium Floodlights)
 * - Escudos heráldicos con relieve 3D y aros dorados
 * - Tipografía deportiva de impacto estilo Champions / Conmebol
 * - Tarjetas de convocados con efecto cristal esmeralda (Glassmorphism)
 * - Soporte para Formato Post (4:5, 1080x1350) e Historia (9:16, 1080x1920)
 * - Integración total con fondos fotográficos generados por IA
 */

import type { Team, Match, Callup } from '../types';
import { formatMatchDate } from './whatsappService';

export type BillboardFormat = 'feed' | 'story';

export interface BillboardTemplateInfo {
  id: string;
  name: string;
  description: string;
  badge: string;
  ambientColor: string;
}

export const BILLBOARD_TEMPLATES: BillboardTemplateInfo[] = [
  {
    id: 'catedral_nocturna',
    name: 'Catedral Nocturna',
    description: 'Estadio bajo reflectores de 5600K con haces de luz cruzados en la bruma y césped esmeralda brillante.',
    badge: 'Champions Night',
    ambientColor: '#052e16',
  },
  {
    id: 'oro_imperial',
    name: 'Oro Imperial & Esmeralda',
    description: 'Ambiente de gran final con marco dorado metálico, negros densos y resplandor de trofeo.',
    badge: 'Gran Final',
    ambientColor: '#78350f',
  },
  {
    id: 'hora_dorada_sanluis',
    name: 'Atardecer de San Luis',
    description: 'Luz cálida rasante de las 5:30 PM sobre las montañas andinas con tonos ámbar y esmeralda.',
    badge: 'Golden Hour',
    ambientColor: '#b45309',
  },
  {
    id: 'tunel_chiaroscuro',
    name: 'Túnel de Batalla',
    description: 'Claroscuro dramático desde la boca del túnel con el terreno de juego iluminado al frente.',
    badge: 'Chiaroscuro',
    ambientColor: '#090d16',
  },
  {
    id: 'editorial_minimalista',
    name: 'Editorial Magazine',
    description: 'Diseño publicitario suizo de alta gama, tipografía contundente, elegancia pura y líneas limpias.',
    badge: 'Editorial Suizo',
    ambientColor: '#022c22',
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

async function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function safeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Renderizador de Haces de Luz Volumétricos (Stadium Light Beams)
 */
function drawStadiumLightBeams(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  templateIndex: number
) {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const isGolden = templateIndex === 2; // Golden hour
  const beamColor = isGolden ? 'rgba(251, 191, 36, ' : 'rgba(167, 243, 208, ';

  // Haz de luz izquierdo cruzado
  const grad1 = ctx.createLinearGradient(0, 0, width * 0.7, height * 0.65);
  grad1.addColorStop(0, `${beamColor}0.35)`);
  grad1.addColorStop(0.3, `${beamColor}0.15)`);
  grad1.addColorStop(0.7, `${beamColor}0.04)`);
  grad1.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width * 0.25, 0);
  ctx.lineTo(width * 0.85, height * 0.75);
  ctx.lineTo(width * 0.45, height * 0.75);
  ctx.closePath();
  ctx.fill();

  // Haz de luz derecho cruzado
  const grad2 = ctx.createLinearGradient(width, 0, width * 0.3, height * 0.65);
  grad2.addColorStop(0, `${beamColor}0.35)`);
  grad2.addColorStop(0.3, `${beamColor}0.15)`);
  grad2.addColorStop(0.7, `${beamColor}0.04)`);
  grad2.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(width * 0.75, 0);
  ctx.lineTo(width * 0.15, height * 0.75);
  ctx.lineTo(width * 0.55, height * 0.75);
  ctx.closePath();
  ctx.fill();

  // Foco radial superior de estadio
  const glow = ctx.createRadialGradient(width / 2, 0, 50, width / 2, 0, width * 0.85);
  glow.addColorStop(0, isGolden ? 'rgba(251, 191, 36, 0.4)' : 'rgba(52, 211, 153, 0.3)');
  glow.addColorStop(0.4, isGolden ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.12)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height * 0.6);

  ctx.restore();
}

/**
 * Textura de Césped Esmeralda de Estadio con Perspectiva
 */
function drawCinematicPitch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  startY: number
) {
  ctx.save();
  const pitchH = height - startY;

  // Gradiente de césped en perspectiva
  const grassGrad = ctx.createLinearGradient(0, startY, 0, height);
  grassGrad.addColorStop(0, '#064e3b');
  grassGrad.addColorStop(0.35, '#047857');
  grassGrad.addColorStop(0.7, '#065f46');
  grassGrad.addColorStop(1, '#022c22');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, startY, width, pitchH);

  // Franjas de corte de césped horizontal
  const stripes = 12;
  const stripeH = pitchH / stripes;
  for (let i = 0; i < stripes; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(0, startY + i * stripeH, width, stripeH);
    }
  }

  // Línea de mediocampo brillante en perspectiva
  const midY = startY + pitchH * 0.4;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(width, midY);
  ctx.stroke();

  // Círculo central en perspectiva elíptica
  ctx.beginPath();
  ctx.ellipse(width / 2, midY, width * 0.28, pitchH * 0.14, 0, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Punto central
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(width / 2, midY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Renderizado de Escudo con Medallón 3D Metálico
 */
async function drawHeraldicCrest(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  logoUrl: string | undefined,
  fallbackName: string,
  isOurTeam = true
) {
  ctx.save();
  const radius = size / 2;

  // Sombra exterior 3D
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;

  // Medallón base metálico
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  const ringGrad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
  if (isOurTeam) {
    ringGrad.addColorStop(0, '#fef08a');
    ringGrad.addColorStop(0.35, '#f59e0b');
    ringGrad.addColorStop(0.7, '#d97706');
    ringGrad.addColorStop(1, '#78350f');
  } else {
    ringGrad.addColorStop(0, '#ffffff');
    ringGrad.addColorStop(0.5, '#cbd5e1');
    ringGrad.addColorStop(1, '#475569');
  }
  ctx.fillStyle = ringGrad;
  ctx.fill();

  // Reset shadow for internal rim
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Aro interior oscuro
  ctx.beginPath();
  ctx.arc(x, y, radius - 5, 0, Math.PI * 2);
  ctx.fillStyle = isOurTeam ? '#042817' : '#0f172a';
  ctx.fill();

  // Imagen del escudo
  let img: HTMLImageElement | null = null;
  if (logoUrl && !logoUrl.endsWith('.jpg')) {
    img = await loadImageSafe(logoUrl);
  }
  if (!img && isOurTeam) {
    img = await loadImageSafe('/team_logo.png');
  }

  const innerSize = (size - 16);
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, radius - 8, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - innerSize / 2, y - innerSize / 2, innerSize, innerSize);
    ctx.restore();
  } else {
    // Escudo vectorial estilizado de alta gama si no hay imagen
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${Math.round(size * 0.3)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = fallbackName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    ctx.fillText(initials || 'CSL', x, y);
  }

  // Brillo especular superior de cristal
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y - radius * 0.45, radius * 0.7, radius * 0.35, 0, 0, Math.PI * 2);
  const glassGrad = ctx.createLinearGradient(x, y - radius * 0.8, x, y);
  glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = glassGrad;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

/**
 * RENDERIZADOR MAESTRO DE PUBLICIDAD DEPORTIVA HD
 */
export async function renderPublicidadToCanvas(
  canvas: HTMLCanvasElement,
  team: Team | null,
  match: Match,
  confirmedPlayers: Callup[],
  options?: {
    templateIndex?: number;
    format?: BillboardFormat;
    bgPhotoUrl?: string | null;
  }
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const format = options?.format || 'feed';
  const width = 1080;
  const height = format === 'story' ? 1920 : 1350;

  canvas.width = width;
  canvas.height = height;

  const templateIndex = (options?.templateIndex ?? getDeterministicTemplateIndex(match.id)) % BILLBOARD_TEMPLATES.length;
  const template = BILLBOARD_TEMPLATES[templateIndex];

  // 1. FONDO PRINCIPAL
  if (options?.bgPhotoUrl) {
    const customImg = await loadImageSafe(options.bgPhotoUrl);
    if (customImg) {
      // Ajuste Cover de la imagen fotográfica generada por IA
      const imgRatio = customImg.width / customImg.height;
      const canvasRatio = width / height;
      let rw = width;
      let rh = height;
      let ox = 0;
      let oy = 0;
      if (imgRatio > canvasRatio) {
        rh = height;
        rw = height * imgRatio;
        ox = (width - rw) / 2;
      } else {
        rw = width;
        rh = width / imgRatio;
        oy = (height - rh) / 2;
      }
      ctx.drawImage(customImg, ox, oy, rw, rh);

      // Overlay cinemático de contraste para legibilidad de textos
      const darkOverlay = ctx.createLinearGradient(0, 0, 0, height);
      darkOverlay.addColorStop(0, 'rgba(2, 18, 9, 0.85)');
      darkOverlay.addColorStop(0.35, 'rgba(5, 30, 16, 0.65)');
      darkOverlay.addColorStop(0.7, 'rgba(2, 12, 6, 0.85)');
      darkOverlay.addColorStop(1, 'rgba(1, 8, 4, 0.96)');
      ctx.fillStyle = darkOverlay;
      ctx.fillRect(0, 0, width, height);
    } else {
      drawBaseStadium(ctx, width, height, templateIndex);
    }
  } else {
    drawBaseStadium(ctx, width, height, templateIndex);
  }

  function drawBaseStadium(ctx: CanvasRenderingContext2D, w: number, h: number, tIndex: number) {
    // Fondo degradado profundo
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    if (tIndex === 1) {
      // Oro Imperial
      bgGrad.addColorStop(0, '#0c0a09');
      bgGrad.addColorStop(0.4, '#1c1917');
      bgGrad.addColorStop(0.8, '#062817');
      bgGrad.addColorStop(1, '#02130b');
    } else if (tIndex === 2) {
      // Atardecer dorado
      bgGrad.addColorStop(0, '#1c1917');
      bgGrad.addColorStop(0.3, '#78350f');
      bgGrad.addColorStop(0.65, '#064e3b');
      bgGrad.addColorStop(1, '#022c22');
    } else {
      // Catedral Nocturna Esmeralda
      bgGrad.addColorStop(0, '#021a0e');
      bgGrad.addColorStop(0.35, '#063f23');
      bgGrad.addColorStop(0.75, '#042716');
      bgGrad.addColorStop(1, '#010f08');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Haces de reflectores de estadio
    drawStadiumLightBeams(ctx, w, h, tIndex);

    // Césped cinemático inferior
    const pitchStartY = format === 'story' ? h * 0.48 : h * 0.44;
    drawCinematicPitch(ctx, w, h, pitchStartY);
  }

  // 2. ENCABEZADO INSTITUCIONAL SUPERIOR
  const topPad = 45;
  const teamName = (team?.name || 'COLONIA SAN LUIS F.C.').toUpperCase();
  const tournamentName = (match.tournamentName || 'TORNEO OFICIAL').toUpperCase();
  const slogan = (team?.slogan || 'LA PERLA VERDE DE ANTIOQUIA').toUpperCase();

  // Badge del Torneo (Pill flotante de lujo)
  ctx.save();
  ctx.font = '900 18px system-ui, -apple-system, sans-serif';
  const tourneyText = `🏆 ${tournamentName}`;
  const tourneyW = ctx.measureText(tourneyText).width + 36;
  const tourneyH = 42;
  const tourneyX = (width - tourneyW) / 2;
  const tourneyY = topPad + 10;

  ctx.fillStyle = 'rgba(2, 24, 12, 0.88)';
  safeRoundRect(ctx, tourneyX, tourneyY, tourneyW, tourneyH, 21);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tourneyText, width / 2, tourneyY + tourneyH / 2);
  ctx.restore();

  // Título Monumental "MATCHDAY" en Tipografía Deportiva Metálica 3D
  const matchdayY = tourneyY + 85;
  ctx.save();
  ctx.font = '900 88px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '8px';

  // Sombra profunda 3D
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 10;
  ctx.strokeStyle = '#021a0d';
  ctx.lineWidth = 10;
  ctx.strokeText('MATCHDAY', width / 2, matchdayY);

  // Gradiente metálico interior
  const textGrad = ctx.createLinearGradient(0, matchdayY - 45, 0, matchdayY + 45);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.45, '#fef08a');
  textGrad.addColorStop(0.8, '#f59e0b');
  textGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = textGrad;
  ctx.fillText('MATCHDAY', width / 2, matchdayY);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // Lema oficial bajo MATCHDAY
  ctx.save();
  ctx.font = '800 15px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#6ee7b7';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.fillText(slogan, width / 2, matchdayY + 54);
  ctx.letterSpacing = '0px';
  ctx.restore();

  // 3. DUELO DE ESCUDOS & CHOQUE DE TITANES (THE CLASH)
  const clashCenterY = format === 'story' ? matchdayY + 230 : matchdayY + 195;
  const crestSize = format === 'story' ? 180 : 160;
  const crestOffset = width * 0.28;

  const leftCrestX = width / 2 - crestOffset;
  const rightCrestX = width / 2 + crestOffset;

  // Escudo Local (Colonia San Luis F.C.)
  await drawHeraldicCrest(ctx, leftCrestX, clashCenterY, crestSize, team?.logoUrl, teamName, true);

  // Escudo Rival
  await drawHeraldicCrest(ctx, rightCrestX, clashCenterY, crestSize, match.rivalLogo, match.rival || 'Rival', false);

  // Insignia Central Metálica "VS"
  ctx.save();
  const vsRadius = 38;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;

  // Aro exterior dorado
  ctx.beginPath();
  ctx.arc(width / 2, clashCenterY, vsRadius, 0, Math.PI * 2);
  const vsGrad = ctx.createLinearGradient(width / 2 - vsRadius, clashCenterY - vsRadius, width / 2 + vsRadius, clashCenterY + vsRadius);
  vsGrad.addColorStop(0, '#fde68a');
  vsGrad.addColorStop(0.5, '#f59e0b');
  vsGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = vsGrad;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(width / 2, clashCenterY, vsRadius - 4, 0, Math.PI * 2);
  ctx.fillStyle = '#0f172a';
  ctx.fill();

  // Texto VS
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', width / 2, clashCenterY);
  ctx.restore();

  // Nombres de los equipos bajo cada escudo
  ctx.save();
  ctx.font = '900 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Nombre Local
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.fillText(teamName, leftCrestX, clashCenterY + crestSize / 2 + 16, width * 0.4);

  // Nombre Rival
  ctx.fillStyle = '#fef08a';
  ctx.fillText((match.rival || 'RIVAL').toUpperCase(), rightCrestX, clashCenterY + crestSize / 2 + 16, width * 0.4);
  ctx.restore();

  // 4. BANNER BROADCAST CON FECHA, HORA Y ESCENARIO
  const infoBarY = clashCenterY + crestSize / 2 + 65;
  const infoBarW = width - 120;
  const infoBarH = 68;
  const infoBarX = 60;

  ctx.save();
  ctx.fillStyle = 'rgba(2, 20, 10, 0.92)';
  safeRoundRect(ctx, infoBarX, infoBarY, infoBarW, infoBarH, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Detalles del partido
  const dateStr = formatMatchDate(match.date).toUpperCase();
  const timeStr = match.time ? `${match.time} HRS` : 'HORA POR DEFINIR';
  const venueStr = (match.location || 'CANCHA PRINCIPAL').toUpperCase();

  ctx.font = '800 19px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`📅 ${dateStr}  •  ⏰ ${timeStr}  •  📍 ${venueStr}`, width / 2, infoBarY + infoBarH / 2, infoBarW - 40);
  ctx.restore();

  // 5. TARJETA CRISTAL DE CONVOCADOS CONFIRMADOS (GLASSMORPHISM ROSTER)
  const rosterY = infoBarY + infoBarH + 26;
  const rosterH = height - rosterY - 45;
  const rosterW = width - 120;
  const rosterX = 60;

  ctx.save();
  // Fondo Dark Glass
  ctx.fillStyle = 'rgba(2, 18, 9, 0.88)';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetY = 10;
  safeRoundRect(ctx, rosterX, rosterY, rosterW, rosterH, 24);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cabecera del Roster
  ctx.font = '900 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('NÓMINA OFICIAL DE CONVOCADOS', rosterX + 30, rosterY + 22);

  // Badge contador de convocados
  const countBadgeText = `${confirmedPlayers.length} CONFIRMADOS`;
  ctx.font = '900 13px system-ui, -apple-system, sans-serif';
  const badgeW = ctx.measureText(countBadgeText).width + 24;
  const badgeX = rosterX + rosterW - badgeW - 30;
  ctx.fillStyle = '#065f46';
  safeRoundRect(ctx, badgeX, rosterY + 20, badgeW, 30, 15);
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(countBadgeText, badgeX + badgeW / 2, rosterY + 35);

  // Lista de Jugadores Adaptativa (Muestra la nómina completa sin truncar)
  const sortedPlayers = [...confirmedPlayers].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  const startListY = rosterY + 68;
  const availableRosterH = rosterH - 85;

  // Si no hay convocados
  if (sortedPlayers.length === 0) {
    ctx.font = '600 18px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Nómina oficial en proceso de confirmación del plantel', width / 2, startListY + availableRosterH / 2);
  } else {
    const total = sortedPlayers.length;
    // Si hay más de 18 jugadores en feed o más de 22 en story, usamos 3 columnas para que quepan todos con nitidez
    const numCols = (total > 18 && format === 'feed') || total > 22 ? 3 : 2;
    const numRows = Math.ceil(total / numCols);
    const colSpacing = 16;
    const colWidth = (rosterW - 50 - (numCols - 1) * colSpacing) / numCols;
    const maxRowHeight = numCols === 3 ? 40 : 46;
    const rowHeight = Math.min(maxRowHeight, Math.max(30, availableRosterH / numRows));

    sortedPlayers.forEach((p, idx) => {
      const col = idx % numCols;
      const row = Math.floor(idx / numCols);
      const px = rosterX + 25 + col * (colWidth + colSpacing);
      const py = startListY + row * rowHeight;
      const chipH = rowHeight - 5;
      const chipW = colWidth;

      // Chip contenedor de jugador con efecto glassmorphism verde esmeralda
      ctx.fillStyle = 'rgba(6, 95, 70, 0.22)';
      safeRoundRect(ctx, px, py, chipW, chipH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Dorsal circular con color verde esmeralda y borde dorado
      const dorsalR = Math.min(16, (chipH - 8) / 2);
      const dorsalCX = px + dorsalR + 10;
      const dorsalCY = py + chipH / 2;

      ctx.beginPath();
      ctx.arc(dorsalCX, dorsalCY, dorsalR, 0, Math.PI * 2);
      ctx.fillStyle = '#065f46';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.max(11, Math.round(dorsalR * 1.05))}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${p.jerseyNumber}`, dorsalCX, dorsalCY);

      // Nombre del Jugador
      const fontSize = numCols === 3 ? Math.min(13, Math.max(11, chipH * 0.44)) : Math.min(16, Math.max(13, chipH * 0.42));
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(fontSize)}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const nameX = dorsalCX + dorsalR + 10;
      const maxNameW = chipW - (nameX - px) - 8;

      // Truncar nombre elegantemente si excede el ancho disponible
      let nameToDraw = p.fullName;
      if (ctx.measureText(nameToDraw).width > maxNameW) {
        const parts = p.fullName.split(' ');
        nameToDraw = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0];
        if (ctx.measureText(nameToDraw).width > maxNameW && parts.length >= 2) {
          nameToDraw = `${parts[0]} ${parts[1].charAt(0)}.`;
        }
      }
      ctx.fillText(nameToDraw, nameX, dorsalCY, maxNameW);
    });
  }

  ctx.restore();
}

/**
 * Alias de compatibilidad total para llamadas existentes
 */
export async function renderMatchdayToCanvas(
  canvas: HTMLCanvasElement,
  team: Team | null,
  match: Match,
  confirmedPlayers: Callup[],
  options?: {
    templateIndex?: number;
    format?: BillboardFormat;
    bgPhotoUrl?: string | null;
  }
): Promise<void> {
  return renderPublicidadToCanvas(canvas, team, match, confirmedPlayers, options);
}

export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}

