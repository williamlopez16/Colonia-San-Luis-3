import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type {
  Team,
  Match,
  Player,
  TacticalLineup,
  TacticalPlayerPosition,
  TacticalGameFormat,
  TacticalPitchStyle,
  TacticalPitchView,
  TacticalDrawing,
  TacticalRoleCategory,
} from '../types';
import {
  FORMATION_PRESETS,
  getPresetsByFormat,
  createDefaultTacticalLineup,
  applyFormationPreset,
  formatLineupWhatsAppMessage,
  renderTacticalLineupToCanvas,
  formatFirstAndLastName,
  downloadTacticalCanvasPng,
} from '../services/tacticalService';
import { saveMatch } from '../services/dataService';
import { copyToClipboard, formatMatchDate } from '../services/whatsappService';
import {
  Download,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Users,
  Shield,
  Move,
  PenTool,
  Save,
  ChevronDown,
  X,
  Sparkles,
  ArrowRight,
  Maximize2,
  Minimize2,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Plus,
  ArrowLeftRight,
} from 'lucide-react';

interface TacticalBoardViewProps {
  team: Team | null;
  matches: Match[];
  players: Player[];
  selectedMatchId?: string | null;
  onSelectMatch?: (matchId: string | null) => void;
}

type BoardMode = 'move' | 'draw';
type DrawTool = 'arrow' | 'pass' | 'line';

const DRAW_COLORS = [
  { name: 'Amarillo', hex: '#fef08a' },
  { name: 'Blanco', hex: '#ffffff' },
  { name: 'Rojo', hex: '#f87171' },
  { name: 'Azul', hex: '#60a5fa' },
  { name: 'Verde', hex: '#4ade80' },
];

const ROLES_OPTIONS: { role: string; category: TacticalRoleCategory; label: string }[] = [
  { role: 'POR', category: 'POR', label: 'Portero / Arquero' },
  { role: 'DFC', category: 'DEF', label: 'Defensa Central' },
  { role: 'LD', category: 'DEF', label: 'Lateral Derecho' },
  { role: 'LI', category: 'DEF', label: 'Lateral Izquierdo' },
  { role: 'CAD', category: 'DEF', label: 'Carrilero Derecho' },
  { role: 'CAI', category: 'DEF', label: 'Carrilero Izquierdo' },
  { role: 'LIB', category: 'DEF', label: 'Líbero / Cierre' },
  { role: 'MCD', category: 'MED', label: 'Volante Defensivo / Tapón' },
  { role: 'MC', category: 'MED', label: 'Mediocampista / Volante Mixto' },
  { role: 'MD', category: 'MED', label: 'Volante Derecho' },
  { role: 'MI', category: 'MED', label: 'Volante Izquierdo' },
  { role: 'MCO', category: 'MED', label: 'Mediapunta / Creador' },
  { role: 'ED', category: 'DEL', label: 'Extremo Derecho' },
  { role: 'EI', category: 'DEL', label: 'Extremo Izquierdo' },
  { role: 'DC', category: 'DEL', label: 'Delantero Centro / Nueve' },
  { role: 'PIV', category: 'DEL', label: 'Pívot' },
  { role: 'ALA', category: 'MED', label: 'Ala' },
];

export const TacticalBoardView: React.FC<TacticalBoardViewProps> = ({
  team,
  matches,
  players,
  selectedMatchId: initialSelectedMatchId,
  onSelectMatch,
}) => {
  // 1. Current Selected Match
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(initialSelectedMatchId || null);

  useEffect(() => {
    if (initialSelectedMatchId !== undefined) {
      setCurrentMatchId(initialSelectedMatchId);
    }
  }, [initialSelectedMatchId]);

  const activeMatch = useMemo(() => {
    if (!currentMatchId) return null;
    return matches.find((m) => m.id === currentMatchId) || null;
  }, [matches, currentMatchId]);

  // 2. Tactical Lineup State
  const [lineup, setLineup] = useState<TacticalLineup>(() => {
    if (activeMatch && activeMatch.lineup) {
      return activeMatch.lineup;
    }
    return createDefaultTacticalLineup(team?.id || 'default', activeMatch, players, 'Fútbol 11');
  });

  // Keep lineup in sync when switching match
  useEffect(() => {
    if (activeMatch && activeMatch.lineup) {
      setLineup(activeMatch.lineup);
    } else {
      setLineup(createDefaultTacticalLineup(team?.id || 'default', activeMatch, players, 'Fútbol 11'));
    }
    setSelectedPlayerId(null);
    setSwapSourcePlayerId(null);
  }, [currentMatchId, activeMatch, team?.id, players]);

  // 3. UI State
  const [boardMode, setBoardMode] = useState<BoardMode>('move');
  const [drawTool, setDrawTool] = useState<DrawTool>('arrow');
  const [drawColor, setDrawColor] = useState<string>(DRAW_COLORS[0].hex);
  const [isBallVisible, setIsBallVisible] = useState<boolean>(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [swapSourcePlayerId, setSwapSourcePlayerId] = useState<string | null>(null);
  const [isBenchOpen, setIsBenchOpen] = useState<boolean>(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState<boolean>(false);
  const [showRolePicker, setShowRolePicker] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References for drag, drawing, and fullscreen
  const containerRef = useRef<HTMLDivElement>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const canvasExportRef = useRef<HTMLCanvasElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const draggingItemIdRef = useRef<'ball' | string | null>(null);
  const currentDrawingPointsRef = useRef<{ x: number; y: number }[]>([]);
  const [currentTempPath, setCurrentTempPath] = useState<string | null>(null);

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      try {
        if (containerRef.current?.requestFullscreen) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } catch {
        // fallback
      }
      setIsFullscreen(true);
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {
        // fallback
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Available Presets for the current format
  const currentPresets = useMemo(() => {
    return getPresetsByFormat(lineup.gameFormat);
  }, [lineup.gameFormat]);

  // Selected player entity
  const selectedStarter = useMemo(() => {
    if (!selectedPlayerId) return null;
    return lineup.starters.find((p) => p.playerId === selectedPlayerId) || null;
  }, [selectedPlayerId, lineup.starters]);

  // 4. Pointer Events for Dragging Players and Ball
  const handlePitchPointerDown = (e: React.PointerEvent) => {
    if (boardMode === 'draw') {
      // Drawing Mode
      if (!pitchRef.current) return;
      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      currentDrawingPointsRef.current = [{ x, y }];
      activePointerIdRef.current = e.pointerId;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      setCurrentTempPath(`M ${(x / 100) * rect.width} ${(y / 100) * rect.height}`);
      return;
    }
  };

  const handlePitchPointerMove = (e: React.PointerEvent) => {
    if (boardMode === 'draw') {
      if (activePointerIdRef.current !== e.pointerId || !pitchRef.current) return;
      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

      currentDrawingPointsRef.current.push({ x, y });
      const pts = currentDrawingPointsRef.current;
      if (pts.length > 1) {
        const pathData = pts
          .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${(pt.x / 100) * rect.width} ${(pt.y / 100) * rect.height}`)
          .join(' ');
        setCurrentTempPath(pathData);
      }
      return;
    }

    // Move Mode
    if (draggingItemIdRef.current && activePointerIdRef.current === e.pointerId && pitchRef.current) {
      const rect = pitchRef.current.getBoundingClientRect();
      const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

      if (draggingItemIdRef.current === 'ball') {
        setLineup((prev) => ({
          ...prev,
          ball: { x, y },
        }));
      } else {
        const pId = draggingItemIdRef.current;
        setLineup((prev) => ({
          ...prev,
          starters: prev.starters.map((p) => (p.playerId === pId ? { ...p, x, y } : p)),
        }));
      }
    }
  };

  const handlePitchPointerUp = (e: React.PointerEvent) => {
    if (boardMode === 'draw') {
      if (activePointerIdRef.current === e.pointerId) {
        const pts = currentDrawingPointsRef.current;
        if (pts.length >= 2) {
          const newDrawing: TacticalDrawing = {
            id: `draw_${Date.now()}`,
            type: drawTool,
            points: pts,
            color: drawColor,
          };
          setLineup((prev) => ({
            ...prev,
            drawings: [...(prev.drawings || []), newDrawing],
          }));
        }
        currentDrawingPointsRef.current = [];
        setCurrentTempPath(null);
        activePointerIdRef.current = null;
      }
      return;
    }

    if (activePointerIdRef.current === e.pointerId) {
      activePointerIdRef.current = null;
      draggingItemIdRef.current = null;
    }
  };

  const startDraggingItem = (itemId: 'ball' | string, e: React.PointerEvent) => {
    if (boardMode !== 'move') return;
    e.stopPropagation();

    // If we're in swap mode and tap another starter
    if (swapSourcePlayerId && typeof itemId === 'string' && itemId !== swapSourcePlayerId && !itemId.startsWith('empty_')) {
      handleSwapStarters(swapSourcePlayerId, itemId);
      setSwapSourcePlayerId(null);
      return;
    }

    draggingItemIdRef.current = itemId;
    activePointerIdRef.current = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    if (itemId !== 'ball') {
      setSelectedPlayerId(itemId);
    }
  };

  // Swap positions between two starters
  const handleSwapStarters = (p1Id: string, p2Id: string) => {
    setLineup((prev) => {
      const p1 = prev.starters.find((p) => p.playerId === p1Id);
      const p2 = prev.starters.find((p) => p.playerId === p2Id);
      if (!p1 || !p2) return prev;

      return {
        ...prev,
        starters: prev.starters.map((p) => {
          if (p.playerId === p1Id) return { ...p, x: p2.x, y: p2.y, role: p2.role, roleCategory: p2.roleCategory };
          if (p.playerId === p2Id) return { ...p, x: p1.x, y: p1.y, role: p1.role, roleCategory: p1.roleCategory };
          return p;
        }),
      };
    });
    setSelectedPlayerId(null);
    setSwapSourcePlayerId(null);
  };

  // Substitute starter with player from bench
  const handleSubstitute = (starterId: string, benchPlayer: TacticalPlayerPosition) => {
    setLineup((prev) => {
      const starter = prev.starters.find((p) => p.playerId === starterId);
      if (!starter) return prev;

      // New starter inherits position coordinates and role
      const promotedStarter: TacticalPlayerPosition = {
        ...benchPlayer,
        x: starter.x,
        y: starter.y,
        role: starter.role,
        roleCategory: starter.roleCategory,
      };

      // Demoted player goes to bench if not empty
      const updatedBench = prev.bench.filter((p) => p.playerId !== benchPlayer.playerId);
      if (!starter.playerId.startsWith('empty_')) {
        updatedBench.unshift({
          ...starter,
          x: 0,
          y: 0,
          role: 'SUP',
        });
      }

      return {
        ...prev,
        starters: prev.starters.map((p) => (p.playerId === starterId ? promotedStarter : p)),
        bench: updatedBench,
      };
    });
    setSelectedPlayerId(null);
  };

  // Move a starter to the bench (creates empty placeholder slot)
  const handleSendToBench = (starterId: string) => {
    setLineup((prev) => {
      const starter = prev.starters.find((p) => p.playerId === starterId);
      if (!starter || starter.playerId.startsWith('empty_')) return prev;

      const placeholder: TacticalPlayerPosition = {
        playerId: `empty_${Date.now()}`,
        fullName: 'Vacante',
        jerseyNumber: starter.jerseyNumber,
        role: starter.role,
        roleCategory: starter.roleCategory,
        x: starter.x,
        y: starter.y,
      };

      return {
        ...prev,
        starters: prev.starters.map((p) => (p.playerId === starterId ? placeholder : p)),
        bench: [{ ...starter, x: 0, y: 0, role: 'SUP' }, ...prev.bench],
      };
    });
    setSelectedPlayerId(null);
  };

  // Toggle captain status
  const handleToggleCaptain = (playerId: string) => {
    setLineup((prev) => ({
      ...prev,
      starters: prev.starters.map((p) =>
        p.playerId === playerId ? { ...p, isCaptain: !p.isCaptain } : { ...p, isCaptain: false }
      ),
      bench: prev.bench.map((p) => (p.playerId === playerId ? { ...p, isCaptain: !p.isCaptain } : p)),
    }));
  };

  // Change role of selected player
  const handleChangeRole = (roleItem: { role: string; category: TacticalRoleCategory }) => {
    if (!selectedPlayerId) return;
    setLineup((prev) => ({
      ...prev,
      starters: prev.starters.map((p) =>
        p.playerId === selectedPlayerId
          ? { ...p, role: roleItem.role, roleCategory: roleItem.category }
          : p
      ),
    }));
    setShowRolePicker(false);
  };

  // Change Game Format (F11, F9, F8, F7, F5)
  const handleFormatChange = (newFormat: TacticalGameFormat) => {
    const presets = getPresetsByFormat(newFormat);
    const newPreset = presets[0];
    if (newPreset) {
      const updated = applyFormationPreset(lineup, newPreset);
      setLineup(updated);
    }
    setSelectedPlayerId(null);
  };

  // Change Formation Preset
  const handlePresetSelect = (presetId: string) => {
    const preset = FORMATION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      const updated = applyFormationPreset(lineup, preset);
      setLineup(updated);
    }
  };

  // Auto-fill empty starter slots with confirmed bench players
  const handleAutoFillWithConfirmed = () => {
    setLineup((prev) => {
      const emptySlots = prev.starters.filter((p) => p.playerId.startsWith('empty_'));
      if (emptySlots.length === 0 || prev.bench.length === 0) return prev;

      const availableBench = [...prev.bench];
      const newStarters = prev.starters.map((slot) => {
        if (slot.playerId.startsWith('empty_') && availableBench.length > 0) {
          const candidate = availableBench.shift()!;
          return {
            ...candidate,
            x: slot.x,
            y: slot.y,
            role: slot.role,
            roleCategory: slot.roleCategory,
          };
        }
        return slot;
      });

      return {
        ...prev,
        starters: newStarters,
        bench: availableBench,
      };
    });
  };

  // Save Lineup to Match & Firestore
  const handleSaveLineup = async () => {
    try {
      if (activeMatch) {
        await saveMatch({
          ...activeMatch,
          lineup,
        });
      } else {
        // Save in local storage for general team boards
        localStorage.setItem(`team_lineup_${team?.id}`, JSON.stringify(lineup));
      }
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving lineup:', err);
    }
  };

  // Copy WhatsApp Message
  const handleCopyWhatsApp = () => {
    const text = formatLineupWhatsAppMessage({
      team,
      match: activeMatch,
      lineup,
    });
    copyToClipboard(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2500);
  };

  // Undo last drawing
  const handleUndoDrawing = () => {
    setLineup((prev) => ({
      ...prev,
      drawings: (prev.drawings || []).slice(0, -1),
    }));
  };

  // Clear all drawings
  const handleClearDrawings = () => {
    setLineup((prev) => ({
      ...prev,
      drawings: [],
    }));
  };

  // Trigger HD Canvas Export Modal
  const handleOpenExportModal = () => {
    setIsExportModalOpen(true);
  };

  // Re-render canvas whenever export modal opens or lineup changes
  useEffect(() => {
    if (isExportModalOpen) {
      setIsExporting(true);
      const timer = setTimeout(async () => {
        if (canvasExportRef.current) {
          try {
            await renderTacticalLineupToCanvas(canvasExportRef.current, {
              team,
              match: activeMatch,
              lineup,
            });
          } catch (err) {
            console.error('Error rendering tactical canvas:', err);
          } finally {
            setIsExporting(false);
          }
        }
      }, 60);

      return () => clearTimeout(timer);
    }
  }, [isExportModalOpen, team, activeMatch, lineup]);

  // Download Canvas as PNG with guaranteed render & Blob handling
  const handleDownloadCanvasPng = async () => {
    const canvas = canvasExportRef.current;
    if (!canvas) return;

    try {
      setIsExporting(true);
      // Ensure canvas is populated with official dimensions
      if (canvas.width < 1000 || canvas.height < 1000) {
        await renderTacticalLineupToCanvas(canvas, {
          team,
          match: activeMatch,
          lineup,
        });
      }

      const safeMatchName = activeMatch ? `vs_${activeMatch.rival.replace(/\s+/g, '_')}` : 'Colonia_San_Luis';
      const filename = `Alineacion_${safeMatchName}_${lineup.formation}.png`;
      const ok = await downloadTacticalCanvasPng(canvas, filename);
      if (ok) {
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error downloading canvas PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Share Canvas image via Web Share API
  const handleShareCanvasPng = async () => {
    const canvas = canvasExportRef.current;
    if (!canvas) return;
    try {
      setIsExporting(true);
      if (canvas.width < 1000 || canvas.height < 1000) {
        await renderTacticalLineupToCanvas(canvas, { team, match: activeMatch, lineup });
      }

      canvas.toBlob(async (blob) => {
        setIsExporting(false);
        if (!blob || blob.size < 1000) {
          handleDownloadCanvasPng();
          return;
        }
        const file = new File([blob], `Alineacion_${lineup.formation}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Alineación Oficial - ${team?.name || 'Colonia San Luis F.C'}`,
            text: `Alineación para el partido vs ${activeMatch?.rival || 'Rival'} (${lineup.formation})`,
            files: [file],
          });
        } else {
          handleDownloadCanvasPng();
        }
      }, 'image/png', 0.95);
    } catch {
      setIsExporting(false);
      handleDownloadCanvasPng();
    }
  };

  // Render SVG Drawings Overlay
  const renderDrawingsSvg = () => {
    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          {DRAW_COLORS.map((c) => (
            <marker
              key={c.hex}
              id={`arrowhead-${c.hex.replace('#', '')}`}
              markerWidth="8"
              markerHeight="6"
              refX="6"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill={c.hex} />
            </marker>
          ))}
        </defs>

        {/* Existing drawings */}
        {lineup.drawings?.map((d) => {
          if (d.points.length < 2) return null;
          const pathData = d.points
            .map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.y}%`)
            .join(' ');
          const isPass = d.type === 'pass';
          const markerId = `arrowhead-${(d.color || '#fef08a').replace('#', '')}`;

          return (
            <path
              key={d.id}
              d={pathData}
              fill="none"
              stroke={d.color || '#fef08a'}
              strokeWidth={d.type === 'line' ? 3 : 3.5}
              strokeDasharray={isPass ? '8 6' : undefined}
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={d.type !== 'line' ? `url(#${markerId})` : undefined}
            />
          );
        })}

        {/* Currently dragging temp path */}
        {currentTempPath && (
          <path
            d={currentTempPath}
            fill="none"
            stroke={drawColor}
            strokeWidth={3.5}
            strokeDasharray={drawTool === 'pass' ? '8 6' : undefined}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`w-full mx-auto px-2 sm:px-4 py-4 space-y-4 animate-fade-in transition-all ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 text-white overflow-y-auto max-w-none pb-12'
          : 'max-w-6xl text-gray-900 pb-20'
      }`}
    >
      {/* Floating Exit Fullscreen Button */}
      {isFullscreen && (
        <button
          type="button"
          onClick={handleToggleFullscreen}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 text-amber-300 border border-amber-400/50 shadow-2xl backdrop-blur-md font-bold text-xs hover:bg-slate-800 cursor-pointer active:scale-95 transition"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Salir Pantalla Completa (Esc)</span>
        </button>
      )}

      {/* 1. Header Control Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-gray-900">
        {/* Left: Match Selector & Title */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
            <span className="text-xl">📋</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl text-gray-900 tracking-tight">
                Pizarra Táctica & Alineaciones
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Tactical Pro
              </span>
            </div>

            {/* Match dropdown picker */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 font-semibold">Partido:</span>
              <select
                value={currentMatchId || ''}
                onChange={(e) => {
                  const val = e.target.value ? e.target.value : null;
                  setCurrentMatchId(val);
                  onSelectMatch?.(val);
                }}
                className="text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="">📌 Pizarra Libre (Toda la plantilla)</option>
                {matches.map((m) => {
                  const confirmedCount = m.callups?.filter((c) => c.status === 'Confirmado').length || 0;
                  return (
                    <option key={m.id} value={m.id}>
                      vs {m.rival} • {formatMatchDate(m.date)} ({confirmedCount} confirmados)
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 justify-end">
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 shadow-xs ${
              isFullscreen
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                : 'bg-slate-900 hover:bg-black text-white'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver pizarra en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-slate-950" /> : <Maximize2 className="w-4 h-4 text-emerald-400" />}
            <span>{isFullscreen ? 'Salir Pantalla Completa' : 'Pantalla Completa'}</span>
          </button>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSaveLineup}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black shadow-xs transition cursor-pointer active:scale-95 ${
              isSavedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-800 hover:bg-emerald-900 text-white'
            }`}
            title="Guarda la alineación y posiciones para este partido"
          >
            {isSavedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSavedSuccess ? '¡Guardada!' : 'Guardar'}</span>
          </button>

          {/* Copy WhatsApp */}
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer active:scale-95 shadow-2xs"
            title="Copiar alineación formateada para WhatsApp"
          >
            {copiedWhatsApp ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-emerald-700" />}
            <span>{copiedWhatsApp ? '¡Copiado!' : 'WhatsApp'}</span>
          </button>

          {/* HD Canvas Export Button */}
          <button
            type="button"
            onClick={handleOpenExportModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs transition cursor-pointer active:scale-95"
            title="Descargar o compartir imagen oficial de la alineación"
          >
            <Download className="w-4 h-4" />
            <span>Ficha Oficial HD</span>
          </button>
        </div>
      </div>

      {/* 2. Tactical Controls Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Game Format Selector */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
          {(['Fútbol 11', 'Fútbol 9', 'Fútbol 8', 'Fútbol 7', 'Fútbol 5'] as TacticalGameFormat[]).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleFormatChange(fmt)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                lineup.gameFormat === fmt
                  ? 'bg-emerald-800 text-white shadow-xs font-black'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Formation Preset Picker */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-500 text-xs">Esquema:</span>
          <select
            value={currentPresets.find((p) => p.name.startsWith(lineup.formation))?.id || currentPresets[0]?.id}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="bg-gray-50 border border-gray-200 text-gray-900 font-extrabold text-xs rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            {currentPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Quick Auto-fill button */}
          <button
            type="button"
            onClick={handleAutoFillWithConfirmed}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold transition cursor-pointer"
            title="Asignar automáticamente jugadores de la banca a posiciones vacías"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Autocompletar</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Board Mode Toggle: Move vs Draw */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setBoardMode('move')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                boardMode === 'move' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Fichas</span>
            </button>

            <button
              type="button"
              onClick={() => setBoardMode('draw')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                boardMode === 'draw' ? 'bg-white text-emerald-950 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Pizarra</span>
            </button>
          </div>

          {/* Quick Fullscreen Button */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              isFullscreen
                ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isFullscreen ? 'Salir de pantalla completa (Esc)' : 'Ver pizarra en pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-slate-950" /> : <Maximize2 className="w-3.5 h-3.5 text-emerald-700" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Salir' : 'Pantalla Completa'}</span>
          </button>
        </div>
      </div>

      {/* 3. Drawing Tools Bar (only in Draw Mode) */}
      {boardMode === 'draw' && (
        <div className="bg-emerald-950 text-white rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between flex-wrap gap-2 animate-fade-in text-xs">
          {/* Tool types */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mr-1">Trazos:</span>
            <button
              type="button"
              onClick={() => setDrawTool('arrow')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                drawTool === 'arrow' ? 'bg-emerald-600 text-white' : 'bg-emerald-900/80 text-emerald-200'
              }`}
              title="Flecha de carrera / desmarque"
            >
              ↗️ Carrera
            </button>
            <button
              type="button"
              onClick={() => setDrawTool('pass')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                drawTool === 'pass' ? 'bg-emerald-600 text-white' : 'bg-emerald-900/80 text-emerald-200'
              }`}
              title="Pase de balón con línea discontinua"
            >
              {'┈> Pase'}
            </button>
            <button
              type="button"
              onClick={() => setDrawTool('line')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                drawTool === 'line' ? 'bg-emerald-600 text-white' : 'bg-emerald-900/80 text-emerald-200'
              }`}
              title="Línea de cobertura / presión"
            >
              ━ Línea
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mr-1">Color:</span>
            {DRAW_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setDrawColor(c.hex)}
                style={{ backgroundColor: c.hex }}
                className={`w-6 h-6 rounded-full transition cursor-pointer border ${
                  drawColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-80'
                }`}
                title={c.name}
              />
            ))}
          </div>

          {/* Undo and Clear */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={handleUndoDrawing}
              disabled={!lineup.drawings || lineup.drawings.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-900 hover:bg-emerald-800 disabled:opacity-40 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>
            <button
              type="button"
              onClick={handleClearDrawings}
              disabled={!lineup.drawings || lineup.drawings.length === 0}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 disabled:opacity-40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Interactive Pitch & Bench Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: The Interactive Football Pitch (8 cols on large screens) */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Pitch Outer Frame with Realistic Turf Design */}
          <div
            ref={pitchRef}
            onPointerDown={handlePitchPointerDown}
            onPointerMove={handlePitchPointerMove}
            onPointerUp={handlePitchPointerUp}
            className={`relative w-full aspect-[1/1.38] mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-900 select-none touch-none cursor-crosshair bg-emerald-900 transition-all ${
              isFullscreen ? 'max-w-[700px]' : 'max-w-[560px]'
            }`}
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, #15803d, #15803d 38px, #166534 38px, #166534 76px)`,
            }}
          >
            {/* SVG Pitch Markings & Lines */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
              viewBox="0 0 100 138"
              preserveAspectRatio="none"
            >
              {/* Field Boundary */}
              <rect x="5" y="5" width="90" height="128" fill="none" stroke="#ffffff" strokeWidth="0.8" />

              {/* Half-way line */}
              <line x1="5" y1="69" x2="95" y2="69" stroke="#ffffff" strokeWidth="0.8" />

              {/* Center Circle & Spot */}
              <circle cx="50" cy="69" r="14" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="50" cy="69" r="0.9" fill="#ffffff" />

              {/* Top Penalty Area & Goal */}
              <rect x="25" y="5" width="50" height="22" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <rect x="36" y="5" width="28" height="9" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="50" cy="19" r="0.8" fill="#ffffff" />
              <path d="M 39 27 A 11 11 0 0 0 61 27" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              {/* Top Goal Net */}
              <rect x="42" y="2.5" width="16" height="2.5" fill="rgba(255,255,255,0.2)" stroke="#ffffff" strokeWidth="0.6" />

              {/* Bottom Penalty Area & Goal */}
              <rect x="25" y="111" width="50" height="22" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <rect x="36" y="124" width="28" height="9" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <circle cx="50" cy="119" r="0.8" fill="#ffffff" />
              <path d="M 39 111 A 11 11 0 0 1 61 111" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              {/* Bottom Goal Net */}
              <rect x="42" y="133" width="16" height="2.5" fill="rgba(255,255,255,0.2)" stroke="#ffffff" strokeWidth="0.6" />

              {/* Corner Arcs */}
              <path d="M 5 8 A 3 3 0 0 0 8 5" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <path d="M 92 5 A 3 3 0 0 0 95 8" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <path d="M 5 130 A 3 3 0 0 1 8 133" fill="none" stroke="#ffffff" strokeWidth="0.8" />
              <path d="M 92 133 A 3 3 0 0 1 95 130" fill="none" stroke="#ffffff" strokeWidth="0.8" />
            </svg>

            {/* Club Escudo Watermark in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
              <img
                src={(team?.logoUrl && !team.logoUrl.endsWith('.jpg')) ? team.logoUrl : '/team_logo.png'}
                alt=""
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/team_logo.png';
                }}
              />
            </div>

            {/* SVG Tactical Drawing Layer */}
            {renderDrawingsSvg()}

            {/* Tactical Ball Token */}
            {isBallVisible && lineup.ball && (
              <div
                onPointerDown={(e) => startDraggingItem('ball', e)}
                style={{
                  left: `${lineup.ball.x}%`,
                  top: `${lineup.ball.y}%`,
                }}
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                title="Balón táctico (arrástralo a cualquier posición)"
              >
                <div className="w-8 h-8 rounded-full bg-white shadow-lg border-2 border-black flex items-center justify-center text-xs">
                  ⚽
                </div>
              </div>
            )}

            {/* Starters Player Tokens */}
            {lineup.starters.map((player) => {
              const isSelected = selectedPlayerId === player.playerId;
              const isSwapSource = swapSourcePlayerId === player.playerId;
              const isGK = player.roleCategory === 'POR' || player.role === 'POR';
              const isEmpty = player.playerId.startsWith('empty_');

              return (
                <div
                  key={player.playerId}
                  onPointerDown={(e) => startDraggingItem(player.playerId, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (swapSourcePlayerId && swapSourcePlayerId !== player.playerId) {
                      handleSwapStarters(swapSourcePlayerId, player.playerId);
                    } else {
                      setSelectedPlayerId(player.playerId);
                    }
                  }}
                  style={{
                    left: `${player.x}%`,
                    top: `${player.y}%`,
                  }}
                  className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing flex flex-col items-center group transition-transform ${
                    isSelected ? 'scale-110 z-30' : 'hover:scale-105'
                  }`}
                >
                  {/* Circular Token - Enlarged for touch accessibility and prominence */}
                  <div
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl border-3 transition-all ${
                      isSwapSource
                        ? 'ring-4 ring-amber-400 border-white bg-amber-600 animate-pulse scale-105'
                        : isSelected
                        ? 'ring-4 ring-yellow-400 border-white scale-105'
                        : 'border-white/95'
                    } ${
                      isEmpty
                        ? 'bg-emerald-950/80 border-dashed border-emerald-300 text-emerald-200'
                        : isGK
                        ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-amber-950 font-black'
                        : 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white font-black'
                    }`}
                  >
                    {/* Player Photo or Big Jersey Number */}
                    {player.photoUrl && !isEmpty ? (
                      <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
                        <img
                          src={player.photoUrl}
                          alt={player.fullName}
                          className="w-full h-full object-cover rounded-full"
                        />
                        {/* Mini dorsal badge */}
                        <div
                          className={`absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full text-[11px] sm:text-xs font-black flex items-center justify-center border-2 border-white shadow-md ${
                            isGK ? 'bg-amber-400 text-amber-950' : 'bg-emerald-700 text-white'
                          }`}
                        >
                          {player.jerseyNumber}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-md">
                        {isEmpty ? '?' : player.jerseyNumber}
                      </span>
                    )}

                    {/* Captain Armband Badge */}
                    {player.isCaptain && !isEmpty && (
                      <div className="absolute -top-1.5 -left-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center border-2 border-white shadow-md">
                        C
                      </div>
                    )}
                  </div>

                  {/* Player Name Pill (Primer Nombre y Primer Apellido bien visible) */}
                  <div className="mt-1 flex flex-col items-center pointer-events-none">
                    <span
                      className={`px-3 py-1 sm:py-1.5 rounded-xl text-xs sm:text-[13px] font-black max-w-[145px] sm:max-w-[175px] truncate shadow-2xl text-center border-2 leading-tight tracking-tight ${
                        isSelected
                          ? 'bg-yellow-400 text-yellow-950 border-yellow-200 ring-2 ring-yellow-400/80 shadow-2xl'
                          : 'bg-slate-950/95 text-white border-emerald-400/80 shadow-2xl shadow-black/80'
                      }`}
                      title={player.fullName}
                    >
                      {formatFirstAndLastName(player.fullName)}
                    </span>

                    <span
                      className={`mt-0.5 text-[10px] sm:text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded-md drop-shadow-md ${
                        isGK ? 'bg-amber-400 text-amber-950 font-black' : 'bg-emerald-900 text-emerald-200 border border-emerald-500/40'
                      }`}
                    >
                      {player.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Helper under pitch */}
          <div className="mt-2 text-center text-xs text-gray-500 font-semibold flex items-center gap-2">
            <span>💡 Arrastra jugadores libremente</span>
            <span>•</span>
            <span>Toca para sustituir o cambiar rol</span>
          </div>
        </div>

        {/* Right Column: Selected Player Action Panel + Bench Drawer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Selected Player Quick Actions Card */}
          {selectedStarter && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 animate-fade-in space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white ${
                      selectedStarter.roleCategory === 'POR' ? 'bg-amber-500' : 'bg-emerald-800'
                    }`}
                  >
                    {selectedStarter.jerseyNumber}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 leading-tight" title={selectedStarter.fullName}>
                      {formatFirstAndLastName(selectedStarter.fullName)}
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Posición: {selectedStarter.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                {/* Swap with another Starter */}
                <button
                  type="button"
                  onClick={() => {
                    setSwapSourcePlayerId(selectedStarter.playerId);
                    setSelectedPlayerId(null);
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition cursor-pointer"
                  title="Toca a otro titular para intercambiar posiciones"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-gray-600" />
                  <span>Intercambiar</span>
                </button>

                {/* Send to Bench */}
                <button
                  type="button"
                  onClick={() => handleSendToBench(selectedStarter.playerId)}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 transition cursor-pointer"
                  title="Mover este titular a la banca de suplentes"
                >
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  <span>A la Banca</span>
                </button>

                {/* Toggle Captain */}
                <button
                  type="button"
                  onClick={() => handleToggleCaptain(selectedStarter.playerId)}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border transition cursor-pointer ${
                    selectedStarter.isCaptain
                      ? 'bg-amber-500 text-amber-950 border-amber-600 font-black'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>{selectedStarter.isCaptain ? 'Es Capitán ©' : 'Hacer Capitán'}</span>
                </button>

                {/* Change Role */}
                <button
                  type="button"
                  onClick={() => setShowRolePicker(!showRolePicker)}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition cursor-pointer"
                >
                  <span>🏷️ Cambiar Rol</span>
                </button>
              </div>

              {/* Role Picker Drawer */}
              {showRolePicker && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1.5">
                    Selecciona rol en cancha:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto py-1">
                    {ROLES_OPTIONS.map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => handleChangeRole(r)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition text-left cursor-pointer ${
                          selectedStarter.role === r.role
                            ? 'bg-emerald-800 text-white'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                        }`}
                      >
                        <span className="font-black">{r.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Swap mode instruction banner */}
          {swapSourcePlayerId && (
            <div className="bg-amber-500 text-amber-950 p-3 rounded-2xl font-bold text-xs flex items-center justify-between shadow-md animate-pulse">
              <span>👉 Toca ahora a cualquier otro jugador en la cancha para intercambiar lugares</span>
              <button
                type="button"
                onClick={() => setSwapSourcePlayerId(null)}
                className="bg-amber-950 text-white px-2 py-0.5 rounded-lg ml-2"
              >
                Cancelar
              </button>
            </div>
          )}

          {/* Bench / Substitutes Panel */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪑</span>
                <h3 className="font-extrabold text-sm text-gray-900">
                  Banca de Suplentes ({lineup.bench.filter((p) => !p.playerId.startsWith('empty_')).length})
                </h3>
              </div>

              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Titulares: {lineup.starters.filter((p) => !p.playerId.startsWith('empty_')).length}
              </span>
            </div>

            {/* List of bench players */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {lineup.bench.filter((p) => !p.playerId.startsWith('empty_')).length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  <p>No hay jugadores en la banca.</p>
                  <p className="text-[11px] mt-1">Los convocados restantes aparecerán aquí.</p>
                </div>
              ) : (
                lineup.bench
                  .filter((p) => !p.playerId.startsWith('empty_'))
                  .map((player) => {
                    const isCandidateForSelected = !!selectedStarter;

                    return (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/60 border border-gray-100 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Photo or Dorsal */}
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center flex-shrink-0 border border-emerald-200 overflow-hidden">
                            {player.photoUrl ? (
                              <img src={player.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              `#${player.jerseyNumber}`
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-extrabold text-xs text-gray-900 truncate" title={player.fullName}>
                              {formatFirstAndLastName(player.fullName)}
                            </p>
                            <span className="text-[10px] text-gray-500 font-semibold">
                              Dorsal #{player.jerseyNumber}
                            </span>
                          </div>
                        </div>

                        {/* Substitution Button */}
                        {isCandidateForSelected ? (
                          <button
                            type="button"
                            onClick={() => handleSubstitute(selectedStarter.playerId, player)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-2xs transition cursor-pointer flex items-center gap-1"
                            title={`Sustituir a ${selectedStarter.fullName} por ${player.fullName}`}
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Entrar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Find first empty slot or substitute last
                              const emptySlot = lineup.starters.find((s) => s.playerId.startsWith('empty_'));
                              if (emptySlot) {
                                handleSubstitute(emptySlot.playerId, player);
                              } else if (lineup.starters.length > 0) {
                                setSelectedPlayerId(lineup.starters[lineup.starters.length - 1].playerId);
                              }
                            }}
                            className="px-2 py-1 rounded-lg bg-gray-200 hover:bg-emerald-100 text-gray-800 hover:text-emerald-900 font-bold text-[11px] transition cursor-pointer"
                          >
                            <span>Alinear</span>
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Ball visibility toggle */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <span>⚽ Balón táctico en cancha</span>
            </span>
            <input
              type="checkbox"
              checked={isBallVisible}
              onChange={(e) => setIsBallVisible(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. HD Canvas Export Modal */}
      {isExportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsExportModalOpen(false);
          }}
        >
          <div className="bg-emerald-950 text-white rounded-3xl p-5 sm:p-6 w-full max-w-2xl border border-emerald-600/40 shadow-2xl space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📸</span>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    Ficha Oficial de Alineación HD
                  </h2>
                  <p className="text-xs text-emerald-300 font-semibold">
                    Generada con el escudo oficial y lista para descargar o compartir
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-emerald-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Preview */}
            <div className="relative flex justify-center bg-black/50 p-3 rounded-2xl overflow-hidden border border-emerald-900/60 min-h-[360px]">
              {isExporting && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs text-emerald-300 font-bold text-sm">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <span>Generando ficha oficial HD...</span>
                </div>
              )}
              <canvas
                ref={canvasExportRef}
                className="max-h-[520px] w-auto rounded-xl shadow-2xl object-contain"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-900/70 hover:bg-emerald-800 text-emerald-200 text-xs font-bold"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareCanvasPng}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-black shadow-md cursor-pointer transition active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Compartir</span>
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadCanvasPng}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-black shadow-md cursor-pointer transition active:scale-95"
                >
                  {downloadSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>¡Descargada con éxito!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Descargar Imagen PNG</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
