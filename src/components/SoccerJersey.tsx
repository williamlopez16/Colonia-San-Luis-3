import React, { useId } from 'react';

interface SoccerJerseyProps {
  jerseyNumber: number | string;
  isGK?: boolean;
  isEmpty?: boolean;
  isCaptain?: boolean;
  photoUrl?: string;
  className?: string;
  showPhoto?: boolean;
  isSelected?: boolean;
  isSwapSource?: boolean;
  kitStyle?: 'home' | 'away' | 'third';
}

/**
 * Authentic Lineup11-style Football Jersey Icon.
 * Renders an athletic soccer shirt with collar, short sleeves, cuffs,
 * custom kit styles (Verdolaga green/white home, white/green away, black/gold third),
 * golden amber gradient for goalkeepers, captain armband on sleeve,
 * and bold centered dorsal number.
 */
export const SoccerJersey: React.FC<SoccerJerseyProps> = ({
  jerseyNumber,
  isGK = false,
  isEmpty = false,
  isCaptain = false,
  photoUrl,
  className = '',
  showPhoto = true,
  isSelected = false,
  isSwapSource = false,
  kitStyle = 'home',
}) => {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const clipId = `jersey_clip_${safeId}`;
  const photoClipId = `photo_clip_${safeId}`;
  const gradId = `jersey_grad_${safeId}`;

  // Silhouette path of the soccer jersey (64x58 viewBox)
  const jerseyPath =
    'M 22 5 Q 32 11 42 5 L 53 10 L 63 23 L 54 29 L 47 21 L 46 52 Q 32 55 18 52 L 17 21 L 10 29 L 1 23 L 11 10 Z';

  return (
    <div
      className={`relative inline-block select-none transition-transform ${className} ${
        isSwapSource
          ? 'animate-pulse scale-105'
          : isSelected
          ? 'scale-105'
          : ''
      }`}
    >
      <svg
        viewBox="0 0 64 58"
        className={`w-full h-full overflow-visible transition-all ${
          isSwapSource
            ? 'drop-shadow-[0_0_10px_rgba(245,158,11,0.9)]'
            : isSelected
            ? 'drop-shadow-[0_0_10px_rgba(250,204,21,0.95)]'
            : 'drop-shadow-[0_4px_6px_rgba(0,0,0,0.65)]'
        }`}
      >
        <defs>
          {/* Main jersey clipping path */}
          <clipPath id={clipId}>
            <path d={jerseyPath} />
          </clipPath>

          {/* Photo circular clip for chest medallion */}
          <clipPath id={photoClipId}>
            <circle cx="21" cy="20" r="5.5" />
          </clipPath>

          {/* Gradients with Official San Luis Antioquia Colors */}
          {isGK ? (
            /* Sol Radiante de San Luis (Golden Amber) */
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="45%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          ) : kitStyle === 'away' ? (
            /* Blanco Antioquia con vivos San Luis */
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          ) : kitStyle === 'third' ? (
            /* Azul Río Dormilón / Samaná Norte */
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#075985" />
            </linearGradient>
          ) : (
            /* Verde Esmeralda (Perla Verde de Antioquia) */
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#047857" />
              <stop offset="100%" stopColor="#064e3b" />
            </linearGradient>
          )}
        </defs>

        {/* Selected / Swap Glow Aura */}
        {isSelected && (
          <path
            d={jerseyPath}
            fill="none"
            stroke="#facc15"
            strokeWidth="4"
            strokeLinejoin="round"
            className="opacity-90"
          />
        )}
        {isSwapSource && (
          <path
            d={jerseyPath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="4"
            strokeLinejoin="round"
            className="opacity-90 animate-pulse"
          />
        )}

        {/* Clipped Jersey Body (San Luis Antioquia Flag: Verde - Azul - Sol Dorado) */}
        <g clipPath={`url(#${clipId})`}>
          {isEmpty ? (
            <rect width="64" height="58" fill="#022c22" fillOpacity="0.75" />
          ) : (
            <>
              {/* Solid / Gradient Base */}
              <rect width="64" height="58" fill={`url(#${gradId})`} />

              {/* Home Kit: Verde Esmeralda con Franja Azul Río y Sol Dorado (Bandera de San Luis) */}
              {!isGK && kitStyle === 'home' && (
                <>
                  {/* Central Blue Stripe (Ríos Dormilón y Samaná) */}
                  <rect x="22" y="0" width="20" height="58" fill="#0284c7" fillOpacity="0.95" />
                  {/* Golden borders for the flag */}
                  <rect x="20.5" y="0" width="1.5" height="58" fill="#fbbf24" />
                  <rect x="42" y="0" width="1.5" height="58" fill="#fbbf24" />
                  {/* White pinstripes */}
                  <rect x="23.5" y="0" width="1" height="58" fill="#ffffff" fillOpacity="0.85" />
                  <rect x="39.5" y="0" width="1" height="58" fill="#ffffff" fillOpacity="0.85" />
                  {/* Flank depth shading */}
                  <rect x="15" y="0" width="4" height="58" fill="#000000" fillOpacity="0.18" />
                  <rect x="45" y="0" width="4" height="58" fill="#000000" fillOpacity="0.18" />

                  {/* Radiant Golden Sun Emblem of San Luis */}
                  <g opacity="0.95">
                    <circle cx="32" cy="18" r="3.2" fill="#facc15" stroke="#d97706" strokeWidth="0.5" />
                    <line x1="32" y1="13.2" x2="32" y2="14.5" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="32" y1="21.5" x2="32" y2="22.8" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="27.2" y1="18" x2="28.5" y2="18" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="35.5" y1="18" x2="36.8" y2="18" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="28.6" y1="14.6" x2="29.5" y2="15.5" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="34.5" y1="20.5" x2="35.4" y2="21.4" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="28.6" y1="21.4" x2="29.5" y2="20.5" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                    <line x1="34.5" y1="15.5" x2="35.4" y2="14.6" stroke="#facc15" strokeWidth="0.9" strokeLinecap="round" />
                  </g>
                </>
              )}

              {/* Away Kit: Blanco Antioquia con Doble Franja Verde y Azul San Luis */}
              {!isGK && kitStyle === 'away' && (
                <>
                  <rect x="22" y="0" width="9" height="58" fill="#047857" fillOpacity="0.92" />
                  <rect x="33" y="0" width="9" height="58" fill="#0284c7" fillOpacity="0.92" />
                  <rect x="31" y="0" width="2" height="58" fill="#fbbf24" />
                  {/* Subtle flanks */}
                  <rect x="16" y="0" width="3" height="58" fill="#047857" fillOpacity="0.25" />
                  <rect x="45" y="0" width="3" height="58" fill="#0284c7" fillOpacity="0.25" />
                  {/* Mini Sun */}
                  <circle cx="32" cy="18" r="2.8" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
                </>
              )}

              {/* Third Kit: Azul Río Dormilón con vivos Verde y Sol Dorado */}
              {!isGK && kitStyle === 'third' && (
                <>
                  <rect x="18" y="0" width="5" height="58" fill="#059669" fillOpacity="0.9" />
                  <rect x="41" y="0" width="5" height="58" fill="#059669" fillOpacity="0.9" />
                  <rect x="23" y="0" width="1.5" height="58" fill="#fbbf24" />
                  <rect x="39.5" y="0" width="1.5" height="58" fill="#fbbf24" />
                  {/* Center subtle glow */}
                  <rect x="26" y="0" width="12" height="58" fill="#38bdf8" fillOpacity="0.18" />
                  {/* Sol de San Luis */}
                  <circle cx="32" cy="18" r="3" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
                </>
              )}

              {/* Goalkeeper: Sol Radiante de San Luis con Hombros Azul Río y Verde */}
              {isGK && (
                <>
                  {/* Left Shoulder (Verde Esmeralda) */}
                  <polygon points="11,10 22,5 20,13 10,16" fill="#047857" fillOpacity="0.85" />
                  {/* Right Shoulder (Azul Río) */}
                  <polygon points="53,10 42,5 44,13 54,16" fill="#0284c7" fillOpacity="0.85" />
                  {/* Center subtle chest band */}
                  <rect x="26" y="0" width="12" height="58" fill="#fef08a" fillOpacity="0.3" />
                </>
              )}
            </>
          )}
        </g>

        {/* Jersey Outline */}
        <path
          d={jerseyPath}
          fill="none"
          stroke={
            isEmpty
              ? '#6ee7b7'
              : isSelected
              ? '#facc15'
              : isGK
              ? '#0284c7'
              : kitStyle === 'away'
              ? '#0284c7'
              : kitStyle === 'third'
              ? '#38bdf8'
              : '#34d399'
          }
          strokeWidth={isEmpty ? '1.5' : '1.8'}
          strokeDasharray={isEmpty ? '3 2' : undefined}
          strokeLinejoin="round"
        />

        {/* Collar Trim */}
        <path
          d="M 22 5 Q 32 11 42 5"
          fill="none"
          stroke={
            isGK
              ? '#0c4a6e'
              : kitStyle === 'away'
              ? '#047857'
              : kitStyle === 'third'
              ? '#fbbf24'
              : '#38bdf8'
          }
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Sleeve Cuffs */}
        {!isEmpty && (
          <>
            {/* Left Cuff */}
            <line
              x1="1"
              y1="23"
              x2="10"
              y2="29"
              stroke={
                isGK
                  ? '#047857'
                  : kitStyle === 'away'
                  ? '#047857'
                  : kitStyle === 'third'
                  ? '#fbbf24'
                  : '#0284c7'
              }
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            {/* Right Cuff */}
            <line
              x1="63"
              y1="23"
              x2="54"
              y2="29"
              stroke={
                isGK
                  ? '#0284c7'
                  : kitStyle === 'away'
                  ? '#0284c7'
                  : kitStyle === 'third'
                  ? '#fbbf24'
                  : '#0284c7'
              }
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </>
        )}

        {/* Captain Armband on Left Sleeve */}
        {isCaptain && !isEmpty && (
          <g>
            <polygon
              points="3.5,21.5 10.5,18 11.5,23.5 4.5,26.5"
              fill="#fbbf24"
              stroke="#0c4a6e"
              strokeWidth="0.6"
            />
            <text
              x="7.5"
              y="22.5"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="5"
              fontWeight="900"
              fill="#0c4a6e"
              fontFamily="system-ui, sans-serif"
            >
              C
            </text>
          </g>
        )}

        {/* Player Photo Crest Medallion (if present) */}
        {photoUrl && showPhoto && !isEmpty && (
          <g>
            <circle cx="21" cy="20" r="5.5" fill="#ffffff" />
            <image
              href={photoUrl}
              x="15.5"
              y="14.5"
              width="11"
              height="11"
              clipPath={`url(#${photoClipId})`}
              preserveAspectRatio="xMidYMid slice"
            />
            <circle
              cx="21"
              cy="20"
              r="5.5"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Dorsal Jersey Number */}
        <text
          x="32"
          y="35"
          textAnchor="middle"
          dominantBaseline="central"
          fill={
            isGK
              ? '#0c4a6e'
              : kitStyle === 'away'
              ? '#047857'
              : kitStyle === 'third'
              ? '#fef08a'
              : '#ffffff'
          }
          stroke={
            isGK
              ? '#ffffff'
              : kitStyle === 'away'
              ? '#ffffff'
              : kitStyle === 'third'
              ? '#0c4a6e'
              : '#0c4a6e'
          }
          strokeWidth="0.8"
          paintOrder="stroke fill"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="17.5"
          letterSpacing="-0.5px"
          className="select-none"
        >
          {isEmpty ? '?' : jerseyNumber}
        </text>
      </svg>
    </div>
  );
};
