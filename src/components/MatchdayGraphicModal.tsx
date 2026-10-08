import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { Team, Match } from '../types';
import {
  renderMatchdayToCanvas,
  downloadCanvasPng,
  BILLBOARD_TEMPLATES,
  getDeterministicTemplateIndex,
  type BillboardFormat,
} from '../services/billboardService';
import { saveTeam } from '../services/dataService';
import { copyToClipboard, formatMatchDate } from '../services/whatsappService';
import { generateAIPrompts } from '../services/aiPromptService';
import {
  Download,
  X,
  Share2,
  AlertCircle,
  CheckCircle2,
  Shuffle,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Copy,
  Check,
  Smartphone,
  Square,
  Layers,
  Trash2,
  FileText,
  Globe,
  Trophy,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface MatchdayGraphicModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
  initialTab?: 'designer' | 'ai';
}

type BackgroundMode = 'auto' | 'custom_photo';

function compressImageToBase64(file: File, maxDim = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export const MatchdayGraphicModal: React.FC<MatchdayGraphicModalProps> = ({
  team,
  match,
  onClose,
  initialTab = 'designer',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const aiFileInputRef = useRef<HTMLInputElement | null>(null);

  // Main Tab Navigation: 'designer' (Visual Canvas) | 'ai' (AI Prompt Generator)
  const [mainTab, setMainTab] = useState<'designer' | 'ai'>(initialTab);

  // Formatting & Template state
  const initialIndex = useMemo(() => getDeterministicTemplateIndex(match.id), [match.id]);
  const [templateIndex, setTemplateIndex] = useState<number>(initialIndex);
  const [format, setFormat] = useState<BillboardFormat>('feed');

  // Background Mode state
  const hasSavedPhotos = Boolean(team?.backgroundPhotos && team.backgroundPhotos.length > 0);
  const [bgMode, setBgMode] = useState<BackgroundMode>(hasSavedPhotos ? 'custom_photo' : 'auto');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(
    team?.backgroundPhotos?.[0] || null
  );

  // UI status
  const [isRendering, setIsRendering] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [graphicError, setGraphicError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [aiUploadedSuccess, setAiUploadedSuccess] = useState<boolean>(false);

  // AI Prompts Sub-Tab
  const [aiStyleTab, setAiStyleTab] = useState<'poster' | 'midjourney' | 'background'>('poster');

  // Confirmed attendees only
  const confirmedPlayers = useMemo(
    () => match.callups.filter((c) => c.status === 'Confirmado'),
    [match.callups]
  );

  const currentTemplate = BILLBOARD_TEMPLATES[templateIndex % BILLBOARD_TEMPLATES.length];

  // AI Prompts Bundle
  const aiPrompts = useMemo(
    () => generateAIPrompts(team, match, confirmedPlayers),
    [team, match, confirmedPlayers]
  );

  const currentAIPromptText = useMemo(() => {
    if (aiStyleTab === 'poster') return aiPrompts.fullPosterPromptEs;
    if (aiStyleTab === 'midjourney') return aiPrompts.midjourneyPromptEn;
    return aiPrompts.cleanBackgroundPromptEs;
  }, [aiStyleTab, aiPrompts]);

  // Re-render canvas whenever options change
  useEffect(() => {
    let isCancelled = false;

    const render = async () => {
      if (!canvasRef.current || !team) return;
      setIsRendering(true);
      setGraphicError(null);

      try {
        const photoToUse = bgMode === 'custom_photo' ? selectedPhotoUrl : null;

        await renderMatchdayToCanvas(canvasRef.current, team, match, confirmedPlayers, {
          templateIndex,
          format,
          bgPhotoUrl: photoToUse,
        });
      } catch (err) {
        console.error('Error renderizando la cartelera:', err);
        if (!isCancelled) {
          setGraphicError('Hubo un inconveniente al dibujar la cartelera. Se activó el diseño de respaldo.');
        }
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    // Render when designer tab is active or mounted
    if (mainTab === 'designer') {
      render();
    }

    return () => {
      isCancelled = true;
    };
  }, [team, match, confirmedPlayers, templateIndex, format, bgMode, selectedPhotoUrl, mainTab]);

  // Handle Cycling to next template
  const handleNextTemplate = () => {
    setTemplateIndex((prev) => (prev + 1) % BILLBOARD_TEMPLATES.length);
  };

  // Handle Uploading a new custom photo from designer tab
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;

    setIsUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      const existing = team.backgroundPhotos || [];
      const updatedPhotos = [base64, ...existing.filter((p) => p !== base64)].slice(0, 8);

      const updatedTeam: Team = {
        ...team,
        backgroundPhotos: updatedPhotos,
        updatedAt: new Date().toISOString(),
      };

      await saveTeam(updatedTeam);
      setSelectedPhotoUrl(base64);
      setBgMode('custom_photo');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar la foto');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle Uploading an AI-generated photo from AI tab directly
  const handleAIPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !team) return;

    setIsUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      const existing = team.backgroundPhotos || [];
      const updatedPhotos = [base64, ...existing.filter((p) => p !== base64)].slice(0, 8);

      const updatedTeam: Team = {
        ...team,
        backgroundPhotos: updatedPhotos,
        updatedAt: new Date().toISOString(),
      };

      await saveTeam(updatedTeam);
      setSelectedPhotoUrl(base64);
      setBgMode('custom_photo');
      setMainTab('designer');
      setAiUploadedSuccess(true);
      setTimeout(() => setAiUploadedSuccess(false), 4500);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al procesar la imagen de IA');
    } finally {
      setIsUploading(false);
      if (aiFileInputRef.current) {
        aiFileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoToDelete: string) => {
    if (!team) return;
    const existing = team.backgroundPhotos || [];
    const updatedPhotos = existing.filter((p) => p !== photoToDelete);

    const updatedTeam: Team = {
      ...team,
      backgroundPhotos: updatedPhotos,
      updatedAt: new Date().toISOString(),
    };

    await saveTeam(updatedTeam);
    if (selectedPhotoUrl === photoToDelete) {
      setSelectedPhotoUrl(updatedPhotos[0] || null);
      if (updatedPhotos.length === 0) {
        setBgMode('auto');
      }
    }
  };

  // Download Handler
  const handleDownload = () => {
    if (!canvasRef.current) return;
    try {
      const sanitizedTeam = (team?.name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedRival = match.rival.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Matchday_${sanitizedTeam}_vs_${sanitizedRival}_${format}_${match.date}.png`;
      downloadCanvasPng(canvasRef.current, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar la imagen');
    }
  };

  // Web Share API Handler
  const handleShareMobile = async () => {
    if (!canvasRef.current) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `matchday_${match.rival}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Convocatoria Oficial vs ${match.rival}`,
              text: `🟢⚪ Convocatoria Oficial de ${team?.name} vs ${match.rival}. ¡Vamos con toda!`,
              files: [file],
            });
          } else {
            handleDownload();
          }
        });
        return;
      } catch (err) {
        console.warn('Share cancelled or not supported:', err);
      }
    }

    handleDownload();
  };

  const handleCopyAIPrompt = async () => {
    const success = await copyToClipboard(currentAIPromptText);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto max-h-[96vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-gray-950 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  Matchday Studio & IA
                </span>
                <span className="text-xs text-purple-200">
                  {match.tournamentName || 'Torneo Oficial'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                Cartelera Oficial & Prompts IA
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Segmented Navigation Switcher: Designer vs Prompts IA */}
        <div className="bg-gray-100 p-1.5 border-b border-gray-200 flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setMainTab('designer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              mainTab === 'designer'
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/80'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-700" />
            <span>🎨 Cartelera Oficial HD</span>
          </button>

          <button
            onClick={() => setMainTab('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              mainTab === 'ai'
                ? 'bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>✨ Prompts para IA</span>
          </button>
        </div>

        {/* Success toast after AI photo uploaded */}
        {aiUploadedSuccess && (
          <div className="p-2.5 bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-fade-in flex-shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Imagen generada con IA aplicada como fondo de tu cartelera oficial!</span>
          </div>
        )}

        {/* ===================== TAB 1: DESIGNER ===================== */}
        {mainTab === 'designer' && (
          <>
            {/* Toolbar: Template Switcher & Format Toggle */}
            <div className="bg-gray-50 border-b border-gray-200 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              {/* Format selector */}
              <div className="inline-flex bg-gray-200 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFormat('feed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    format === 'feed'
                      ? 'bg-white text-emerald-900 shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Feed (1:1)</span>
                </button>
                <button
                  onClick={() => setFormat('story')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    format === 'story'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Historia (9:16)</span>
                </button>
              </div>

              {/* Template cycling button */}
              <button
                onClick={handleNextTemplate}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 border border-gray-300 hover:border-purple-300 text-gray-800 text-xs font-bold shadow-2xs transition cursor-pointer"
                title="Cambiar al siguiente diseño"
              >
                <Shuffle className="w-3.5 h-3.5 text-purple-700" />
                <span>Plantilla:</span>
                <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded-md font-extrabold">
                  {currentTemplate.name}
                </span>
                <span className="text-[10px] text-gray-500 font-normal">
                  ({(templateIndex % BILLBOARD_TEMPLATES.length) + 1}/5)
                </span>
              </button>

              {/* Quick switch to AI tab */}
              <button
                onClick={() => setMainTab('ai')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-extrabold transition cursor-pointer ml-auto sm:ml-0"
                title="Ver prompts para ChatGPT o Midjourney"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>Ver Prompts IA</span>
                <ArrowRight className="w-3 h-3 text-purple-500" />
              </button>
            </div>

            {/* Background Mode Selector */}
            <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-gray-100 bg-white flex flex-wrap items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold text-gray-700 mr-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-purple-700" />
                <span>Fondo:</span>
              </span>

              <button
                onClick={() => setBgMode('auto')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  bgMode === 'auto'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                🎨 Ilustrado oficial
              </button>

              <button
                onClick={() => setBgMode('custom_photo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  bgMode === 'custom_photo'
                    ? 'bg-purple-700 text-white border-purple-700 shadow-2xs'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                }`}
              >
                📸 Foto del equipo / IA
              </button>

              <button
                onClick={() => setMainTab('ai')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 flex items-center gap-1"
                title="Crear un fondo épico con ChatGPT o Midjourney"
              >
                <Sparkles className="w-3 h-3 text-purple-700" />
                <span>Generar fondo con IA</span>
              </button>
            </div>

            {/* Custom Photo Selector Subpanel */}
            {bgMode === 'custom_photo' && (
              <div className="px-4 sm:px-6 py-3 bg-purple-50/50 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-gray-900">Fotos guardadas:</span>
                  {team?.backgroundPhotos && team.backgroundPhotos.length > 0 ? (
                    team.backgroundPhotos.map((photo, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={photo}
                          alt={`Fondo ${i + 1}`}
                          onClick={() => setSelectedPhotoUrl(photo)}
                          className={`w-12 h-12 rounded-xl object-cover border-2 cursor-pointer transition ${
                            selectedPhotoUrl === photo
                              ? 'border-purple-600 scale-105 shadow-md'
                              : 'border-white opacity-70 hover:opacity-100'
                          }`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo);
                          }}
                          className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                          title="Eliminar foto"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No hay fotos subidas todavía.</span>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="modal-photo-upload"
                  />
                  <label
                    htmlFor="modal-photo-upload"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer transition shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Subiendo...' : 'Subir Nueva Foto'}</span>
                  </label>
                </div>
              </div>
            )}

            {/* Graphic Canvas Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/80 flex flex-col items-center justify-center min-h-[340px]">
              {isRendering && (
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs mb-2">
                  <div className="w-4 h-4 border-2 border-purple-700 border-t-transparent rounded-full animate-spin" />
                  <span>Dibujando cartelera de alta resolución...</span>
                </div>
              )}

              {graphicError && (
                <div className="mb-3 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>{graphicError}</span>
                </div>
              )}

              {/* Canvas Element with dynamic aspect ratio */}
              <div
                className={`shadow-2xl rounded-2xl overflow-hidden border border-gray-300 bg-black max-w-full transition-all duration-300 ${
                  format === 'story'
                    ? 'aspect-[9/16] w-[260px] sm:w-[320px]'
                    : 'aspect-square w-[320px] sm:w-[420px]'
                }`}
              >
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              </div>

              <p className="text-[11px] text-gray-500 mt-3 text-center">
                Mostrando <strong>{confirmedPlayers.length} jugadores confirmados</strong> con dorsal oficial.
              </p>
            </div>

            {/* Sticky Footer Actions */}
            <div className="p-3 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
              <div className="flex items-center justify-between w-full sm:w-auto text-xs text-gray-500">
                <span>Resolución: <strong>{format === 'story' ? '1080x1920 (HD)' : '1080x1080 (HD)'}</strong></span>
                <span className="text-[10px] sm:hidden text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md">
                  Listo para redes
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  onClick={handleShareMobile}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
                  title="Compartir directamente en WhatsApp o Guardar en fotos"
                >
                  <Share2 className="w-4 h-4" />
                  <span>WhatsApp / Compartir</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadSuccess ? '¡Descargado!' : 'Descargar Imagen'}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===================== TAB 2: PROMPTS IA ===================== */}
        {mainTab === 'ai' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Match Quick Summary Banner */}
            <div className="bg-purple-50/80 border-b border-purple-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-950 flex-shrink-0">
              <div className="flex items-center gap-2 font-bold truncate">
                <Trophy className="w-3.5 h-3.5 text-purple-600" />
                <span>{match.tournamentName || 'Torneo Oficial'}:</span>
                <span className="text-emerald-800 font-black">{team?.name || 'Nuestro Equipo'}</span>
                <span className="text-gray-400">vs</span>
                <span className="text-gray-900 font-black">{match.rival}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-purple-700">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatMatchDate(match.date)}
                </span>
                {match.time && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {match.time}
                  </span>
                )}
                <span className="bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                  {confirmedPlayers.length} convocados
                </span>
              </div>
            </div>

            {/* AI Prompt Style Tabs */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 sm:p-3 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
              <button
                onClick={() => setAiStyleTab('poster')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'poster'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Póster con Convocados (Español)</span>
              </button>

              <button
                onClick={() => setAiStyleTab('midjourney')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'midjourney'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Midjourney / Flux / DALL-E (English)</span>
              </button>

              <button
                onClick={() => setAiStyleTab('background')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  aiStyleTab === 'background'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Fondo de Estadio Nocturno</span>
              </button>
            </div>

            {/* Body of AI Prompts */}
            <div className="p-4 sm:p-6 space-y-4 flex-1 bg-gray-50/40">
              {/* Prompt Text Card */}
              <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>
                      {aiStyleTab === 'poster' && 'Prompt detallado con nómina y dorsales'}
                      {aiStyleTab === 'midjourney' && 'Optimizado para Midjourney v6 y Flux'}
                      {aiStyleTab === 'background' && 'Fondo limpio sin texto para montar en la app'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                    {currentAIPromptText.length} caracteres
                  </span>
                </div>

                <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[30vh] overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-100 selection:bg-purple-200">
                  {currentAIPromptText}
                </pre>

                {/* Instant Copy Button */}
                <button
                  onClick={handleCopyAIPrompt}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 hover:from-purple-800 hover:to-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-98"
                >
                  {copiedPrompt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedPrompt ? '¡Prompt Copiado con Éxito!' : 'Copiar Prompt para IA (1 Toque)'}</span>
                </button>
              </div>

              {/* Seamless Upload Workflow: Apply AI result into Cartelera */}
              <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-emerald-50 p-4 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center justify-center sm:justify-start gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>¿Ya generaste la imagen en tu IA favorita?</span>
                  </h4>
                  <p className="text-xs text-gray-600">
                    Súbela aquí y se aplicará automáticamente como fondo de tu cartelera oficial con los convocados.
                  </p>
                </div>

                <div>
                  <input
                    ref={aiFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAIPhotoUpload}
                    className="hidden"
                    id="ai-photo-upload-tab"
                  />
                  <label
                    htmlFor="ai-photo-upload-tab"
                    className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs cursor-pointer transition shadow-md active:scale-95 whitespace-nowrap"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? 'Aplicando...' : 'Subir Imagen y Ver Cartelera'}</span>
                  </label>
                </div>
              </div>

              {/* Quick instructions / tips */}
              <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-2">
                <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                  <span>💡 Flujo recomendado:</span>
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-snug">
                  <li>Toca <strong>"Copiar Prompt para IA"</strong> arriba.</li>
                  <li>Abre <strong>ChatGPT</strong>, <strong>Midjourney</strong>, <strong>Google Gemini</strong> o <strong>Ideogram</strong>.</li>
                  <li>Pega el prompt y genera tu diseño deportivo en segundos.</li>
                  <li>Guarda el resultado y pulsa <strong>"Subir Imagen y Ver Cartelera"</strong> para fusionarlo con tu nómina.</li>
                </ol>
              </div>
            </div>

            {/* AI Tab Footer */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0">
              <button
                onClick={() => setMainTab('designer')}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
              >
                <span>Volver a Cartelera</span>
              </button>

              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
