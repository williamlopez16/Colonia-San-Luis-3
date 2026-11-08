import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Team, Match, Callup } from '../types';
import {
  BILLBOARD_TEMPLATES,
  renderPublicidadToCanvas,
  type BillboardFormat,
} from '../services/billboardService';
import {
  generateAIPrompts,
  DESIGN_MODES,
  CREATIVE_CONCEPTS_LIBRARY,
  getPromptHistory,
  clearPromptHistory,
  type CreativeDesignMode,
  type PromptHistoryEntry,
} from '../services/aiPromptService';
import { copyToClipboard } from '../services/whatsappService';
import { useAccessMode } from '../context/AccessModeContext';
import {
  Sparkles,
  Download,
  Share2,
  Check,
  X,
  FileText,
  Globe,
  Image as ImageIcon,
  Users,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  RefreshCw,
  Camera,
  Sun,
  Palette,
  Layout,
  History,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Sliders,
  Upload,
  Layers,
  Wand2,
  Copy,
} from 'lucide-react';

interface PublicidadModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
  initialTab?: 'graphic' | 'prompts';
}

export const PublicidadModal: React.FC<PublicidadModalProps> = ({
  team,
  match,
  onClose,
  initialTab = 'graphic',
}) => {
  const { isAdminMode } = useAccessMode();

  // Top-level View Mode: 'graphic' (Cartelera HD) vs 'prompts' (Director Creativo IA)
  const [activeMainTab, setActiveMainTab] = useState<'graphic' | 'prompts'>(initialTab);

  // Graphic Designer States
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const [templateIndex, setTemplateIndex] = useState<number>(0);
  const [format, setFormat] = useState<BillboardFormat>('feed');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<'procedural' | 'custom_photo'>('procedural');
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedSquad, setCopiedSquad] = useState<boolean>(false);

  // AI Prompt Studio States
  const [activeDesignMode, setActiveDesignMode] = useState<CreativeDesignMode>('MATCHDAY');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [aiStyleTab, setAiStyleTab] = useState<'poster' | 'midjourney' | 'background' | 'roster'>('poster');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const [showConceptPicker, setShowConceptPicker] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<PromptHistoryEntry[]>([]);

  // Roster Filter: 'confirmed' (Solo Confirmados) vs 'all' (Todos los Convocados)
  const [rosterFilter, setRosterFilter] = useState<'confirmed' | 'all'>(() => {
    const hasConfirmed = match.callups.some((c) => c.status === 'Confirmado');
    return hasConfirmed ? 'confirmed' : 'all';
  });

  useEffect(() => {
    if (!isAdminMode) {
      onClose();
    }
  }, [isAdminMode, onClose]);

  // Load history on mount
  useEffect(() => {
    setHistoryList(getPromptHistory(team?.id));
  }, [team?.id]);

  // Effective players to display and include in publicity
  const activeCallups = useMemo(() => {
    if (rosterFilter === 'confirmed') {
      const confirmed = match.callups.filter((c) => c.status === 'Confirmado');
      return confirmed.length > 0 ? confirmed : match.callups;
    }
    return match.callups;
  }, [match.callups, rosterFilter]);

  const confirmedCount = useMemo(
    () => match.callups.filter((c) => c.status === 'Confirmado').length,
    [match.callups]
  );
  const totalCount = match.callups.length;

  const currentTemplate = BILLBOARD_TEMPLATES[templateIndex % BILLBOARD_TEMPLATES.length];

  // AI Prompts Bundle (Generated with activeCallups)
  const promptsBundle = useMemo(
    () =>
      generateAIPrompts(team, match, activeCallups, {
        mode: activeDesignMode,
        conceptId: selectedConceptId || undefined,
        recordHistory: true,
      }),
    [team, match, activeCallups, activeDesignMode, selectedConceptId]
  );

  useEffect(() => {
    setHistoryList(getPromptHistory(team?.id));
  }, [promptsBundle.concept.id, activeDesignMode, team?.id]);

  const currentAIPromptText = useMemo(() => {
    if (aiStyleTab === 'poster') return promptsBundle.fullPosterPromptEs;
    if (aiStyleTab === 'midjourney') return promptsBundle.midjourneyPromptEn;
    if (aiStyleTab === 'background') return promptsBundle.cleanBackgroundPromptEs;
    return promptsBundle.squadTextFormatted;
  }, [aiStyleTab, promptsBundle]);

  // Re-render canvas whenever graphic options or activeCallups change
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current || !team) return;
      setIsRendering(true);

      try {
        const photoToUse = bgMode === 'custom_photo' ? selectedPhotoUrl : null;
        await renderPublicidadToCanvas(canvasRef.current, team, match, activeCallups, {
          templateIndex,
          format,
          bgPhotoUrl: photoToUse,
        });
      } catch (err) {
        console.error('Error renderizando pieza de publicidad:', err);
      } finally {
        if (!isCancelled) setIsRendering(false);
      }
    };

    render();

    return () => {
      isCancelled = true;
    };
  }, [templateIndex, format, selectedPhotoUrl, bgMode, team, match, activeCallups]);

  // Copy Squad List formatted
  const handleCopySquadList = async () => {
    const success = await copyToClipboard(promptsBundle.squadTextFormatted);
    if (success) {
      setCopiedSquad(true);
      setTimeout(() => setCopiedSquad(false), 2500);
    }
  };

  // Copy AI Prompt
  const handleCopyAIPrompt = async () => {
    const success = await copyToClipboard(currentAIPromptText);
    if (success) {
      setCopiedPrompt('¡Prompt publicitario copiado con éxito! Listo para pegar en tu IA favorita.');
      setTimeout(() => setCopiedPrompt(null), 3800);
    }
  };

  // Generate new creative proposal (rotates concept)
  const handleGenerateNewProposal = () => {
    setIsRegenerating(true);
    const available = CREATIVE_CONCEPTS_LIBRARY.filter((c) => c.id !== promptsBundle.concept.id);
    const randomPick = available[Math.floor(Math.random() * available.length)];
    setSelectedConceptId(randomPick.id);

    setTimeout(() => {
      setIsRegenerating(false);
      setCopiedPrompt(`Dirección artística activada: "${randomPick.title}"`);
      setTimeout(() => setCopiedPrompt(null), 3000);
    }, 250);
  };

  // Download Canvas as PNG
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeRival = (match.rival || 'Rival').replace(/\s+/g, '_');
      link.download = `Publicidad_${match.date}_vs_${safeRival}_${format}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error descargando imagen:', err);
    }
  };

  // Share via Web Share API
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const safeRival = (match.rival || 'Rival').replace(/\s+/g, '_');
        const file = new File([blob], `Publicidad_vs_${safeRival}.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Publicidad Oficial: ${team?.name} vs ${match.rival}`,
            text: `¡Día de partido! ${team?.name} vs ${match.rival} • ${match.date} ${match.time || ''}`,
            files: [file],
          });
        } else {
          handleDownload();
        }
      }, 'image/png');
    } catch (err) {
      console.error('Error compartiendo imagen:', err);
      handleDownload();
    }
  };

  // Handle uploading AI generated image as custom photo background
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setSelectedPhotoUrl(res);
        setBgMode('custom_photo');
        setActiveMainTab('graphic'); // Switch to graphic tab to see result immediately
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto flex flex-col max-h-[94vh]">
        
        {/* ===================================================================
            1. UNIFIED MODAL HEADER: PUBLICIDAD
           =================================================================== */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-black/40 border border-white/20">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  Estudio de Publicidad Oficial
                </span>
                <span className="text-xs text-emerald-300 font-semibold hidden sm:inline">
                  {team?.name || 'Colonia San Luis F.C.'}
                </span>
              </div>
              <h3 className="font-black text-base sm:text-xl leading-tight mt-0.5 text-white tracking-tight">
                PUBLICIDAD • {match.tournamentName || 'Torneo Oficial'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ===================================================================
            2. MATCH SUMMARY BAR
           =================================================================== */}
        <div className="bg-emerald-950/90 text-white border-b border-emerald-800/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2 font-bold truncate">
            <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-white font-black">{team?.name || 'Colonia San Luis F.C.'}</span>
            <span className="text-amber-400 font-black">VS</span>
            <span className="text-emerald-300 font-black">{match.rival}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-emerald-200">
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {match.date}
            </span>
            {match.time && (
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {match.time}
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold hidden md:inline">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              {match.location || 'Escenario deportivo'}
            </span>
            <span className="bg-emerald-900/90 text-amber-300 px-2 py-0.5 rounded-full font-black text-[10px] border border-emerald-700/60">
              {activeCallups.length} Convocados
            </span>
          </div>
        </div>

        {/* ===================================================================
            3. MAIN SUITE NAVIGATION (Cartelera HD vs Prompts IA vs Montar Foto)
           =================================================================== */}
        <div className="bg-gray-100 border-b border-gray-200 p-2 sm:px-4 sm:py-2.5 flex items-center justify-between gap-2 flex-shrink-0 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainTab('graphic')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 ${
                activeMainTab === 'graphic'
                  ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-500/50'
                  : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-amber-300" />
              <span>Cartelera Oficial HD (Diseñador)</span>
            </button>

            <button
              onClick={() => setActiveMainTab('prompts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs active:scale-95 ${
                activeMainTab === 'prompts'
                  ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-500/50'
                  : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200'
              }`}
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>Prompts Publicitarios IA (Director Creativo)</span>
            </button>
          </div>

          {/* Quick upload trigger */}
          <div className="flex items-center gap-1">
            <input
              ref={aiFileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="publicidad-photo-upload"
            />
            <label
              htmlFor="publicidad-photo-upload"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-extrabold text-xs border border-emerald-300 cursor-pointer shadow-2xs transition active:scale-95"
              title="Cargar fondo generado por IA o fotografía de estadio"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              <span>Montar Foto IA</span>
            </label>
          </div>
        </div>

        {/* ===================================================================
            4. SUBTAB 1: CARTELERA OFICIAL HD (DISEÑADOR GRÁFICO DE ÉLITE)
           =================================================================== */}
        {activeMainTab === 'graphic' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/60 space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Canvas Preview in Live Frame */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="relative bg-black rounded-3xl p-3 shadow-2xl border-4 border-slate-900 overflow-hidden flex items-center justify-center max-h-[64vh]">
                  {isRendering && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20 gap-2">
                      <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-black tracking-wide text-emerald-300">
                        Renderizando Publicidad HD...
                      </span>
                    </div>
                  )}

                  <canvas
                    ref={canvasRef}
                    className="max-h-[58vh] max-w-full rounded-2xl object-contain shadow-2xl"
                  />
                </div>

                <p className="text-[11px] text-gray-500 font-bold mt-2 text-center">
                  Resolución nativa: {format === 'story' ? '1080 × 1920 px (9:16 Historia)' : '1080 × 1350 px (4:5 Post)'}
                </p>
              </div>

              {/* Right Column: Controls, Presets & Actions */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* Format Switcher */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-2">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-wider block">
                    Formato de Publicación:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormat('feed')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                        format === 'feed'
                          ? 'bg-emerald-800 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>Post / Feed (4:5)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat('story')}
                      className={`py-2 px-3 rounded-xl text-xs font-black transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                        format === 'story'
                          ? 'bg-emerald-800 text-white border-emerald-600 shadow-xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Historia / Estado (9:16)</span>
                    </button>
                  </div>
                </div>

                {/* Presets & Background Selection */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Estilo Visual de Publicidad:
                    </span>
                    {bgMode === 'custom_photo' && (
                      <button
                        type="button"
                        onClick={() => {
                          setBgMode('procedural');
                          setSelectedPhotoUrl(null);
                        }}
                        className="text-[10px] font-black text-amber-700 hover:underline"
                      >
                        Restaurar Preset
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    {BILLBOARD_TEMPLATES.map((tmpl, idx) => {
                      const isSelected = bgMode === 'procedural' && templateIndex === idx;
                      return (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => {
                            setTemplateIndex(idx);
                            setBgMode('procedural');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition cursor-pointer border flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-950 border-emerald-600 ring-2 ring-emerald-500/30 font-black'
                              : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200 font-bold'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span>{tmpl.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-black">
                                {tmpl.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 font-normal line-clamp-1 mt-0.5">
                              {tmpl.description}
                            </p>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Upload custom AI photo backdrop */}
                  <div className="pt-2 border-t border-gray-100">
                    <label
                      htmlFor="publicidad-photo-upload"
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-800 hover:from-purple-800 hover:to-emerald-900 text-white text-xs font-black cursor-pointer shadow-xs transition active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-300" />
                      <span>{selectedPhotoUrl ? 'Cambiar Foto / Fondo IA' : 'Montar Fondo Generado por IA'}</span>
                    </label>
                  </div>
                </div>

                {/* Roster & Squad Control Card in Publicity */}
                <div className="bg-white p-4 rounded-2xl border-2 border-emerald-500/30 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                        <Users className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-gray-900 uppercase tracking-wider block">
                          Nómina en Publicidad
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold">
                          {activeCallups.length} futbolistas en el póster
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-black border border-emerald-300">
                      Oficial
                    </span>
                  </div>

                  {/* Selector de filtro de convocados: Solo confirmados vs Todos */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRosterFilter('confirmed')}
                      className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                        rosterFilter === 'confirmed'
                          ? 'bg-emerald-800 text-white border-emerald-700 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span>Confirmados ({confirmedCount})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRosterFilter('all')}
                      className={`py-1.5 px-2.5 rounded-xl text-[11px] font-black transition cursor-pointer border flex items-center justify-center gap-1.5 ${
                        rosterFilter === 'all'
                          ? 'bg-emerald-800 text-white border-emerald-700 shadow-2xs'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <Users className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span>Todos ({totalCount})</span>
                    </button>
                  </div>

                  {/* Mini preview chips of players in publicity */}
                  <div className="max-h-36 overflow-y-auto p-2 bg-slate-50/80 rounded-xl border border-gray-100 divide-y divide-gray-100 space-y-0.5">
                    {activeCallups.length === 0 ? (
                      <p className="text-[11px] text-gray-500 text-center py-2 italic">
                        No hay futbolistas en la convocatoria.
                      </p>
                    ) : (
                      activeCallups.map((p) => (
                        <div key={p.playerId} className="flex items-center justify-between py-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-black text-[10px] flex items-center justify-center flex-shrink-0 border border-amber-400/60">
                              {p.jerseyNumber}
                            </span>
                            <span className="font-bold text-gray-800 truncate max-w-[170px]">{p.fullName}</span>
                          </div>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                            p.status === 'Confirmado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick copy roster for WhatsApp */}
                  <button
                    type="button"
                    onClick={handleCopySquadList}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                  >
                    {copiedSquad ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                    <span>{copiedSquad ? '¡Nómina Copiada al Portapapeles!' : 'Copiar Nómina para WhatsApp'}</span>
                  </button>
                </div>

                {/* Direct Action Buttons: Download & WhatsApp */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2.5">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-slate-950 text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    {downloadSuccess ? <Check className="w-4 h-4 text-amber-300" /> : <Download className="w-4 h-4 text-amber-300" />}
                    <span>{downloadSuccess ? '¡Imagen Descargada!' : 'Descargar Imagen HD (PNG)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 border border-gray-200"
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Compartir en WhatsApp / Redes</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            5. SUBTAB 2: PROMPTS PUBLICITARIOS IA (DIRECTOR CREATIVO)
           =================================================================== */}
        {activeMainTab === 'prompts' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-50/60 space-y-4">
            
            {/* Feedback alert */}
            {copiedPrompt && (
              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl text-xs font-bold border border-emerald-300 flex items-center gap-2 shadow-xs animate-fade-in">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{copiedPrompt}</span>
              </div>
            )}

            {/* Design Mode Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {DESIGN_MODES.map((mode) => {
                const isSelected = activeDesignMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setActiveDesignMode(mode.id);
                      setSelectedConceptId(null);
                    }}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-500/50'
                        : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-2xs'
                    }`}
                  >
                    <span>{mode.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* HUD del Director Creativo */}
            <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-800/60 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/50">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                    #{promptsBundle.concept.number}
                  </span>
                  <div>
                    <h4 className="font-black text-base sm:text-lg text-white tracking-tight">
                      {promptsBundle.concept.title}
                    </h4>
                    <p className="text-xs text-emerald-300 font-medium">
                      {promptsBundle.concept.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleGenerateNewProposal}
                    disabled={isRegenerating}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md cursor-pointer transition active:scale-95"
                    title="Rotar a otra propuesta artística"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Nueva Propuesta</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowConceptPicker(!showConceptPicker)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">15 Conceptos</span>
                    <ChevronDown className="w-3 h-3 text-emerald-300" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs border transition cursor-pointer ${
                      showHistoryPanel ? 'bg-emerald-700 text-white' : 'bg-white/10 text-white border-white/20'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Historial</span>
                  </button>
                </div>
              </div>

              {/* Concept Picker */}
              {showConceptPicker && (
                <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-emerald-700/60 shadow-xl max-h-60 overflow-y-auto space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-300 pb-1 border-b border-slate-800">
                    <span>Biblioteca de 15 Conceptos Publicitarios:</span>
                    <button onClick={() => setShowConceptPicker(false)} className="text-gray-400 hover:text-white">✕</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {CREATIVE_CONCEPTS_LIBRARY.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedConceptId(c.id);
                          setShowConceptPicker(false);
                        }}
                        className={`text-left p-2 rounded-xl text-xs transition cursor-pointer border flex items-center justify-between ${
                          promptsBundle.concept.id === c.id
                            ? 'bg-emerald-800/80 text-white border-amber-400 font-bold'
                            : 'bg-slate-950/60 hover:bg-emerald-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-black text-amber-400 mr-1.5">#{c.number}</span>
                          <span className="font-bold">{c.title}</span>
                        </div>
                        {promptsBundle.concept.id === c.id && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* History Panel */}
              {showHistoryPanel && (
                <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-amber-500/50 shadow-xl max-h-60 overflow-y-auto space-y-1.5 animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-black text-amber-300 pb-1 border-b border-slate-800">
                    <span>Propuestas Anteriores:</span>
                    <div className="flex items-center gap-2">
                      {historyList.length > 0 && (
                        <button
                          onClick={() => {
                            clearPromptHistory(team?.id);
                            setHistoryList([]);
                          }}
                          className="text-[10px] text-red-300 hover:text-red-200"
                        >
                          Limpiar
                        </button>
                      )}
                      <button onClick={() => setShowHistoryPanel(false)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                  </div>
                  {historyList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">Sin historial registrado.</p>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      {historyList.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => {
                            setActiveDesignMode(entry.mode);
                            setSelectedConceptId(entry.conceptId);
                            setShowHistoryPanel(false);
                          }}
                          className="p-2 rounded-xl bg-slate-950/70 hover:bg-emerald-950 border border-slate-800 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1 py-0.2 rounded mr-1.5">
                              #{entry.conceptNumber}
                            </span>
                            <span className="text-xs font-black text-white">{entry.conceptTitle}</span>
                          </div>
                          <span className="text-[10px] font-bold text-amber-300">Reutilizar →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 text-xs">
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                  <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase mb-1">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cámara & Óptica</span>
                  </span>
                  <p className="text-white font-bold text-xs">{promptsBundle.concept.camera}</p>
                  <p className="text-emerald-300 text-[11px] mt-0.5">{promptsBundle.concept.lens}</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                  <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase mb-1">
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Iluminación</span>
                  </span>
                  <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.lighting}>
                    {promptsBundle.concept.lighting}
                  </p>
                  <p className="text-emerald-300 text-[11px] mt-0.5 truncate">
                    {promptsBundle.concept.atmosphere}
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                  <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase mb-1">
                    <Palette className="w-3.5 h-3.5 text-amber-400" />
                    <span>Color</span>
                  </span>
                  <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.colorGrading}>
                    {promptsBundle.concept.colorGrading}
                  </p>
                  <p className="text-emerald-300 text-[11px] mt-0.5 font-mono">#15803d • #ffffff • #fbbf24</p>
                </div>

                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                  <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase mb-1">
                    <Layout className="w-3.5 h-3.5 text-amber-400" />
                    <span>Composición</span>
                  </span>
                  <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.composition}>
                    {promptsBundle.concept.composition}
                  </p>
                  <p className="text-emerald-300 text-[11px] mt-0.5 truncate">
                    {promptsBundle.concept.negativeSpace}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Output Subtabs */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setAiStyleTab('poster')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'poster'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prompt Maestro Español (ChatGPT / Gemini / Ideogram)</span>
              </button>

              <button
                onClick={() => setAiStyleTab('midjourney')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'midjourney'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Prompt Internacional Inglés (Midjourney / Flux)</span>
              </button>

              <button
                onClick={() => setAiStyleTab('background')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'background'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fondo Editorial Limpio (Clean Plate)</span>
              </button>

              <button
                onClick={() => setAiStyleTab('roster')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'roster'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Nómina Convocados ({activeCallups.length})</span>
              </button>
            </div>

            {/* Prompt Codebox */}
            <div className="bg-white rounded-3xl border-2 border-emerald-300 p-4 shadow-sm relative group">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>
                    {aiStyleTab === 'poster' && 'Prompt maestro con nómina oficial de convocados y dirección fotográfica'}
                    {aiStyleTab === 'midjourney' && 'Prompt internacional en inglés con integración de nómina'}
                    {aiStyleTab === 'background' && 'Fondo editorial limpio con espacio para escudos y nómina'}
                    {aiStyleTab === 'roster' && 'Texto oficial de la nómina listo para copiar a WhatsApp y redes'}
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {currentAIPromptText.length} caracteres
                </span>
              </div>

              <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[36vh] overflow-y-auto p-3 bg-slate-50/80 rounded-2xl border border-gray-100 selection:bg-emerald-200">
                {currentAIPromptText}
              </pre>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleCopyAIPrompt}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-slate-950 text-white font-black text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  {copiedPrompt ? <Check className="w-4 h-4 text-amber-300" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>{copiedPrompt ? '¡Prompt Copiado con Éxito!' : 'Copiar Prompt para IA (1 Toque)'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ===================================================================
            6. MODAL FOOTER
           =================================================================== */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0 shadow-lg">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            {activeMainTab === 'prompts' ? (
              <button
                onClick={() => setActiveMainTab('graphic')}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 cursor-pointer transition active:scale-95"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ver Cartelera Oficial HD →</span>
              </button>
            ) : (
              <button
                onClick={() => setActiveMainTab('prompts')}
                className="flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300 cursor-pointer transition active:scale-95"
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Abrir Director Creativo IA →</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
