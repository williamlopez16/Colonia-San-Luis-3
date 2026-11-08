import type { Team, Match, Callup } from '../types';
import { formatMatchDate } from './whatsappService';

/**
 * ============================================================================
 * DIRECTOR CREATIVO DE PUBLICIDAD DEPORTIVA AUTÓNOMO - COLONIA SAN LUIS F.C.
 * ============================================================================
 * Motor inteligente de dirección artística, fotografía deportiva profesional
 * e ingeniería de prompts de alto impacto publicitario internacional.
 *
 * Desarrollado con los estándares de dirección de arte de Nike Football, Adidas,
 * Time Sports, L'Équipe Magazine, Getty Images Sports y Leica Photography.
 */

export type CreativeDesignMode =
  | 'MATCHDAY'
  | 'CONVOCATORIA'
  | 'PREMATCH'
  | 'JUGADOR_DESTACADO'
  | 'RESULTADO_FINAL'
  | 'CELEBRACION'
  | 'JORNADA_DEPORTIVA';

export interface DesignModeConfig {
  id: CreativeDesignMode;
  name: string;
  badge: string;
  description: string;
  iconName: string;
  focus: string;
}

export const DESIGN_MODES: DesignModeConfig[] = [
  {
    id: 'MATCHDAY',
    name: 'Anuncio de Partido (Matchday)',
    badge: 'Matchday Oficial',
    description: 'Anuncio oficial del choque de titanes, fecha, hora, escenario y duelo de escudos.',
    iconName: 'Flame',
    focus: 'Expectativa, choque de rivales y gloria del encuentro.',
  },
  {
    id: 'CONVOCATORIA',
    name: 'Lista de Convocados',
    badge: 'Nómina Confirmada',
    description: 'Presentación oficial de los futbolistas convocados con dorsales y orden táctico.',
    iconName: 'Users',
    focus: 'Estructura de la nómina, legibilidad de dorsales y nombres oficiales.',
  },
  {
    id: 'PREMATCH',
    name: 'Prematch & Expectativa',
    badge: 'Tensión Previa',
    description: 'Concentración en vestuario, mirada de líderes, botines atados y caminata hacia el túnel.',
    iconName: 'Clock',
    focus: 'Introspección, tensión competitiva y silencio antes del pitazo.',
  },
  {
    id: 'JUGADOR_DESTACADO',
    name: 'Jugador Destacado (Spotlight)',
    badge: 'Figura del Encuentro',
    description: 'Retrato cinematográfico del capitán, goleador o guardameta que liderará la batalla.',
    iconName: 'Award',
    focus: 'Retrato de carácter, liderazgo, mirada penetrante y textura de camiseta.',
  },
  {
    id: 'RESULTADO_FINAL',
    name: 'Resultado Final (Full-Time)',
    badge: 'Marcador Oficial',
    description: 'Pieza de cierre con el marcador final, balance del partido y gratitud competitiva.',
    iconName: 'Trophy',
    focus: 'Marcador oficial, balance del partido y respeto deportivo.',
  },
  {
    id: 'CELEBRACION',
    name: 'Celebración & Pasión',
    badge: 'Victoria & Euforia',
    description: 'Abrazo de gol, brazos al cielo, unión de equipo y el corazón de San Luis Antioquia.',
    iconName: 'Sparkles',
    focus: 'Emoción pura, grito de gol, festejo colectivo y hermandad.',
  },
  {
    id: 'JORNADA_DEPORTIVA',
    name: 'Jornada del Torneo',
    badge: 'Fecha de Torneo',
    description: 'Promoción de la fecha completa del campeonato con ambiente de estadio y jerarquía.',
    iconName: 'Calendar',
    focus: 'Contexto de tabla de posiciones, fixture y jerarquía del torneo.',
  },
];

export interface CreativeConcept {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  artDirection: string;
  camera: string;
  lens: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  lighting: string;
  colorGrading: string;
  composition: string;
  atmosphere: string;
  negativeSpace: string;
  narrative: string;
  idealModes: CreativeDesignMode[];
  badgeColor: string;
}

/**
 * BIBLIOTECA MAESTRA DE 15 CONCEPTOS CREATIVOS AUTÓNOMOS
 * Cada uno con especificaciones fotográficas reales, física óptica,
 * paleta cromática y dirección de arte única.
 */
export const CREATIVE_CONCEPTS_LIBRARY: CreativeConcept[] = [
  {
    id: 'cinematic_campaign',
    number: 1,
    title: 'Cinematic Football Campaign',
    subtitle: 'Épica de gran escala y cinematografía de estadio',
    tagline: 'La catedral del fútbol bajo el cielo nocturno',
    description: 'Campaña publicitaria internacional de escala monumental. Ambiente cinematográfico nocturno con haces volumétricos de luz atravesando la niebla del estadio.',
    artDirection: 'Cine publicitario de gran presupuesto estilo Champions League y Copa Libertadores. Atmósfera tensa, solemne y electrizante.',
    camera: 'ARRI Alexa LF con sensor Large Format 4.5K',
    lens: 'ARRI Signature Prime 35mm T1.8',
    aperture: 'f/2.0 para separación heroica del fondo',
    shutterSpeed: '1/1000s con obturador cinemático de 180°',
    iso: 'ISO 400 (imagen limpia con textura orgánica, cero ruido digital)',
    lighting: 'Cuatro torres de reflectores de estadio a 5600K con contra-luz volumétrico que dibuja siluetas doradas en la bruma.',
    colorGrading: 'Curva logarítmica ARRI con negros densos, sombras verde esmeralda profundo (#064e3b) y destellos dorados metálicos (#facc15).',
    composition: 'Ángulo heroico contrapicado bajo (worm’s-eye view). Líneas de fuga que convergen en el centro con tercio superior despejado para tipografía.',
    atmosphere: 'Niebla tenue de estadio, rocío suspendido en el aire, césped recién cortado y tensión eléctrica antes del combate.',
    negativeSpace: 'Tercio superior y tercio inferior libres de elementos densos para inserción editorial de títulos y escudos.',
    narrative: 'El momento en que los gigantes pisan el campo y el destino del partido comienza a escribirse.',
    idealModes: ['MATCHDAY', 'PREMATCH', 'JORNADA_DEPORTIVA'],
    badgeColor: 'from-emerald-700 to-indigo-900',
  },
  {
    id: 'premium_editorial',
    number: 2,
    title: 'Premium Sports Editorial',
    subtitle: 'Elegancia de portada de revista deportiva internacional',
    tagline: 'La sofisticación estética del fútbol de élite',
    description: 'Fotografía de portada de revista de alta gama tipo L’Équipe Magazine, Time Sports o GQ Sports. Iluminación controlada, texturas ultra-nítidas y refinamiento sin excesos.',
    artDirection: 'Diseño editorial sobrio, moderno y elegante. Minimalismo de lujo donde cada detalle textil y anatómico habla de grandeza.',
    camera: 'Hasselblad H6D-100c Medium Format (100 Megapíxeles)',
    lens: 'Hasselblad HC 100mm f/2.2 con obturador central',
    aperture: 'f/2.8 para micro-contraste soberbio y desenfoque suave',
    shutterSpeed: '1/1600s para nitidez cristalina',
    iso: 'ISO 100 con rango dinámico de 15 pasos',
    lighting: 'Softbox octogonal gigante cenital de 150cm con luz suave envolvente complementada por luz de recorte lateral verde esmeralda suave.',
    colorGrading: 'Paleta editorial escandinava/suiza, pieles con tonalidad cálida natural, camiseta verde esmeralda profunda y blanco nieve inmaculado.',
    composition: 'Simetría perfecta o regla de tercios equilibrada con elegante espacio de respiro tipográfico (Negative Space) para cabecera.',
    atmosphere: 'Calma previa a la tempestad, pulcritud, dignidad atlética y concentración absoluta.',
    negativeSpace: 'Banda superior generosa tipo cabecera editorial y laterales limpios para créditos y datos del partido.',
    narrative: 'El fútbol elevado al arte: la preparación del atleta de élite que representa a su pueblo.',
    idealModes: ['JUGADOR_DESTACADO', 'MATCHDAY', 'CONVOCATORIA'],
    badgeColor: 'from-slate-800 to-emerald-950',
  },
  {
    id: 'nike_style',
    number: 3,
    title: 'Nike-Style Football Advertising',
    subtitle: 'Dinamismo crudo, sudor y determinación visceral',
    tagline: 'Arriésgalo todo por el honor de la camiseta',
    description: 'Estética audaz de las legendarias campañas globales de Nike Football ("Write the Future", "Risk Everything"). Energía imparable, sudor congelado en el aire y actitud desafiante.',
    artDirection: 'Publicidad de impacto visceral, velocidad agresiva, alto contraste y actitud competitiva intransigente.',
    camera: 'Sony A1 de alta velocidad con obturador electrónico global',
    lens: 'Sony FE 24-70mm f/2.8 GM II ajustado a 28mm gran angular',
    aperture: 'f/2.8 con enfoque continuo al ojo del atleta',
    shutterSpeed: '1/2500s congelando microgotas de sudor y briznas de hierba en suspensión',
    iso: 'ISO 320 calibrado',
    lighting: 'Luz lateral dura y rasante de reflectores potentes con luz de contra (rim light) muy marcada para acentuar musculatura y pliegues de tela.',
    colorGrading: 'Alto contraste dramático, negros intensos pero con detalle en sombras, verde esmeralda enérgico (#15803d) y blancos brillantes con acento dorado.',
    composition: 'Diagonal dinámica de fuerza visual que atraviesa el cuadro de izquierda a derecha transmitiendo velocidad de ataque.',
    atmosphere: 'Calor de la batalla, sudor brillante en frente y mejillas, respiración acelerada y tensión muscular extrema.',
    negativeSpace: 'Esquina superior izquierda y zona inferior para tipografía deportiva agresiva en caja alta.',
    narrative: 'No hay excusas ni segundas oportunidades. Solo 90 minutos para conquistar la gloria.',
    idealModes: ['MATCHDAY', 'JUGADOR_DESTACADO', 'PREMATCH'],
    badgeColor: 'from-amber-600 to-emerald-900',
  },
  {
    id: 'adidas_inspired',
    number: 4,
    title: 'Adidas-Inspired Sports Campaign',
    subtitle: 'Herencia clásica, pureza deportiva y grandeza atemporal',
    tagline: 'Nada es imposible cuando juegas con el corazón',
    description: 'Campaña con el espíritu clásico y legendario de Adidas Football. Respeto sagrado por la pelota de cuero cosido, las rayas del club, la historia y la hermandad del equipo.',
    artDirection: 'Estilo clásico renovado, orgullo de tradición, estética de grano analógico fino y balance formal perfecto.',
    camera: 'Leica SL2-S con sensor de grano cinematográfico',
    lens: 'Leica APO-Summicron-SL 50mm f/2 ASPH',
    aperture: 'f/2.0 con nitidez milimétrica de borde a borde',
    shutterSpeed: '1/1250s',
    iso: 'ISO 200 analógico',
    lighting: 'Luz natural de día nublado con reflectores blancos de rebote para sombras sedosas y transiciones tonales fluidas.',
    colorGrading: 'Emulación de película cinematográfica Kodak Vision3 250D, tonos verdes orgánicos de césped natural, blanco puro y ribetes dorados mate.',
    composition: 'Encuadre centrado clásico con el escudo del club en el corazón visual de la imagen.',
    atmosphere: 'Aire fresco de montaña, aroma a tierra húmeda y el sonido inconfundible de los tacos de aluminio sobre la grama.',
    negativeSpace: 'Franja inferior limpia con proporción áurea para la información de fecha y lugar.',
    narrative: 'La historia no se compra: se construye partido a partido con coraje y lealtad.',
    idealModes: ['MATCHDAY', 'CELEBRACION', 'CONVOCATORIA'],
    badgeColor: 'from-emerald-800 to-sky-950',
  },
  {
    id: 'documentary_magnum',
    number: 5,
    title: 'Documentary Football Photography',
    subtitle: 'Realismo fotoperiodístico sin filtros ni artificios',
    tagline: 'La verdad honesta del fútbol real',
    description: 'Fotoperiodismo deportivo al estilo de la Agencia Magnum y National Geographic. Verdad cruda, piel real con poros, cicatrices de batalla y emoción sin poses fingidas.',
    artDirection: 'Realismo documental estricto. Cero efectos especiales, cero destellos artificiales, 100% humanidad y pasión deportiva.',
    camera: 'Canon EOS R5 con sensor full-frame de alta resolución',
    lens: 'Canon RF 85mm f/1.2L USM DS (Defocus Smoothing)',
    aperture: 'f/1.8 para un aislamiento suave y natural del sujeto',
    shutterSpeed: '1/2000s capturando la mirada auténtica en el momento decisivo',
    iso: 'ISO 160 luz disponible',
    lighting: '100% luz real de la cancha: tarde nublada antioqueña o reflectores directos del escenario sin flashes de estudio.',
    colorGrading: 'Colorimétrica natural calibrada con precisión documental, sin saturaciones chillonas; verde hierba real, pieles auténticas y tierra.',
    composition: 'Momento decisivo capturado con honestidad geométrica, profundidad de campo gradual y natural.',
    atmosphere: 'Barro sutil en las pantorrillas, sudor genuino, hierba aplastada y la mirada de quien lo deja todo por su gente.',
    negativeSpace: 'Cielo nublado o gradas fuera de foco en tercio superior para emplazamiento tipográfico limpio.',
    narrative: 'El fútbol de verdad, sin maquillaje ni adornos: hombres de carne y hueso jugando por su honor.',
    idealModes: ['PREMATCH', 'JUGADOR_DESTACADO', 'RESULTADO_FINAL'],
    badgeColor: 'from-stone-800 to-emerald-950',
  },
  {
    id: 'stadium_night',
    number: 6,
    title: 'Stadium Night Photography',
    subtitle: 'La magia nocturna de las 8:00 PM bajo las luces',
    tagline: 'Cuando se encienden los reflectores, el mundo se detiene',
    description: 'La mística del partido nocturno. Césped iluminado por cuatro torres de luz que contrastan con la noche profunda, creando una atmósfera de fiesta y batalla decisiva.',
    artDirection: 'Noche de fútbol grande, misterio en las sombras periféricas e iluminación brillante sobre el rectángulo verde.',
    camera: 'Nikon Z9 Full-Frame con procesador EXPEED 7',
    lens: 'NIKKOR Z 70-200mm f/2.8 VR S a 135mm',
    aperture: 'f/2.8 para compresión óptica de fondo',
    shutterSpeed: '1/1600s',
    iso: 'ISO 800 balanceado para noche profunda',
    lighting: 'Conos de luz blanca de 5500K proyectados desde las cuatro esquinas, generando reflejos especulares en el balón y el césped húmedo.',
    colorGrading: 'Noche azul marino profundo (#020617) de fondo, contrastada con el verde esmeralda luminoso del campo y blanco de las líneas de cal.',
    composition: 'Plano general medio desde la banda lateral con perspectiva de profundidad hacia el círculo central o el arco rival.',
    atmosphere: 'Bocanadas de vapor en el aire fresco de la noche, césped húmedo brillante y la sensación de gran cita futbolística.',
    negativeSpace: 'El cielo oscuro superior ofrece el lienzo perfecto de alto contraste para textos y escudos en blanco y oro.',
    narrative: 'Noche de fútbol: el escenario perfecto donde nacen las leyendas de San Luis.',
    idealModes: ['MATCHDAY', 'CONVOCATORIA', 'JORNADA_DEPORTIVA'],
    badgeColor: 'from-blue-950 to-emerald-900',
  },
  {
    id: 'golden_hour',
    number: 7,
    title: 'Golden Hour Football Campaign',
    subtitle: 'Luz dorada de las 5:30 PM en las montañas de Antioquia',
    tagline: 'La hora dorada de los héroes locales',
    description: 'El atardecer mágico cuando el sol cae sobre las cordilleras del Oriente Antioqueño, bañando la cancha de fútbol en oro líquido, sombras alargadas y calidez emotiva.',
    artDirection: 'Calidez nostálgica, épica natural, romanticismo futbolístico y belleza paisajística integrada al deporte.',
    camera: 'Sony A7R V con sensor Exmor R de 61 MP',
    lens: 'Sony FE 85mm f/1.4 GM a f/1.8',
    aperture: 'f/1.8 con contraluz controlado de sol rasante',
    shutterSpeed: '1/2000s contra el sol de poniente',
    iso: 'ISO 100 base',
    lighting: 'Sol rasante a 15 grados sobre el horizonte con luz cálida de 3200K dorada, dibujando un contorno de luz en los hombros y cabello de los jugadores.',
    colorGrading: 'Gradación cromática dorada y ámbar (#f59e0b) que funde suavemente con el verde esmeralda del césped y el azul cálido del cielo.',
    composition: 'Contraluz majestuoso con siluetas definidas y textura visible en sombras; sol filtrándose entre las montañas al fondo.',
    atmosphere: 'Polvo dorado flotando en el aire de la tarde, sombras largas sobre la grama y la calma dorada del atardecer.',
    negativeSpace: 'Cielo crepuscular amplio con tonos degradados de oro a azul profundo para montaje de datos oficiales.',
    narrative: 'El sol de San Luis bendice la cancha antes de la contienda: fe, esperanza y futuro.',
    idealModes: ['MATCHDAY', 'CELEBRACION', 'PREMATCH'],
    badgeColor: 'from-amber-700 to-emerald-900',
  },
  {
    id: 'tunnel_walkout',
    number: 8,
    title: 'Tunnel Walkout Campaign',
    subtitle: 'La salida por el túnel hacia la arena de batalla',
    tagline: 'Un paso hacia la eternidad',
    description: 'La vista desde el interior del túnel de acceso mirando hacia la salida brillante del campo de juego. El contraste entre la penumbra del túnel y el resplandor verde del estadio.',
    artDirection: 'Claroscuro cinematográfico dramático, tensión psicológica, paso firme de los capitanes marchando al frente.',
    camera: 'RED V-Raptor 8K VV con sensor de cine',
    lens: 'Zeiss Supreme Prime 29mm T1.5',
    aperture: 'f/2.0 para balance de profundidad entre el túnel y el campo',
    shutterSpeed: '1/1000s',
    iso: 'ISO 500',
    lighting: 'Interior del túnel en penumbra con luz artificial fría superior de guía; el extremo del túnel estalla en luz verde esmeralda y blanca brillante.',
    colorGrading: 'Siluetas de atletas en negro carbón profundo con halos de luz esmeralda y el estallido luminoso del campo al fondo.',
    composition: 'Perspectiva central de un punto de fuga con las paredes del túnel guiando la mirada directamente hacia el césped exterior.',
    atmosphere: 'El eco rítmico de los tacos sobre el piso de hormigón, concentración máxima, mirada fija en el objetivo.',
    negativeSpace: 'Las paredes oscuras del túnel o la zona superior enmarcada brindan zonas óptimas para tipografía limpia.',
    narrative: 'El instante sagrado en que se deja atrás la duda y solo queda salir a ganar.',
    idealModes: ['PREMATCH', 'MATCHDAY', 'CONVOCATORIA'],
    badgeColor: 'from-slate-900 to-emerald-900',
  },
  {
    id: 'the_big_match',
    number: 9,
    title: 'The Big Match (Gran Final)',
    subtitle: 'La solemnidad de las grandes finales y definiciones de título',
    tagline: 'Todo se reduce a este partido',
    description: 'La atmósfera de una gran final o clásico regional. Balón oficial en el centro, campo impecable, líneas blancas relucientes y un peso histórico en cada metro cuadrado.',
    artDirection: 'Grandilocuencia, solemnidad deportiva, estética de definición de campeonato con detalles en oro metálico bruñido.',
    camera: 'Fujifilm GFX 100 II Medium Format',
    lens: 'Fujinon GF 110mm f/2 R LM WR',
    aperture: 'f/2.5 con nitidez asombrosa en cada fibra del balón y césped',
    shutterSpeed: '1/1600s',
    iso: 'ISO 125',
    lighting: 'Iluminación de transmisión televisiva internacional HD, balanceada y potente, sin sombras indeseadas, con brillo dorado de campeonato.',
    colorGrading: 'Verde esmeralda imperial, blanco puro nival y acentos en dorado metálico brillante (#eab308), simbolizando el trofeo en juego.',
    composition: 'Composición simétrica monumental con el balón oficial o el círculo central como ancla visual de máxima autoridad.',
    atmosphere: 'Tensión solemne de campeonato, silencio expectante, viento agitando las banderas en los mástiles.',
    negativeSpace: 'Zonas simétricas superior e inferior perfectamente proporcionadas para títulos institucionales y datos del torneo.',
    narrative: 'El partido que todos querían jugar. Solo uno saldrá con la corona.',
    idealModes: ['MATCHDAY', 'RESULTADO_FINAL', 'JORNADA_DEPORTIVA'],
    badgeColor: 'from-amber-600 to-emerald-950',
  },
  {
    id: 'hero_portrait',
    number: 10,
    title: 'Football Hero Portrait',
    subtitle: 'Retrato de carácter, mirada de líder y alma guerrera',
    tagline: 'El rostro del compromiso y la pasión',
    description: 'Retrato de medio cuerpo del líder del equipo con la camiseta oficial de Colonia San Luis F.C. Mirada penetrante a cámara, expresión serena y decidida, textura de piel y uniforme hiperrealista.',
    artDirection: 'Retrato atlético íntimo y monumental. El jugador como símbolo viviente del club y de la comunidad de San Luis.',
    camera: 'Hasselblad X2D 100C con sensor CMOS de 100 Megapíxeles',
    lens: 'Hasselblad XCD 90mm f/2.5 V',
    aperture: 'f/2.5 con enfoque milimétrico en el iris de los ojos',
    shutterSpeed: '1/800s en sincronía con luz de estudio en locación',
    iso: 'ISO 64 para textura de piel inigualable',
    lighting: 'Esquema de iluminación Rembrandt deportivo: luz principal difusa a 45 grados, luz de relleno sutil y luz de recorte verde esmeralda en el hombro.',
    colorGrading: 'Tonos de piel auténticos con micro-relieve de poros y vello facial natural, camiseta verde esmeralda con ribetes dorados relucientes.',
    composition: 'Plano medio vertical a tres cuartos con el escudo del corazón prominente y espacio lateral para datos del partido.',
    atmosphere: 'Determinación contenida, respeto, liderazgo silencioso y conexión directa con el espectador.',
    negativeSpace: 'Laterales del encuadre y parte superior limpios para títulos grandes, dorsal y nombre del jugador.',
    narrative: 'Detrás de la camiseta hay un hombre que lleva el sueño de todo un municipio en su pecho.',
    idealModes: ['JUGADOR_DESTACADO', 'CONVOCATORIA', 'PREMATCH'],
    badgeColor: 'from-emerald-900 to-amber-900',
  },
  {
    id: 'dynamic_action',
    number: 11,
    title: 'Dynamic Action Photography',
    subtitle: 'El éxtasis del movimiento atlético en su punto culminante',
    tagline: 'Velocidad, potencia y precisión en un instante irrepetible',
    description: 'Acción deportiva en su máxima expresión: una volea en el aire, un remate acrobático o una estirada heroica del arquero congelada en 1/3200s con briznas de hierba flotando.',
    artDirection: 'Energía explosiva, potencia muscular, física deportiva real y la belleza estética del cuerpo humano en pleno esfuerzo.',
    camera: 'Canon EOS R3 de ráfaga ultrarrápida a 30 cps',
    lens: 'Canon RF 400mm f/2.8L IS USM superteleobjetivo',
    aperture: 'f/2.8 para aislar al futbolista del fondo de la cancha',
    shutterSpeed: '1/3200s con congelación absoluta del balón en rotación',
    iso: 'ISO 400',
    lighting: 'Luz frontal brillante de escenario que ilumina la cara del jugador mientras ejecuta la acción con sombras dinámicas en el pasto.',
    colorGrading: 'Colores deportivos vibrantes y calibrados, verde esmeralda radiante, césped nítido y blanco brillante en el balón.',
    composition: 'Composición dinámica oblicua con vectores de movimiento que dirigen la tensión hacia la esquina superior.',
    atmosphere: 'Partículas de tierra y césped suspendidas en el punto de impacto del botín contra el balón de fútbol.',
    negativeSpace: 'Zona inferior o lateral opuesta a la trayectoria del movimiento para colocar la información del partido.',
    narrative: 'La fracción de segundo que define el gol o la gloria defensiva.',
    idealModes: ['MATCHDAY', 'CELEBRACION', 'JUGADOR_DESTACADO'],
    badgeColor: 'from-emerald-700 to-teal-950',
  },
  {
    id: 'minimalist_luxury',
    number: 12,
    title: 'Minimalist Luxury Sports Design',
    subtitle: 'Diseño deportivo minimalista de alta gama suiza',
    tagline: 'La máxima sofisticación es la simplicidad absoluta',
    description: 'Diseño publicitario contemporáneo de alta costura deportiva. Fondos limpios, geometría impecable, amplio espacio negativo y detalles metálicos en verde y oro.',
    artDirection: 'Minimalismo europeo de vanguardia, tipografía grotesca condensada de peso pesado y pulcritud visual absoluta.',
    camera: 'Phase One IQ4 150MP Achromatic & Trichromatic',
    lens: 'Schneider Kreuznach 80mm LS f/2.8 Blue Ring',
    aperture: 'f/4.0 para nitidez quirúrgica en todos los planos',
    shutterSpeed: '1/1000s en entorno controlado',
    iso: 'ISO 50 con fidelidad de color absoluta',
    lighting: 'Luz superior cenital difusa homogénea con degradados suaves que abrazan los relieves del balón y del escudo.',
    colorGrading: 'Fondo gris pizarra oscuro (#090d0b) con el verde esmeralda (#15803d) actuando como protagonista exclusivo junto a líneas doradas finas.',
    composition: 'Cuadrícula suiza estricta con más del 50% de espacio negativo intencional para dejar respirar a la tipografía.',
    atmosphere: 'Silencio reverencial, orden geométrico, elegancia corporativa y prestigio institucional inmutable.',
    negativeSpace: 'Más de la mitad del póster reservado para distribución tipográfica limpia, jerárquica y legible a distancia.',
    narrative: 'Colonia San Luis F.C. como una institución de clase mundial: disciplina, orden y excelencia.',
    idealModes: ['CONVOCATORIA', 'MATCHDAY', 'JORNADA_DEPORTIVA'],
    badgeColor: 'from-zinc-900 to-emerald-950',
  },
  {
    id: 'dramatic_faceoff',
    number: 13,
    title: 'Dramatic Football Face-Off',
    subtitle: 'El cara a cara tenso entre rivales directos',
    tagline: 'Frente a frente por el destino del torneo',
    description: 'Dos figuras de espaldas o en perfil enfrentado divididos por la línea del mediocampo. Niebla baja sobre el césped y una iluminación dividida que encarna el choque entre San Luis y el rival.',
    artDirection: 'Tensión psicológica de boxeo/fútbol, miradas desafiantes, división espacial del campo en dos territorios.',
    camera: 'ARRI Alexa Mini LF con lentes anamórficos',
    lens: 'Cooke Anamorphic /i Full Frame Plus 40mm T2.3',
    aperture: 'f/2.8 para separación de las dos figuras sobre el fondo',
    shutterSpeed: '1/1000s',
    iso: 'ISO 800',
    lighting: 'Iluminación bicromática: luz esmeralda y dorada en el lado de San Luis, y luz fría contrastante en el lado del rival.',
    colorGrading: 'División tonal sutil: verde esmeralda y oro en la mitad izquierda, tonos neutros/fríos en la mitad derecha con choque central.',
    composition: 'Encuadre dividido simétrico (Split-Screen compositivo) con la palabra o insignia "VS" como vórtice central del póster.',
    atmosphere: 'Niebla baja arrastrándose por el pasto, miradas intensas y el aire cargado de rivalidad deportiva.',
    negativeSpace: 'Columna central vertical entre ambos contendientes para ubicar los escudos, la hora y el nombre del torneo.',
    narrative: 'Dos equipos, noventa minutos, un solo vencedor. La rivalidad llevada a su máxima expresión.',
    idealModes: ['MATCHDAY', 'PREMATCH'],
    badgeColor: 'from-emerald-900 to-red-950',
  },
  {
    id: 'grassroots_sanluis',
    number: 14,
    title: 'Authentic Grassroots Football',
    subtitle: 'Fútbol de pueblo, arraigo comunitario y orgullo montañero',
    tagline: 'La pasión que nace en las montañas de San Luis',
    description: 'El alma pura del fútbol aficionado y comunitario. La cancha de grama rodeada de montañas verdes, palmas, casas campesinas y la gente alentando en la orilla del campo.',
    artDirection: 'Autenticidad popular, sentimiento de pertenencia, hermandad comunitaria y la identidad viva del Oriente Antioqueño.',
    camera: 'Leica M11 Rangefinder con sensor BSI de 60 MP',
    lens: 'Leica Summilux-M 35mm f/1.4 ASPH',
    aperture: 'f/2.4 para mantener visible el paisaje montañoso al fondo',
    shutterSpeed: '1/1600s con luz de día natural',
    iso: 'ISO 125',
    lighting: 'Luz natural de día antioqueño con nubes blancas esponjosas que tamizan el sol sobre el valle verde.',
    colorGrading: 'Tonos verdes exuberantes de vegetación andina, tierra marrón fértil, blanco puro en las líneas y el verde de la camiseta local.',
    composition: 'Plano general amplio donde la cancha y los jugadores son el corazón de un paisaje montañoso imponente.',
    atmosphere: 'Viento fresco de las cascadas del río Dormilón, risas, gritos de aliento desde la baranda y fútbol puro sin pretensiones.',
    negativeSpace: 'Cielo andino superior y franja de grama en primer plano para datos oficiales y lema del club.',
    narrative: 'Aquí no hay millones ni contratos: hay amor propio, orgullo sanluisano y respeto por la camiseta.',
    idealModes: ['MATCHDAY', 'CELEBRACION', 'JORNADA_DEPORTIVA'],
    badgeColor: 'from-emerald-800 to-amber-800',
  },
  {
    id: 'conceptual_poetry',
    number: 15,
    title: 'Creative Conceptual Sports Advertising',
    subtitle: 'Metáfora visual poética: el balón y la tierra conectados',
    tagline: 'El fútbol como metáfora de la vida y la superación',
    description: 'Dirección publicitaria conceptual premiada (estilo Festival de Cannes Lions). El balón de fútbol descansando sobre el punto penal mientras raíces verdes se entrelazan con el cuero.',
    artDirection: 'Poesía visual, metáfora potente, arte conceptual deportivo que emociona y trasciende el resultado del marcador.',
    camera: 'Sony CineAlta Venice 2 con sensor Full Frame 8.6K',
    lens: 'Zeiss Supreme Prime Radiance 40mm T1.5',
    aperture: 'f/2.0 para un foco poético selectivo',
    shutterSpeed: '1/1000s',
    iso: 'ISO 250 con gradación de cine',
    lighting: 'Haz de luz divino cenital (God Ray) que desciende verticalmente como si iluminara un tesoro sagrado en medio de la cancha.',
    colorGrading: 'Atmósfera mística en verde bosque profundo, partículas de polen y rocío brillando como oro pulverizado en el rayo de luz.',
    composition: 'Enfoque macro con perspectiva cenital o rasante sobre el balón de fútbol, con el campo desplegándose hacia el infinito.',
    atmosphere: 'Reverencia, silencio majestuoso, conexión entre la naturaleza de San Luis y la pasión por el deporte.',
    negativeSpace: 'Espacio aéreo etéreo superior para ubicar el lema oficial: "FE, ESPERANZA Y FUTURO".',
    narrative: 'Más que un juego: una pasión sembrada en el corazón de nuestra tierra que florece cada fin de semana.',
    idealModes: ['MATCHDAY', 'PREMATCH', 'CELEBRACION'],
    badgeColor: 'from-emerald-950 to-teal-900',
  },
];

export interface PromptHistoryEntry {
  id: string;
  timestamp: string;
  matchId: string;
  rivalName: string;
  tournamentName: string;
  mode: CreativeDesignMode;
  conceptId: string;
  conceptNumber: number;
  conceptTitle: string;
  camera: string;
  lighting: string;
  colorGrading: string;
  snippet: string;
}

const HISTORY_STORAGE_KEY = 'csl_creative_director_history_v2';

/**
 * Obtiene el historial de conceptos publicitarios utilizados recientemente.
 */
export function getPromptHistory(teamId?: string): PromptHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = teamId ? `${HISTORY_STORAGE_KEY}_${teamId}` : HISTORY_STORAGE_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading prompt history from localStorage:', err);
    return [];
  }
}

/**
 * Guarda una nueva dirección creativa en el historial persistente.
 */
export function savePromptHistoryEntry(entry: PromptHistoryEntry, teamId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = teamId ? `${HISTORY_STORAGE_KEY}_${teamId}` : HISTORY_STORAGE_KEY;
    const current = getPromptHistory(teamId);
    // Filtrar si ya existía para evitar duplicados del mismo match y concepto simultáneos
    const filtered = current.filter((item) => !(item.matchId === entry.matchId && item.conceptId === entry.conceptId));
    const updated = [entry, ...filtered].slice(0, 15); // Mantener últimos 15
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error('Error saving prompt history to localStorage:', err);
  }
}

/**
 * Limpia el historial de conceptos utilizados.
 */
export function clearPromptHistory(teamId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = teamId ? `${HISTORY_STORAGE_KEY}_${teamId}` : HISTORY_STORAGE_KEY;
    localStorage.removeItem(key);
  } catch (err) {
    console.error('Error clearing prompt history:', err);
  }
}

/**
 * MOTOR DE ROTACIÓN INTELIGENTE DE CONCEPTOS
 * Selecciona autónomamente el concepto creativo óptimo para un partido y modo de diseño,
 * asegurando variedad constante y evitando repetir los últimos 4 conceptos utilizados.
 */
export function selectIntelligentConcept(
  mode: CreativeDesignMode,
  matchId: string,
  teamId?: string,
  preferredConceptId?: string
): CreativeConcept {
  // Si se solicita un concepto explícito por ID, buscarlo
  if (preferredConceptId) {
    const matched = CREATIVE_CONCEPTS_LIBRARY.find((c) => c.id === preferredConceptId);
    if (matched) return matched;
  }

  const history = getPromptHistory(teamId);
  // Obtener los últimos 4 conceptos usados
  const recentConceptIds = history.slice(0, 4).map((h) => h.conceptId);

  // Conceptos que son ideales para este modo de diseño
  const idealForMode = CREATIVE_CONCEPTS_LIBRARY.filter((c) => c.idealModes.includes(mode));
  const candidatePool = idealForMode.length > 0 ? idealForMode : CREATIVE_CONCEPTS_LIBRARY;

  // Filtrar los que no se han usado recientemente
  const freshCandidates = candidatePool.filter((c) => !recentConceptIds.includes(c.id));

  if (freshCandidates.length > 0) {
    // Selección pseudo-aleatoria pero balanceada usando el ID del partido y la fecha actual
    const seed = matchId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + Date.now();
    const index = Math.abs(seed) % freshCandidates.length;
    return freshCandidates[index];
  }

  // Si todos los ideales fueron usados recientemente, elegir el menos recientemente usado
  const remainingCandidates = CREATIVE_CONCEPTS_LIBRARY.filter((c) => !recentConceptIds.slice(0, 2).includes(c.id));
  if (remainingCandidates.length > 0) {
    const index = Math.floor(Math.random() * remainingCandidates.length);
    return remainingCandidates[index];
  }

  // Fallback seguro
  return CREATIVE_CONCEPTS_LIBRARY[0];
}

export interface AIPromptsBundle {
  fullPosterPromptEs: string;
  midjourneyPromptEn: string;
  cleanBackgroundPromptEs: string;
  squadTextFormatted: string;
  concept: CreativeConcept;
  mode: CreativeDesignMode;
  modeConfig: DesignModeConfig;
  metadata: {
    teamName: string;
    rivalName: string;
    tournament: string;
    dateFormatted: string;
    timeFormatted: string;
    location: string;
    confirmedCount: number;
    scoreText?: string;
  };
}

/**
 * GENERADOR MAESTRO DE INSTRUCCIONES PUBLICITARIAS DEPORTIVAS
 *
 * Transforma los datos del partido en un prompt publicitario estructurado
 * en 14 bloques profesionales, listo para copiar y pegar en Midjourney,
 * ChatGPT, DALL-E 3, Ideogram, Flux o Gemini Imagen 3.
 */
export function generateAIPrompts(
  team: Team | null,
  match: Match,
  confirmedPlayers: Callup[] = [],
  options?: {
    mode?: CreativeDesignMode;
    conceptId?: string;
    recordHistory?: boolean;
  }
): AIPromptsBundle {
  const mode: CreativeDesignMode = options?.mode || 'MATCHDAY';
  const modeConfig = DESIGN_MODES.find((m) => m.id === mode) || DESIGN_MODES[0];

  // Datos Oficiales Inmutables (REGLA: NUNCA INVENTAR DATOS)
  const teamName = team?.name ? team.name.trim() : 'Colonia San Luis F.C.';
  const rivalName = match.rival ? match.rival.trim() : 'Rival';
  const tournament = match.tournamentName ? match.tournamentName.trim() : 'Torneo Oficial';
  const dateFormatted = formatMatchDate(match.date);
  const timeFormatted = match.time ? `a las ${match.time}` : 'Hora oficial por confirmar';
  const location = match.location && match.location.trim().length > 0 ? match.location.trim() : 'Escenario deportivo oficial';
  const primaryColor = team?.primaryColor || '#15803d'; // Verde esmeralda oficial
  const secondaryColor = team?.secondaryColor || '#ffffff'; // Blanco oficial
  const accentColor = '#fbbf24'; // Dorado metálico

  // Selección inteligente y autónoma del concepto creativo
  const concept = selectIntelligentConcept(mode, match.id, team?.id, options?.conceptId);

  // Formateo estricto de la lista de convocados (solo confirmados reales)
  const sortedConfirmed = [...confirmedPlayers].sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  const squadListText = sortedConfirmed.length > 0
    ? sortedConfirmed.map((p) => `#${p.jerseyNumber} ${p.fullName}`).join(', ')
    : 'Nómina oficial completa registrada para el encuentro';

  const squadLinesText = sortedConfirmed.length > 0
    ? sortedConfirmed.map((p) => `• #${p.jerseyNumber} ${p.fullName}`).join('\n')
    : '• Nómina titular y suplentes oficiales';

  // Marcador si existe
  let scoreText = '';
  if (match.score && typeof match.score.homeGoals === 'number' && typeof match.score.awayGoals === 'number') {
    scoreText = `${teamName} ${match.score.homeGoals} - ${match.score.awayGoals} ${rivalName}`;
  }

  // =========================================================================
  // 1. PROMPT MAESTRO EN ESPAÑOL (ChatGPT, Ideogram, Gemini, DALL-E 3)
  // Estructurado en 14 bloques militares de dirección creativa profesional
  // =========================================================================
  const fullPosterPromptEs = `INSTRUCCIÓN MAESTRA DE PUBLICIDAD DEPORTIVA PROFESIONAL: PÓSTER OFICIAL DE FÚTBOL
CAMPAÑA INTERNACIONAL: "${concept.title.toUpperCase()}"
CLUB PRINCIPAL: "${teamName.toUpperCase()}" (SAN LUIS, ANTIOQUIA / MEDELLÍN)

1. IDENTIFICACIÓN Y TIPO DE PIEZA:
• Modalidad: ${modeConfig.name.toUpperCase()} (${modeConfig.badge.toUpperCase()}).
• Objetivo: ${modeConfig.focus}
• Nivel de Producción: Campaña gráfica de clase mundial, apta para vallas de vía pública, anuncios de prensa, Instagram y cartelera oficial.

2. DATOS OFICIALES DEL ENCUENTRO (VERIFICADOS - PROHIBIDO MODIFICAR O INVENTAR):
• Club Local / Principal: "${teamName}"
• Club Rival: "${rivalName}"
• Torneo / Campeonato: "${tournament}"
• Fecha Oficial: ${dateFormatted}
• Hora Oficial: ${timeFormatted}
• Escenario / Cancha: ${location}
${scoreText ? `• Marcador Oficial Final: ${scoreText}\n` : ''}• Colores Oficiales del Club: Verde Esmeralda intenso (${primaryColor}), Blanco puro (${secondaryColor}) y Dorado metálico de acento (${accentColor}).
• Lemas Oficiales (Opcionales como recurso compositivo): "FE, ESPERANZA Y FUTURO" • "LA PERLA VERDE DE ANTIOQUIA".

3. CONCEPTO CREATIVO SELECCIONADO:
• Concepto #${concept.number}: "${concept.title}"
• Subtítulo de Campaña: "${concept.subtitle}"
• Eje Narrativo: "${concept.narrative}"
• Intención Visual: ${concept.description}

4. DIRECCIÓN ARTÍSTICA:
• ${concept.artDirection}
• Estilo: Fotografía publicitaria auténtica de alta gama. Evitar cualquier apariencia sintética, plástica o caricaturesca.
• Carácter: Firmeza, honor, respeto deportivo y orgullo comunitario de San Luis, Antioquia.

5. DIRECCIÓN FOTOGRÁFICA Y PARÁMETROS ÓPTICOS:
• Cámara: ${concept.camera}
• Óptica / Lente: ${concept.lens}
• Apertura de Diafragma: ${concept.aperture}
• Velocidad de Obturación: ${concept.shutterSpeed}
• Sensibilidad del Sensor: ${concept.iso}
• Profundidad de Campo: Enfoque nítido y quirúrgico en el centro de atención con desenfoque óptico gradual y bokeh natural en las luces lejanas del fondo.

6. ESCENARIO Y ATMÓSFERA:
• Escenario: ${location}. Cancha reglamentaria con césped natural esmeralda impecable, líneas de cal blanca nítidas y textura de grama real.
• Atmósfera: ${concept.atmosphere}
• Iluminación: ${concept.lighting}

7. COMPOSICIÓN Y DISTRIBUCIÓN ESPACIAL:
• ${concept.composition}
• Espacio Negativo (Copy Space): ${concept.negativeSpace}
• La imagen debe permitir que los textos oficiales y los escudos respiren con dignidad editorial sin invadir el protagonismo fotográfico.

8. TRATAMIENTO DE ESCUDOS E IDENTIDAD VISUAL:
• Escudo de "${teamName}": Escudo heráldico con los colores verde esmeralda y oro, sol dorado radiante en la cumbre, silueta de montañas, hacha maderera, iglesia y rama de café de San Luis.
• No inventar ni distorsionar la heráldica oficial; representar con dignidad institucional sobre fondo limpio o en la parte superior.
• Escudo o distintivo del rival: "${rivalName}" ubicado con simetría y jerarquía deportiva.

${mode === 'CONVOCATORIA' ? `9. NÓMINA OFICIAL DE CONVOCADOS (CON DORSALES EXACTOS):
${squadListText}
• Los dorsales y nombres deben ir en una tipografía condensada de alta legibilidad en la zona designada de espacio negativo.
` : `9. JUGADORES Y ELEMENTOS HUMANOS:
• Anatomía humana 100% natural y atlética. Músculos tensos por el esfuerzo sin exageraciones deformes.
• Piel con textura real: poros auténticos, micro-arrugas de expresión, gotas de sudor natural reflejando la luz, sin retoque plástico ni piel de cera.
• Uniformes de fútbol con textura de tela microperforada transpirable, costuras reales y caída física auténtica.
`}

10. PALETA CROMÁTICA Y COLOR GRADING:
• Color Grading: ${concept.colorGrading}
• Tonos dominantes: Verde esmeralda (#15803d), blanco nieve (#ffffff), acentos dorados cálidos (#fbbf24) y negros profundos con detalle en sombras.

11. TRATAMIENTO TIPOGRÁFICO Y TEXTO:
• Título Principal: "MATCHDAY" o "${teamName.toUpperCase()} VS ${rivalName.toUpperCase()}".
• Tipografía: Tipografía deportiva geométrica, condensada y contundente, en caja alta (bold condensed athletic sans-serif).
• Subtítulos: "${tournament.toUpperCase()}" • "${dateFormatted.toUpperCase()}" • "${timeFormatted.toUpperCase()}".
• El texto debe ser nítido, sin deformaciones ni palabras inventadas.

12. RESTRICCIONES ABSOLUTAS Y ELEMENTOS PROHIBIDOS (ANTI-AI SLOP):
• TOTALMENTE PROHIBIDO: Efecto de piel plástica, rostros suavizados estilo filtro de belleza, ojos vidriosos o desalineados.
• PROHIBIDO: Manos con más o menos de 5 dedos, extremidades deformes, anatomía imposible o flotante.
• PROHIBIDO: Exceso de partículas flotantes, chispas innecesarias, destellos de lente de circo o explosiones irreales.
• PROHIBIDO: Estética de videojuego (no FIFA / eFootball 3D render) ni muñecos CGI. Debe parecer una toma capturada por un fotógrafo profesional premiado.
• PROHIBIDO: Inventar nombres de jugadores que no estén en la lista oficial suministrada ni modificar las fechas y lugares dados.

13. ESPECIFICACIONES TÉCNICAS DE ENTREGA:
• Formato: Vertical póster / cartelera 4:5 o 9:16 (1080x1350 px o 1080x1920 px).
• Resolución: Ultra HD 8K, hiper-detallado, acabado editorial publicitario listo para publicación.

14. RESUMEN DE CONTROL DE CALIDAD:
• Fotografía deportiva creíble: SÍ
• Datos oficiales exactos respetados: SÍ
• Identidad de Colonia San Luis F.C.: SÍ
• Ausencia de artefactos de IA: GARANTIZADA`;

  // =========================================================================
  // 2. PROMPT INTERNACIONAL EN INGLÉS (Midjourney v6.1, Flux.1 Pro, SDXL)
  // Optimizado con sintaxis fotográfica y parámetros exactos
  // =========================================================================
  const midjourneyPromptEn = `Master sports commercial photography poster for official football match, "${teamName}" vs "${rivalName}". Creative concept: "${concept.title}". ${concept.description} Shot on ${concept.camera}, ${concept.lens}, ${concept.aperture}, shutter speed ${concept.shutterSpeed}, ${concept.iso}. ${concept.lighting} Atmosphere: ${concept.atmosphere}. Color grading: ${concept.colorGrading}. Pristine natural emerald green grass pitch (#15803d) with sharp white chalk lines, stadium floodlights cutting through light atmospheric mist, high micro-contrast, authentic human skin texture with pores and subtle sweat droplets, realistic athletic anatomy, realistic breathable sports jersey fabric with stitched crest details. Clean negative space at the top and bottom third for editorial typography reading "${tournament}", "${dateFormatted}". Regal, heroic, documentary realism, commercial sports campaign award-winning photograph, zero plastic skin, zero CGI artifact, 8k resolution, raw photorealism --ar 4:5 --v 6.1 --style raw --q 2 --s 250`;

  // =========================================================================
  // 3. CLEAN EDITORIAL BACKGROUND PLATE (Sin textos ni logos de IA)
  // Diseñado para montar tipografía vectorial limpia directamente en la app
  // =========================================================================
  const cleanBackgroundPromptEs = `Fotografía deportiva profesional de estadio y cancha de fútbol sin textos ni logotipos generados, concepto visual "${concept.title}", encuadre ${concept.composition}, toma con ${concept.camera} y lente ${concept.lens}. Iluminación: ${concept.lighting}. Terreno de juego con césped verde esmeralda impecable (${primaryColor}), líneas de cal blanca nítidas, atmósfera con ${concept.atmosphere}. Composición con generoso espacio negativo limpio y despejado en el tercio superior e inferior para superposición tipográfica perfecta, fotorrealismo óptico absoluto, acabado editorial deportivo internacional, 8k, textura analógica pura, sin personas en primer plano ni marcas de agua.`;

  // Registrar en el historial si está habilitado
  if (options?.recordHistory !== false && typeof window !== 'undefined') {
    const historyEntry: PromptHistoryEntry = {
      id: `${match.id}_${Date.now()}`,
      timestamp: new Date().toISOString(),
      matchId: match.id,
      rivalName,
      tournamentName: tournament,
      mode,
      conceptId: concept.id,
      conceptNumber: concept.number,
      conceptTitle: concept.title,
      camera: concept.camera,
      lighting: concept.lighting,
      colorGrading: concept.colorGrading,
      snippet: fullPosterPromptEs.slice(0, 180) + '...',
    };
    savePromptHistoryEntry(historyEntry, team?.id);
  }

  return {
    fullPosterPromptEs,
    midjourneyPromptEn,
    cleanBackgroundPromptEs,
    squadTextFormatted: squadLinesText,
    concept,
    mode,
    modeConfig,
    metadata: {
      teamName,
      rivalName,
      tournament,
      dateFormatted,
      timeFormatted,
      location,
      confirmedCount: sortedConfirmed.length,
      scoreText: scoreText || undefined,
    },
  };
}
