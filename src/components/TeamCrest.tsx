import React from 'react';

interface TeamCrestProps {
  name: string;
  isOurTeam?: boolean;
  logoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Deterministic color palette generator for rival teams
function getRivalTheme(name: string) {
  const themes = [
    { bg: 'from-blue-700 to-indigo-900', text: 'text-blue-100', border: 'border-blue-400', accent: '#3b82f6', badge: 'bg-blue-600' },
    { bg: 'from-red-700 to-rose-950', text: 'text-rose-100', border: 'border-rose-400', accent: '#ef4444', badge: 'bg-rose-600' },
    { bg: 'from-amber-600 to-orange-950', text: 'text-amber-100', border: 'border-amber-400', accent: '#f59e0b', badge: 'bg-amber-600' },
    { bg: 'from-purple-700 to-violet-950', text: 'text-purple-100', border: 'border-purple-400', accent: '#a855f7', badge: 'bg-purple-600' },
    { bg: 'from-cyan-700 to-sky-950', text: 'text-cyan-100', border: 'border-cyan-400', accent: '#06b6d4', badge: 'bg-cyan-600' },
    { bg: 'from-slate-700 to-zinc-900', text: 'text-slate-100', border: 'border-slate-400', accent: '#64748b', badge: 'bg-slate-600' },
    { bg: 'from-teal-700 to-emerald-950', text: 'text-teal-100', border: 'border-teal-400', accent: '#14b8a6', badge: 'bg-teal-600' },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % themes.length;
  return themes[index];
}

function getInitials(name: string): string {
  if (!name) return 'FC';
  const clean = name.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase();
  }
  if (words.length === 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
}

export const TeamCrest: React.FC<TeamCrestProps> = ({
  name,
  isOurTeam = false,
  logoUrl,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    xs: { box: 'w-7 h-8', font: 'text-[9px]', icon: 'w-2.5 h-2.5', star: 'text-[7px]' },
    sm: { box: 'w-9 h-11', font: 'text-[10px]', icon: 'w-3 h-3', star: 'text-[8px]' },
    md: { box: 'w-12 h-14', font: 'text-xs', icon: 'w-4 h-4', star: 'text-[9px]' },
    lg: { box: 'w-16 h-19', font: 'text-sm font-black', icon: 'w-5 h-5', star: 'text-[11px]' },
    xl: { box: 'w-20 h-24', font: 'text-base font-black', icon: 'w-6 h-6', star: 'text-xs' },
  };

  const currentSize = sizeMap[size];
  const initials = getInitials(name);

  if (logoUrl) {
    return (
      <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain filter drop-shadow-md"
        />
      </div>
    );
  }

  // OUR TEAM: Verdolaga Shield (Green & White, Gold Stars)
  if (isOurTeam) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center select-none ${currentSize.box} ${className}`}
        title={name}
      >
        {/* Star on top */}
        <span className={`text-amber-400 font-black leading-none drop-shadow-xs mb-0.5 ${currentSize.star}`}>
          ★
        </span>

        {/* Traditional Soccer Shield SVG */}
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full drop-shadow-md overflow-visible"
        >
          <defs>
            <linearGradient id="verdolagaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#15803d" />
              <stop offset="50%" stopColor="#166534" />
              <stop offset="100%" stopColor="#052e16" />
            </linearGradient>
            <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>
            <clipPath id="shieldClip">
              <path d="M 50 5 L 90 20 C 90 75, 50 115, 50 115 C 50 115, 10 75, 10 20 Z" />
            </clipPath>
          </defs>

          {/* Golden Outer Shield Outline */}
          <path
            d="M 50 2 L 93 18 C 93 78, 50 118, 50 118 C 50 118, 7 78, 7 18 Z"
            fill="url(#goldBorder)"
          />

          {/* Inner Shield Body */}
          <path
            d="M 50 5 L 90 20 C 90 75, 50 115, 50 115 C 50 115, 10 75, 10 20 Z"
            fill="url(#verdolagaGrad)"
          />

          {/* White vertical stripes inside shield */}
          <g clipPath="url(#shieldClip)">
            <rect x="25" y="0" width="12" height="120" fill="#ffffff" opacity="0.9" />
            <rect x="44" y="0" width="12" height="120" fill="#ffffff" opacity="0.9" />
            <rect x="63" y="0" width="12" height="120" fill="#ffffff" opacity="0.9" />

            {/* Dark green bottom chevron overlay */}
            <path d="M 0 65 L 100 65 L 100 120 L 0 120 Z" fill="#052e16" opacity="0.5" />
          </g>

          {/* Top Banner with Soccer Ball */}
          <circle cx="50" cy="55" r="18" fill="#ffffff" stroke="#15803d" strokeWidth="2.5" />
          <path
            d="M 50 43 L 57 48 L 54 57 L 46 57 L 43 48 Z"
            fill="#052e16"
          />
          <path d="M 50 43 L 50 37 M 57 48 L 64 48 M 54 57 L 58 64 M 46 57 L 42 64 M 43 48 L 36 48" stroke="#052e16" strokeWidth="1.8" />

          {/* Initials Text */}
          <text
            x="50"
            y="94"
            textAnchor="middle"
            fill="#ffffff"
            fontWeight="900"
            fontSize="18"
            letterSpacing="0.5"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            {initials}
          </text>
        </svg>
      </div>
    );
  }

  // RIVAL TEAM: Dynamic Football Shield
  const theme = getRivalTheme(name);

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${currentSize.box} ${className}`}
      title={name}
    >
      <svg
        viewBox="0 0 100 120"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        <defs>
          <linearGradient id={`rivalGrad_${name.replace(/\s+/g, '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.accent} />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <clipPath id={`rivalClip_${name.replace(/\s+/g, '')}`}>
            <path d="M 50 5 L 90 18 C 90 70, 50 112, 50 112 C 50 112, 10 70, 10 18 Z" />
          </clipPath>
        </defs>

        {/* Outer Shield Outline */}
        <path
          d="M 50 2 L 93 16 C 93 74, 50 116, 50 116 C 50 116, 7 74, 7 16 Z"
          fill="#e2e8f0"
        />

        {/* Inner Shield Body */}
        <path
          d="M 50 5 L 90 18 C 90 70, 50 112, 50 112 C 50 112, 10 70, 10 18 Z"
          fill={`url(#rivalGrad_${name.replace(/\s+/g, '')})`}
        />

        {/* Diagonal Ribbon Accent */}
        <g clipPath={`url(#rivalClip_${name.replace(/\s+/g, '')})`}>
          <polygon points="0,0 45,0 100,80 100,120 55,120 0,40" fill="#ffffff" opacity="0.15" />
          <line x1="10" y1="40" x2="90" y2="40" stroke="#ffffff" strokeWidth="2" opacity="0.3" />
        </g>

        {/* Center Soccer Icon Silhouette */}
        <circle cx="50" cy="50" r="16" fill="#0f172a" opacity="0.4" />
        <circle cx="50" cy="50" r="14" fill="#ffffff" />
        <polygon points="50,42 56,46 54,54 46,54 44,46" fill={theme.accent} />

        {/* Initials Text */}
        <text
          x="50"
          y="88"
          textAnchor="middle"
          fill="#ffffff"
          fontWeight="900"
          fontSize="20"
          letterSpacing="0.8"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
        >
          {initials}
        </text>
      </svg>
    </div>
  );
};
