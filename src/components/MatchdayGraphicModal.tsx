import React, { useRef, useEffect, useState } from 'react';
import type { Team, Match } from '../types';
import { renderMatchdayToCanvas, downloadCanvasPng } from '../services/billboardService';
import { Download, X, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MatchdayGraphicModalProps {
  team: Team | null;
  match: Match;
  onClose: () => void;
}

export const MatchdayGraphicModal: React.FC<MatchdayGraphicModalProps> = ({
  team,
  match,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [graphicError, setGraphicError] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Take only confirmed players
  const confirmedPlayers = match.callups.filter((c) => c.status === 'Confirmado');

  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      if (!canvasRef.current || !team) return;
      setIsGenerating(true);
      setGraphicError(null);

      try {
        await renderMatchdayToCanvas(canvasRef.current, team, match, confirmedPlayers);
        if (isMounted) {
          const url = canvasRef.current.toDataURL('image/png');
          setPreviewUrl(url);
        }
      } catch (err) {
        console.error('Error generating matchday graphic:', err);
        if (isMounted) {
          setGraphicError(
            'Hubo un problema al generar la cartelera visual. La convocatoria y el partido no se ven afectados.'
          );
        }
      } finally {
        if (isMounted) {
          setIsGenerating(false);
        }
      }
    };

    generate();

    return () => {
      isMounted = false;
    };
  }, [team, match, confirmedPlayers.length]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    try {
      const sanitizedTeam = (team?.name || 'Club').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedRival = match.rival.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Matchday_${sanitizedTeam}_vs_${sanitizedRival}_${match.date}.png`;
      downloadCanvasPng(canvasRef.current, filename);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al descargar la imagen');
    }
  };

  const handleShareMobile = async () => {
    if (!previewUrl || !canvasRef.current) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        canvasRef.current.toBlob(async (blob) => {
          if (!blob) return;
          const file = new File([blob], `convocatoria_${match.rival}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Convocatoria Oficial vs ${match.rival}`,
              text: `🟢⚪ Convocatoria Oficial de ${team?.name} para el partido contra ${match.rival}.`,
              files: [file],
            });
          } else {
            handleDownload();
          }
        });
        return;
      } catch (err) {
        console.warn('Navigator share with file failed or cancelled:', err);
      }
    }

    // Fallback: download
    handleDownload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6">
        {/* Header */}
        <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg">Cartelera Oficial Matchday</h3>
            <p className="text-xs text-emerald-200">
              {confirmedPlayers.length} jugadores confirmados • Formato 1:1 cuadrado
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {graphicError && (
            <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs flex items-start gap-2.5 border border-red-200">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-bold">Aviso aislado:</p>
                <p>{graphicError}</p>
              </div>
            </div>
          )}

          {/* Hidden Canvas for native rendering */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview Container */}
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-emerald-950 flex items-center justify-center shadow-inner">
            {isGenerating && (
              <div className="text-center text-emerald-200 space-y-2">
                <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold">Generando cartelera gráfica en alta resolución...</p>
              </div>
            )}

            {!isGenerating && previewUrl && (
              <img
                src={previewUrl}
                alt="Cartelera Matchday"
                className="w-full h-full object-contain"
              />
            )}
          </div>

          {downloadSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Imagen descargada exitosamente en formato PNG!</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownload}
              disabled={isGenerating || !previewUrl}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Imagen PNG</span>
            </button>

            <button
              onClick={handleShareMobile}
              disabled={isGenerating || !previewUrl}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir en Redes / WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
