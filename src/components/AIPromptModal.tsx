import React, { useState, useMemo } from 'react';
import type { Team, Match, Callup } from '../types';
import { generateAIPrompts } from '../services/aiPromptService';
import { copyToClipboard } from '../services/whatsappService';
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
  ExternalLink,
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
  const [activeTab, setActiveTab] = useState<'poster' | 'midjourney' | 'background'>('poster');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const confirmedPlayers = useMemo(
    () => match.callups.filter((c) => c.status === 'Confirmado'),
    [match.callups]
  );

  const prompts = useMemo(
    () => generateAIPrompts(team, match, confirmedPlayers),
    [team, match, confirmedPlayers]
  );

  const currentPromptText = useMemo(() => {
    if (activeTab === 'poster') return prompts.fullPosterPromptEs;
    if (activeTab === 'midjourney') return prompts.midjourneyPromptEn;
    return prompts.cleanBackgroundPromptEs;
  }, [activeTab, prompts]);

  const handleCopy = async () => {
    const success = await copyToClipboard(currentPromptText);
    if (success) {
      setCopySuccess('¡Prompt copiado con éxito! Listo para pegar en ChatGPT, Midjourney o Gemini.');
      setTimeout(() => setCopySuccess(null), 3500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 animate-scale-up my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-purple-800 via-indigo-900 to-emerald-900 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">
                  Generador de Prompts
                </span>
                <span className="text-xs text-purple-200">
                  {confirmedPlayers.length} convocados
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight mt-0.5">
                Prompt para IA: Cartelera Espectacular
              </h3>
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

        {/* Match quick summary chip */}
        <div className="bg-purple-50/70 border-b border-purple-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-purple-950 flex-shrink-0">
          <div className="flex items-center gap-2 font-bold truncate">
            <Trophy className="w-3.5 h-3.5 text-purple-600" />
            <span>{match.tournamentName || 'Torneo Oficial'}:</span>
            <span className="text-emerald-800 font-black">{team?.name || 'Colonia San Luis'}</span>
            <span className="text-gray-400">vs</span>
            <span className="text-gray-900 font-black">{match.rival}</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-purple-700">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {match.date}
            </span>
            {match.time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {match.time}
              </span>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-gray-50 border-b border-gray-200 p-2 sm:p-3 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('poster')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'poster'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Póster Completo con Convocados (Español)</span>
          </button>

          <button
            onClick={() => setActiveTab('midjourney')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'midjourney'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Midjourney / Flux / DALL-E (English)</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'background'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Fondo de Estadio Nocturno</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/40">
          {copySuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2 shadow-xs animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{copySuccess}</span>
            </div>
          )}

          {/* Prompt Box */}
          <div className="bg-white rounded-2xl border-2 border-purple-200 p-4 shadow-sm relative group">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>
                  {activeTab === 'poster' && 'Prompt detallado con datos y convocados'}
                  {activeTab === 'midjourney' && 'Prompt optimizado para Midjourney & Flux'}
                  {activeTab === 'background' && 'Prompt para fondo limpio de estadio'}
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                {currentPromptText.length} caracteres
              </span>
            </div>

            <pre className="font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[36vh] overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100 selection:bg-purple-200">
              {currentPromptText}
            </pre>
          </div>

          {/* Quick instructions / tips */}
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-xs text-gray-600 space-y-2">
            <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
              <span>💡 ¿Cómo usar este prompt?</span>
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-snug">
              <li>Haz clic en el botón verde inferior <strong>"Copiar Prompt"</strong>.</li>
              <li>Abre <strong>ChatGPT</strong>, <strong>Midjourney</strong>, <strong>Ideogram</strong> o <strong>Google Gemini</strong>.</li>
              <li>Pega el texto directamente y genera la imagen. ¡Quedará cinematográfica!</li>
              <li>Guarda el resultado en tu teléfono para compartirlo en tus estados de WhatsApp o redes.</li>
            </ol>
          </div>
        </div>

        {/* Modal Sticky Footer Action */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex items-center justify-between gap-3 flex-shrink-0 shadow-lg">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
          >
            Cerrar
          </button>

          <button
            onClick={handleCopy}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 hover:from-purple-800 hover:to-emerald-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition cursor-pointer active:scale-95"
          >
            {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copySuccess ? '¡Copiado al Portapapeles!' : 'Copiar Prompt para IA (1 Toque)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
