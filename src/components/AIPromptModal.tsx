import React, { useState, useMemo, useEffect } from 'react';
import type { Team, Match, Callup } from '../types';
import {
  generateAIPrompts,
  DESIGN_MODES,
  CREATIVE_CONCEPTS_LIBRARY,
  getPromptHistory,
  clearPromptHistory,
  type CreativeDesignMode,
  type CreativeConcept,
  type PromptHistoryEntry,
} from '../services/aiPromptService';
import { copyToClipboard } from '../services/whatsappService';
import { useAccessMode } from '../context/AccessModeContext';
import {
  Sparkles,
  Copy,
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
  Shield,
  Award,
  Flame,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Sliders,
} from 'lucide-react';

interface AIPromptModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({
  team,
  match,
  onClose,
}) => {
  const { isAdminMode } = useAccessMode();

  // Mode & Concept State
  const [activeMode, setActiveMode] = useState<CreativeDesignMode>('MATCHDAY');
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'poster' | 'midjourney' | 'background' | 'roster'>('poster');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const [showConceptPicker, setShowConceptPicker] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<PromptHistoryEntry[]>([]);

  useEffect(() => {
    if (!isAdminMode) {
      onClose();
    }
  }, [isAdminMode, onClose]);

  // Load history on mount
  useEffect(() => {
    setHistoryList(getPromptHistory(team?.id));
  }, [team?.id]);

  // Confirmed squad
  const confirmedPlayers = useMemo(
    () => match.callups.filter((c) => c.status === 'Confirmado'),
    [match.callups]
  );

  // Generate prompts with active mode and concept
  const promptsBundle = useMemo(
    () =>
      generateAIPrompts(team, match, confirmedPlayers, {
        mode: activeMode,
        conceptId: selectedConceptId || undefined,
        recordHistory: true,
      }),
    [team, match, confirmedPlayers, activeMode, selectedConceptId]
  );

  // Update history list when prompts generate
  useEffect(() => {
    setHistoryList(getPromptHistory(team?.id));
  }, [promptsBundle.concept.id, activeMode, team?.id]);

  // Current active prompt text
  const currentPromptText = useMemo(() => {
    if (activeTab === 'poster') return promptsBundle.fullPosterPromptEs;
    if (activeTab === 'midjourney') return promptsBundle.midjourneyPromptEn;
    if (activeTab === 'background') return promptsBundle.cleanBackgroundPromptEs;
    return promptsBundle.squadTextFormatted;
  }, [activeTab, promptsBundle]);

  // Handle Copy to Clipboard
  const handleCopy = async () => {
    const success = await copyToClipboard(currentPromptText);
    if (success) {
      setCopySuccess('¡Prompt publicitario copiado con éxito! Listo para pegar en ChatGPT, Midjourney, Ideogram o Gemini.');
      setTimeout(() => setCopySuccess(null), 3800);
    }
  };

  // Autonomous New Creative Proposal (smart rotation avoiding recent concepts)
  const handleGenerateNewProposal = () => {
    setIsRegenerating(true);
    // Find next concept that is different from current
    const available = CREATIVE_CONCEPTS_LIBRARY.filter((c) => c.id !== promptsBundle.concept.id);
    const randomPick = available[Math.floor(Math.random() * available.length)];
    setSelectedConceptId(randomPick.id);

    setTimeout(() => {
      setIsRegenerating(false);
      setCopySuccess(`Nueva dirección creativa activada: "${randomPick.title}"`);
      setTimeout(() => setCopySuccess(null), 3000);
    }, 250);
  };

  const handleSelectSpecificConcept = (conceptId: string) => {
    setSelectedConceptId(conceptId);
    setShowConceptPicker(false);
  };

  const handleRestoreFromHistory = (entry: PromptHistoryEntry) => {
    setActiveMode(entry.mode);
    setSelectedConceptId(entry.conceptId);
    setShowHistoryPanel(false);
  };

  const handleClearHistory = () => {
    clearPromptHistory(team?.id);
    setHistoryList([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto flex flex-col max-h-[94vh]">
        
        {/* ===================================================================
            1. MODAL HEADER - DIRECTOR CREATIVO DEPORTIVO
           =================================================================== */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0 border-b border-emerald-800/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-black/40 border border-white/20">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  Director Creativo Autónomo
                </span>
                <span className="text-xs text-emerald-300 font-semibold hidden sm:inline">
                  Colonia San Luis F.C. • Campaña Deportiva
                </span>
              </div>
              <h3 className="font-black text-base sm:text-xl leading-tight mt-0.5 text-white tracking-tight">
                Generador de Prompts Publicitarios Profesionales
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
            2. MATCH SUMMARY BAR (DATOS OFICIALES INMUTABLES)
           =================================================================== */}
        <div className="bg-emerald-950/90 text-white border-b border-emerald-800/50 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">
          <div className="flex items-center gap-2 font-bold truncate">
            <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-emerald-200">{match.tournamentName || 'Torneo Oficial'}:</span>
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
              {confirmedPlayers.length} Convocados
            </span>
          </div>
        </div>

        {/* ===================================================================
            3. DESIGN MODE SELECTOR (7 MODALIDADES PUBLICITARIAS)
           =================================================================== */}
        <div className="bg-gray-100 border-b border-gray-200 p-2 sm:px-4 sm:py-2.5 flex items-center gap-1.5 flex-shrink-0 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-black text-gray-500 uppercase tracking-wider mr-1 hidden lg:inline">
            Modo:
          </span>
          {DESIGN_MODES.map((mode) => {
            const isSelected = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  setActiveMode(mode.id);
                  setSelectedConceptId(null); // allow smart re-selection for new mode
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-800 text-white shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-2xs'
                }`}
                title={mode.description}
              >
                <span>{mode.badge}</span>
              </button>
            );
          })}
        </div>

        {/* ===================================================================
            4. SCROLLABLE BODY
           =================================================================== */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 bg-slate-50/60">
          
          {/* Feedback banner */}
          {copySuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-900 rounded-2xl text-xs font-bold border border-emerald-300 flex items-center gap-2 shadow-xs animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{copySuccess}</span>
            </div>
          )}

          {/* FICHA TÉCNICA DEL DIRECTOR CREATIVO (HUD) */}
          <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-800/60 relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-800/50">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md">
                  #{promptsBundle.concept.number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-base sm:text-lg text-white tracking-tight">
                      {promptsBundle.concept.title}
                    </h4>
                    <span className="bg-emerald-900 text-amber-300 border border-emerald-700/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Dirección Activa
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300 font-medium">
                    {promptsBundle.concept.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Buttons: New Proposal & Concept Selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGenerateNewProposal}
                  disabled={isRegenerating}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md cursor-pointer transition active:scale-95 disabled:opacity-50"
                  title="Cambia inteligentemente la dirección artística sin alterar los datos del partido"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                  <span>Nueva Propuesta Creativa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConceptPicker(!showConceptPicker)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition cursor-pointer"
                  title="Elegir manualmente de los 15 conceptos de la biblioteca"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="hidden sm:inline">Biblioteca (15)</span>
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowHistoryPanel(!showHistoryPanel)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-xl font-bold text-xs border transition cursor-pointer ${
                    showHistoryPanel
                      ? 'bg-emerald-700 text-white border-emerald-500'
                      : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                  }`}
                  title="Ver propuestas anteriores registradas para este partido"
                >
                  <History className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">Historial</span>
                  {historyList.length > 0 && (
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                      {historyList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Concept manual picker dropdown */}
            {showConceptPicker && (
              <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-emerald-700/60 shadow-xl max-h-60 overflow-y-auto animate-fade-in space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-emerald-300 pb-1 border-b border-slate-800">
                  <span>Seleccionar Concepto de la Biblioteca Oficial:</span>
                  <button
                    onClick={() => setShowConceptPicker(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                  {CREATIVE_CONCEPTS_LIBRARY.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectSpecificConcept(c.id)}
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
                      {promptsBundle.concept.id === c.id && (
                        <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* History dropdown panel */}
            {showHistoryPanel && (
              <div className="mt-3 p-3 bg-slate-900 rounded-2xl border border-amber-500/50 shadow-xl max-h-64 overflow-y-auto animate-fade-in space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-amber-300 pb-1 border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-amber-400" />
                    <span>Historial de Direcciones Creativas Utilizadas:</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {historyList.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="text-[10px] text-red-300 hover:text-red-200 flex items-center gap-1 cursor-pointer"
                        title="Borrar historial"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Limpiar</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowHistoryPanel(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {historyList.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    Aún no hay propuestas previas guardadas para este equipo.
                  </p>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {historyList.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => handleRestoreFromHistory(entry)}
                        className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-emerald-950/80 border border-slate-800 hover:border-emerald-600 transition cursor-pointer flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded">
                              #{entry.conceptNumber}
                            </span>
                            <span className="text-xs font-black text-white">{entry.conceptTitle}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold">({entry.mode})</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md mt-0.5">
                            {entry.rivalName ? `vs ${entry.rivalName}` : ''} • {entry.camera}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-amber-300 hover:underline flex-shrink-0">
                          Reutilizar →
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Technical HUD Grid (Fotografía, Iluminación, Color, Composición) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3 text-xs">
              <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase tracking-wider mb-1">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cámara & Óptica</span>
                </span>
                <p className="text-white font-bold text-xs">{promptsBundle.concept.camera}</p>
                <p className="text-emerald-300 text-[11px] mt-0.5">{promptsBundle.concept.lens} • {promptsBundle.concept.aperture}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase tracking-wider mb-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Iluminación & Clima</span>
                </span>
                <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.lighting}>
                  {promptsBundle.concept.lighting}
                </p>
                <p className="text-emerald-300 text-[11px] mt-0.5 truncate" title={promptsBundle.concept.atmosphere}>
                  {promptsBundle.concept.atmosphere}
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase tracking-wider mb-1">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Color & Película</span>
                </span>
                <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.colorGrading}>
                  {promptsBundle.concept.colorGrading}
                </p>
                <p className="text-emerald-300 text-[11px] mt-0.5 font-mono">
                  #15803d • #ffffff • #fbbf24
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
                <span className="flex items-center gap-1.5 text-amber-300 font-black text-[10px] uppercase tracking-wider mb-1">
                  <Layout className="w-3.5 h-3.5 text-amber-400" />
                  <span>Composición & Espacio</span>
                </span>
                <p className="text-white font-bold text-xs truncate" title={promptsBundle.concept.composition}>
                  {promptsBundle.concept.composition}
                </p>
                <p className="text-emerald-300 text-[11px] mt-0.5 truncate" title={promptsBundle.concept.negativeSpace}>
                  {promptsBundle.concept.negativeSpace}
                </p>
              </div>
            </div>

            {/* Quality Checklist Badges */}
            <div className="flex items-center gap-1.5 pt-3 flex-wrap text-[10px] font-bold text-emerald-200">
              <span className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sensor Real Calibrado
              </span>
              <span className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Piel con Poros y Sudor Natural
              </span>
              <span className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cero Piel de Cera / Anti-AI Slop
              </span>
              <span className="flex items-center gap-1 bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-700/50">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Datos 100% Verificados (Sin Alucinación)
              </span>
            </div>
          </div>

          {/* ===================================================================
              5. TAB SELECTION DE FORMATOS DE SALIDA
             =================================================================== */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('poster')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'poster'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Prompt Maestro Español (ChatGPT / Ideogram / Gemini)</span>
            </button>

            <button
              onClick={() => setActiveTab('midjourney')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'midjourney'
                  ? 'bg-indigo-700 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Prompt Internacional Inglés (Midjourney v6.1 / Flux)</span>
            </button>

            <button
              onClick={() => setActiveTab('background')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'background'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Fondo Editorial Limpio (Clean Plate)</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                activeTab === 'roster'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Nómina Convocados ({confirmedPlayers.length})</span>
            </button>
          </div>

          {/* ===================================================================
              6. PROMPT BOX (CÓDIGO LISTO PARA COPIAR)
             =================================================================== */}
          <div className="bg-white rounded-3xl border-2 border-emerald-300 p-4 shadow-sm relative group">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-800">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>
                  {activeTab === 'poster' && 'Prompt detallado en 14 bloques profesionales'}
                  {activeTab === 'midjourney' && 'Prompt internacional fotográfico calibrado con parámetros técnicos'}
                  {activeTab === 'background' && 'Fondo de estadio sin textos para superposición gráfica'}
                  {activeTab === 'roster' && 'Lista oficial de convocados confirmados con número de camiseta'}
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                {currentPromptText.length} caracteres
              </span>
            </div>

            <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[38vh] overflow-y-auto p-3 bg-slate-50/80 rounded-2xl border border-gray-100 selection:bg-emerald-200">
              {currentPromptText}
            </pre>
          </div>

          {/* Quick instructions / tips */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-1.5">
            <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
              <span>💡 ¿Cómo utilizar la instrucción con máxima calidad?</span>
            </h5>
            <p className="text-gray-600 leading-snug">
              Haz clic en <strong>"Copiar Prompt"</strong> y pégalo directamente en <strong>ChatGPT Plus</strong>, <strong>Ideogram</strong>, <strong>Midjourney v6.1</strong> o <strong>Google Gemini Imagen 3</strong>. Si deseas una dirección visual diferente para este mismo partido, presiona <strong>"Nueva Propuesta Creativa"</strong>.
            </p>
          </div>
        </div>

        {/* ===================================================================
            7. STICKY FOOTER ACTIONS
           =================================================================== */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0 shadow-lg">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateNewProposal}
              disabled={isRegenerating}
              className="hidden sm:flex items-center gap-1.5 py-2.5 px-4 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-950 font-black text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>Rotar Dirección</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-950 hover:from-emerald-800 hover:to-slate-950 text-white font-black text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
            >
              {copySuccess ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4 text-amber-300" />}
              <span>{copySuccess ? '¡Prompt Copiado!' : 'Copiar Prompt para IA (1 Toque)'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
