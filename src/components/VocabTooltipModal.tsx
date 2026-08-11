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
      speechEngine.speak(`${glossaryItem.wordEn}`, 0.95, 1.0, { language: 'en-US' });
    } else if (vocab) {
      speechEngine.speak(`${vocab.word}. ${vocab.definition}`, 0.9, 1.1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-sm animate-fade-in">
      <div
        className="reader-modal w-full max-w-md rounded-[1.35rem] p-6 relative overflow-hidden flex flex-col items-center text-center gap-4"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:text-primary hover:bg-surface-hover transition-colors z-10"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Supporting Icon */}
        <div className="p-4 rounded-2xl bg-brand-blue text-white shadow-lg animate-bounce text-4xl sm:text-5xl mt-2">
          {icon}
        </div>

        {/* Word Title & Category */}
        <div className="flex flex-col items-center gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-gold/20 text-secondary text-[11px] font-extrabold uppercase tracking-wider">
            <Languages className="w-3.5 h-3.5 text-brand-gold" />
            <span>{category}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-primary mt-1">
            {title}
          </h3>

          {pronunciation && (
            <span className="text-xs font-semibold text-secondary italic">
              Cara baca: [{pronunciation}]
            </span>
          )}
        </div>

        {/* Definition Box */}
        <div className="reader-soft-panel w-full p-4 rounded-2xl text-left flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-secondary">
            <BookOpen className="w-4 h-4 text-brand-green" />
            <span>Terjemahan & Arti Kata:</span>
          </div>
          <p className="text-sm text-primary leading-relaxed font-bold">
            {definition}
          </p>

          {example && (
            <div className="mt-2 pt-2 border-t reader-divider text-[11px] text-secondary italic">
              💡 {example}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="w-full flex items-center gap-2 pt-2">
          <button
            onClick={handlePronounce}
            className="flex-1 py-3 px-4 rounded-[0.9rem] bg-brand-blue hover:opacity-90 text-white font-extrabold text-xs shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" />
            <span>Dengarkan Pengucapan ({isGlossary ? 'English' : 'Audio'})</span>
          </button>

          <button
            onClick={onClose}
            className="btn-secondary py-3 px-5 text-xs"
          >
            Paham!
          </button>
        </div>
      </div>
    </div>
  );
};
