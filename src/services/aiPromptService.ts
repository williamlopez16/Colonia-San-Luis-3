import type { Team, Match, Callup } from '../types';
import { formatMatchDate } from './whatsappService';

/**
 * AI Prompt Generator for Soccer Matchday Posters & Graphics
 * Generates ultra-detailed, professional copy-pasteable prompts
 * optimized for Midjourney, ChatGPT / DALL-E 3, Ideogram, Flux, and Gemini.
 */

export interface AIPromptsBundle {
  fullPosterPromptEs: string;
  midjourneyPromptEn: string;
  cleanBackgroundPromptEs: string;
  squadTextFormatted: string;
}

export function generateAIPrompts(
  team: Team | null,
  match: Match,
  confirmedPlayers: Callup[]
): AIPromptsBundle {
  const teamName = team?.name || 'Colonia San Luis';
  const rivalName = match.rival || 'Rival';
  const tournament = match.tournamentName || 'Torneo Oficial';
  const dateStr = formatMatchDate(match.date);
  const timeStr = match.time ? `a las ${match.time}` : '';
  const locationStr = match.location || 'Cancha Principal';
  const primaryColor = team?.primaryColor || '#15803d';

  // Format squad with jersey numbers
  const squadList = confirmedPlayers.length > 0
    ? confirmedPlayers
        .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
        .map((p) => `#${p.jerseyNumber} ${p.fullName}`)
        .join(', ')
    : 'Nómina oficial completa con dorsales del equipo';

  const squadLines = confirmedPlayers.length > 0
    ? confirmedPlayers
        .sort((a, b) => a.jerseyNumber - b.jerseyNumber)
        .map((p) => `• #${p.jerseyNumber} ${p.fullName}`)
        .join('\n')
    : '• Nómina titular y suplentes';

  // 1. Full Matchday Poster Prompt in Spanish (ChatGPT / Ideogram / DALL-E / Gemini)
  const fullPosterPromptEs = `Póster deportivo profesional y espectacular de fútbol (Matchday Poster) para el partido oficial entre "${teamName.toUpperCase()}" vs "${rivalName.toUpperCase()}".

DATOS DEL PARTIDO:
• Torneo: ${tournament}
• Fecha y Hora: ${dateStr} ${timeStr}
• Lugar / Estadio: ${locationStr}
• Colores Oficiales: Verde Esmeralda intenso (${primaryColor}), Blanco y detalles metálicos dorados.
• Lema Oficial: "FE, ESPERANZA Y FUTURO" - "LA PERLA VERDE DE ANTIOQUIA".

ELEMENTOS VISUALES Y ESCUDO:
• Escudo heráldico de ${teamName}: Escudo en verde esmeralda y oro, con el Sol dorado radiante con rostro en la cima, montañas escarpadas de San Luis, río cristalino, iglesia colonial con cruz, rama de cafeto con cerezas rojas, hacha clavada en el tocón de madera y guirnaldas doradas de laurel.
• Escudo o distintivo del rival: "${rivalName}".
• Insignia central imponente: "MATCHDAY" o "VS" en tipografía 3D metálica esculpida.

LISTA DE CONVOCADOS CONFIRMADOS:
${squadList}

ESTILO Y ATMÓSFERA:
• Iluminación cinematográfica de estadio nocturno con reflectores encendidos en alta intensidad.
• Césped verde esmeralda impecable con marcas de cal nítidas y rocío.
• Efectos de humo verde y partículas doradas en el aire creando una atmósfera épica y electrizante.
• Composición simétrica, tipografía deportiva moderna, estilo Champions League y Conmebol Libertadores, hiperrealista, 8k, render de estudio publicitario.`;

  // 2. English Prompt optimized for Midjourney v6, Flux, and DALL-E 3
  const midjourneyPromptEn = `Epic professional soccer matchday poster graphic, clash between "${teamName}" and "${rivalName}". Cinematic night football stadium atmosphere with intense floodlights, volumetric emerald green smoke and glowing golden particles. In the center, majestic golden and emerald crest of "${teamName}" with the sun, mountain peak, river and coffee plant, facing rival crest "${rivalName}" with a bold metallic "VS". Official confirmed squad roster numbers inscribed: ${squadList}. Clean athletic typography reading "${tournament}", stadium lights, hyper-detailed green grass pitch with white chalk lines, 8k resolution, dramatic sports editorial commercial photography, highly detailed, photorealistic --ar 9:16 --v 6.1 --style raw`;

  // 3. Clean Background Prompt (without text or logos, for custom app billboard upload)
  const cleanBackgroundPromptEs = `Fotografía deportiva profesional de estadio o cancha de fútbol nocturna con reflectores gigantes encendidos y atmósfera dramática, césped verde esmeralda intenso con líneas de cal nítidas, estilo editorial deportivo para cartelera oficial de matchday del equipo "${teamName}", paleta de colores dominante verde esmeralda (${primaryColor}) con toques blancos y dorados, sin personas en primer plano ni rostros reconocibles, sin logotipos ni textos ni marcas de agua, composición con espacio negativo limpio en la parte superior e inferior para superponer tipografía, ultra alta resolución 4k, fotorrealista.`;

  return {
    fullPosterPromptEs,
    midjourneyPromptEn,
    cleanBackgroundPromptEs,
    squadTextFormatted: squadLines,
  };
}
