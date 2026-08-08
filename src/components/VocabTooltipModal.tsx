import React from 'react';
import { VocabDefinition } from '../data/vocabulary';
import { GlossaryItem } from '../types';
import { Volume2, BookOpen, X, Sparkles, HelpCircle, Languages } from 'lucide-react';
import { speechEngine } from '../utils/speechEngine';

interface VocabTooltipModalProps {
  vocab?: VocabDefinition | null;
  glossaryItem?: GlossaryItem | null;
  onClose: () => void;
  isNight?: boolean;
}

export const VocabTooltipModal: React.FC<VocabTooltipModalProps> = ({
  vocab,
  glossaryItem,
  onClose,
  isNight = false,
}) => {
  const isGlossary = !!glossaryItem;

  const title = isGlossary ? glossaryItem.wordEn : vocab?.word ?? '';
  const icon = isGlossary ? (glossaryItem.emoji || '🇬🇧') : vocab?.icon ?? '📖';
  const category = isGlossary ? 'Kamus Belajar Bahasa Inggris' : (vocab?.category ?? 'Kamus Kosakata');
  const pronunciation = isGlossary ? glossaryItem.phonetic : vocab?.pronunciation;
  const definition = isGlossary ? `Arti: ${glossaryItem.translationId}` : vocab?.definition ?? '';
  const example = isGlossary
    ? (glossaryItem.exampleEn ? `EN: "${glossaryItem.exampleEn}" — ID: "${glossaryItem.exampleId}"` : undefined)
    : vocab?.example;

  const handlePronounce = () => {
    if (isGlossary) {
      speechEngine.speak(`${glossaryItem.wordEn}`, 0.95, 1.0);
    } else if (vocab) {
      speechEngine.speak(`${vocab.word}. ${vocab.definition}`, 0.9, 1.1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border-4 relative overflow-hidden flex flex-col items-center text-center gap-4 ${
          isNight
            ? 'bg-slate-900 text-slate-100 border-indigo-500/80'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}
      >
        {/* Decorative Glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors z-10"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Supporting Icon */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-400 text-white shadow-lg animate-bounce text-4xl sm:text-5xl mt-2">
          {icon}
        </div>

        {/* Word Title & Category */}
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
            <Languages className="w-3.5 h-3.5 text-indigo-600" />
            <span>{category}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-amber-950 dark:text-indigo-100 mt-1">
            {title}
          </h3>

          {pronunciation && (
            <span className="text-xs font-semibold text-amber-700/80 dark:text-amber-300/80 italic">
              Cara baca: [{pronunciation}]
            </span>
          )}
        </div>

        {/* Definition Box */}
        <div className="w-full p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-200/80 dark:border-indigo-800/80 text-left flex flex-col gap-2 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-indigo-300">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>Terjemahan & Arti Kata:</span>
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-bold">
            {definition}
          </p>

          {example && (
            <div className="mt-2 pt-2 border-t border-amber-100 dark:border-slate-700/80 text-[11px] text-amber-900/80 dark:text-indigo-200 italic">
              💡 {example}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2 pt-2">
          <button
            onClick={handlePronounce}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Dengarkan Pengucapan ({isGlossary ? 'English' : 'Audio'})</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-2xl bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 font-extrabold text-xs transition-colors"
          >
            Paham!
          </button>
        </div>
      </div>
    </div>
  );
};
