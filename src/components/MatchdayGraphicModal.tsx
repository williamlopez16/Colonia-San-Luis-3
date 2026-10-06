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
import { copyToClipboard } from '../services/whatsappService';
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
} from 'lucide-react';
import { AIPromptModal } from './AIPromptModal';

interface MatchdayGraphicModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
}

type BackgroundMode = 'auto' | 'custom_photo' | 'ai_prompt';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  const [showAIPromptModal, setShowAIPromptModal] = useState<boolean>(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  // Confirmed attendees only
  const confirmedPlayers = useMemo(
    () => match.callups.filter((c) => c.status === 'Confirmado'),
    [match.callups]
  );

  const currentTemplate = BILLBOARD_TEMPLATES[templateIndex % BILLBOARD_TEMPLATES.length];

  // AI Prompt text generator
  const generatedAIPrompt = useMemo(() => {
    const teamName = team?.name || 'Club San Luis';
    const primaryColor = team?.primaryColor || '#15803d';
    const secondaryColor = team?.secondaryColor || '#ffffff';
    return `Fotografía deportiva profesional de estadio o cancha de fútbol amateur nocturna con reflectores encendidos y atmósfera dramática, césped verde intenso con líneas de cal nítidas y franjas de corte, estilo editorial deportivo para cartelera oficial de matchday del equipo "${teamName}", paleta de colores dominante verde esmeralda (${primaryColor}) y toques blancos (${secondaryColor}), sin personas en primer plano ni rostros reconocibles, sin logotipos ni textos ni marcas de agua, composición con espacio negativo limpio en la parte superior e inferior para superponer tipografía, ultra alta resolución 4k, fotorrealista.`;
  }, [team]);

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

        if (!isCancelled && canvasRef.current) {
          try {
            setPreviewDataUrl(canvasRef.current.toDataURL('image/png'));
          } catch {
            // Ignored if canvas tainted
          }
        }
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

    render();

    return () => {
      isCancelled = true;
    };
  }, [team, match, confirmedPlayers, templateIndex, format, bgMode, selectedPhotoUrl]);

  // Handle Cycling to next template
  const handleNextTemplate = () => {
    setTemplateIndex((prev) => (prev + 1) % BILLBOARD_TEMPLATES.length);
  };

  // Handle Uploading a new custom photo
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

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(generatedAIPrompt);
    if (success) {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto max-h-[96vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                Generador de Cartelera Matchday
              </h3>
              <p className="text-xs text-emerald-200">
                Diseño profesional deportivo para estados de WhatsApp y redes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  ? 'bg-emerald-600 text-white shadow-xs'
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
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 border border-gray-300 hover:border-emerald-400 text-emerald-900 text-xs font-bold shadow-2xs transition cursor-pointer"
            title="Cambiar al siguiente diseño"
          >
            <Shuffle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Probar otro diseño:</span>
            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-extrabold">
              {currentTemplate.name}
            </span>
            <span className="text-[10px] text-gray-500 font-normal">
              ({(templateIndex % BILLBOARD_TEMPLATES.length) + 1}/5)
            </span>
          </button>

          {/* AI Prompt Button in Toolbar */}
          <button
            onClick={() => setShowAIPromptModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white text-xs font-extrabold shadow-xs hover:shadow-md transition cursor-pointer ml-auto sm:ml-0"
            title="Ver prompt para generar imagen espectacular con otra IA"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>✨ Prompt para IA</span>
          </button>
        </div>

        {/* Background Mode Selector Pills */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-gray-100 bg-white flex flex-wrap items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-gray-700 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Fondo:</span>
          </span>

          <button
            onClick={() => setBgMode('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              bgMode === 'auto'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            🎨 Opción 1: Ilustrado automático (por defecto)
          </button>

          <button
            onClick={() => setBgMode('custom_photo')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              bgMode === 'custom_photo'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            📸 Opción 2: Subir foto propia
          </button>

          <button
            onClick={() => setBgMode('ai_prompt')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              bgMode === 'ai_prompt'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
            }`}
          >
            ✨ Opción 3: Generar prompt IA
          </button>
        </div>

        {/* Sub-panel depending on Background Mode */}
        {bgMode === 'custom_photo' && (
          <div className="px-4 sm:px-6 py-3 bg-emerald-50/50 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-emerald-950">Fotos del equipo:</span>
              {team?.backgroundPhotos && team.backgroundPhotos.length > 0 ? (
                team.backgroundPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={photo}
                      alt={`Fondo ${i + 1}`}
                      onClick={() => setSelectedPhotoUrl(photo)}
                      className={`w-12 h-12 rounded-xl object-cover border-2 cursor-pointer transition ${
                        selectedPhotoUrl === photo
                          ? 'border-emerald-600 scale-105 shadow-md'
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Subiendo...' : 'Subir Nueva Foto'}</span>
              </label>
            </div>
          </div>
        )}

        {bgMode === 'ai_prompt' && (
          <div className="px-4 sm:px-6 py-3 bg-purple-50/60 border-b border-purple-100 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Prompt generado para tu equipo (copia y pega en Gemini, Midjourney o tu IA favorita):</span>
              </span>
              <button
                onClick={handleCopyPrompt}
                className="flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-bold transition cursor-pointer"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? '¡Copiado!' : 'Copiar Prompt'}</span>
              </button>
            </div>

            <p className="bg-white p-2.5 rounded-xl border border-purple-200 text-gray-700 font-mono text-[11px] leading-relaxed max-h-20 overflow-y-auto">
              {generatedAIPrompt}
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-gray-600 text-[11px]">
                Descarga el resultado de la IA y súbelo directamente aquí para aplicarlo:
              </span>
              <label
                htmlFor="modal-photo-upload-ai"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir imagen generada</span>
              </label>
              <input
                id="modal-photo-upload-ai"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Graphic Canvas Preview Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100/80 flex flex-col items-center justify-center min-h-[340px]">
          {isRendering && (
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span>Generando cartelera de alta resolución...</span>
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

        {/* Sticky Mobile Footer Actions */}
        <div className="p-3 sm:p-5 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 flex-shrink-0 sticky bottom-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between w-full sm:w-auto text-xs text-gray-500">
            <span>Resolución: <strong>{format === 'story' ? '1080x1920 (HD)' : '1080x1080 (HD)'}</strong></span>
            <span className="text-[10px] sm:hidden text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
              Móvil Listo
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>{downloadSuccess ? '¡Descargado!' : 'Descargar Imagen'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Prompt Modal overlay if requested */}
      {showAIPromptModal && (
        <AIPromptModal
          team={team}
          match={match}
          onClose={() => setShowAIPromptModal(false)}
        />
      )}
    </div>
  );
};
