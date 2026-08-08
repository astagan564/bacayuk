import React from 'react';
import { VOCABULARY_DICTIONARY, VocabDefinition } from '../data/vocabulary';
import { GlossaryItem } from '../types';
import { Sparkles, Languages, Volume2 } from 'lucide-react';

interface InteractiveStoryTextProps {
  text: string;
  textEn?: string;
  languageMode?: 'id' | 'en' | 'dual';
  glossary?: GlossaryItem[];
  onSelectVocab?: (vocab: VocabDefinition) => void;
  onSelectGlossary?: (glossaryItem: GlossaryItem) => void;
  isNight?: boolean;
}

export const InteractiveStoryText: React.FC<InteractiveStoryTextProps> = ({
  text,
  textEn,
  languageMode = 'id',
  glossary = [],
  onSelectVocab,
  onSelectGlossary,
  isNight = false,
}) => {
  const activeEnText = textEn || text;

  // Helper to render text with glossary highlights
  const renderTextWithGlossary = (content: string, isEnglish: boolean) => {
    if (!content) return null;

    // Check story-specific glossary terms
    const glossaryKeys = glossary.map((g) => g.wordEn.toLowerCase());
    const vocabKeys = Object.keys(VOCABULARY_DICTIONARY);

    const allKeys = Array.from(new Set([...glossaryKeys, ...vocabKeys])).sort(
      (a, b) => b.length - a.length
    );

    if (allKeys.length === 0) {
      return <span>{content}</span>;
    }

    const escapedKeys = allKeys.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedKeys.join('|')})`, 'gi');
    const parts = content.split(regex);

    return (
      <span>
        {parts.map((part, index) => {
          const lowerPart = part.toLowerCase();
          const matchGlossary = glossary.find((g) => g.wordEn.toLowerCase() === lowerPart);
          const matchVocab = VOCABULARY_DICTIONARY[lowerPart];

          if (matchGlossary && onSelectGlossary) {
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectGlossary(matchGlossary);
                }}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-black cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group ${
                  isNight
                    ? 'bg-purple-500/30 text-purple-200 border-purple-400 hover:bg-purple-500/40'
                    : 'bg-indigo-100 text-indigo-900 border-indigo-500 hover:bg-indigo-200'
                }`}
                title={`Kamus Sentuh (Tap-to-Translate): "${matchGlossary.wordEn}" = ${matchGlossary.translationId}`}
              >
                <span>{part}</span>
                <span className="text-[10px] inline-block group-hover:animate-bounce">
                  {matchGlossary.emoji || '🇬🇧'}
                </span>
              </span>
            );
          }

          if (matchVocab && onSelectVocab) {
            return (
              <span
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectVocab(matchVocab);
                }}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-extrabold cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group ${
                  isNight
                    ? 'bg-amber-400/20 text-yellow-300 border-yellow-400 hover:bg-amber-400/30'
                    : 'bg-yellow-300/40 text-amber-950 border-amber-300 hover:bg-yellow-300/60'
                }`}
                title={`Klik untuk melihat arti "${matchVocab.word}"`}
              >
                <span>{part}</span>
                <span className="text-[10px] opacity-90 group-hover:animate-bounce inline-block">
                  {matchVocab.icon}
                </span>
              </span>
            );
          }

          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </span>
    );
  };

  if (languageMode === 'en') {
    return (
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">
          <Languages className="w-3 h-3" />
          <span>English Version</span>
        </div>
        <div>{renderTextWithGlossary(activeEnText, true)}</div>
      </div>
    );
  }

  if (languageMode === 'dual') {
    return (
      <div className="flex flex-col gap-2 sm:gap-3">
        {/* Indonesian Version */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 mb-1">
            <span>🇮🇩 Bahasa Indonesia</span>
          </div>
          <div className="text-xs sm:text-base leading-relaxed font-bold">
            {renderTextWithGlossary(text, false)}
          </div>
        </div>

        {/* English Version */}
        <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 mb-1">
            <span>🇬🇧 English Version (Tap words to translate)</span>
          </div>
          <div className="text-xs sm:text-base leading-relaxed font-bold text-indigo-950 dark:text-indigo-100">
            {renderTextWithGlossary(activeEnText, true)}
          </div>
        </div>
      </div>
    );
  }

  // Default 'id' Bahasa Indonesia
  return renderTextWithGlossary(text, false);
};
