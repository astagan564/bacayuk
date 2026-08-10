import React, { useState } from 'react';
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
}

export const InteractiveStoryText: React.FC<InteractiveStoryTextProps> = ({
  text,
  textEn,
  languageMode = 'id',
  glossary = [],
  onSelectVocab,
  onSelectGlossary,
}) => {
  const activeEnText = textEn?.trim() || '';
  const [dualLanguage, setDualLanguage] = useState<'id' | 'en'>('id');
  const normalizeMarkdownInput = (content: string): string => {
    return content
      .replace(/(^|\s)([-*+])\s+(?=\*\*[^*]+:\*\*)/g, '\n$2 ')
      .replace(/(^|\s)(\d+[.)])\s+(?=\*\*[^*]+:\*\*)/g, '\n$2 ');
  };

  const renderInlineMarkdown = (content: string, isEnglish: boolean): React.ReactNode => {
    const chunks = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter((chunk) => chunk.length > 0);

    return chunks.map((chunk, index) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return (
          <strong key={index} className="font-black">
            {renderTextWithGlossary(chunk.slice(2, -2), isEnglish)}
          </strong>
        );
      }

      if (chunk.startsWith('*') && chunk.endsWith('*')) {
        return (
          <em key={index} className="italic">
            {renderTextWithGlossary(chunk.slice(1, -1), isEnglish)}
          </em>
        );
      }

      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return (
          <code
            key={index}
            className="reader-inline-code rounded px-1 py-0.5 text-[0.9em] font-black"
          >
            {chunk.slice(1, -1)}
          </code>
        );
      }

      return <React.Fragment key={index}>{renderTextWithGlossary(chunk, isEnglish)}</React.Fragment>;
    });
  };

  // Helper to render text with glossary highlights
  const renderTextWithGlossary = (content: string, isEnglish: boolean): React.ReactNode => {
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
                className="reader-glossary-chip inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-black cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group"
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
                className="reader-vocab-chip inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-extrabold cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group"
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

  const renderMarkdownBlocks = (content: string, isEnglish: boolean) => {
    if (!content) return null;

    const lines = normalizeMarkdownInput(content).replace(/\r\n/g, '\n').split('\n');
    const blocks: React.ReactNode[] = [];
    let paragraph: string[] = [];
    let listItems: string[] = [];
    let orderedListItems: string[] = [];

    const flushParagraph = () => {
      if (paragraph.length === 0) return;
      const textBlock = paragraph.join(' ').trim();
      if (textBlock) {
        blocks.push(
          <p key={`p-${blocks.length}`} className="mb-2 last:mb-0">
            {renderInlineMarkdown(textBlock, isEnglish)}
          </p>
        );
      }
      paragraph = [];
    };

    const flushList = () => {
      if (listItems.length > 0) {
        blocks.push(
          <ul key={`ul-${blocks.length}`} className="mb-2 ml-4 list-disc space-y-1">
            {listItems.map((item, index) => (
              <li key={index}>{renderInlineMarkdown(item, isEnglish)}</li>
            ))}
          </ul>
        );
        listItems = [];
      }

      if (orderedListItems.length > 0) {
        blocks.push(
          <ol key={`ol-${blocks.length}`} className="mb-2 ml-4 list-decimal space-y-1">
            {orderedListItems.map((item, index) => (
              <li key={index}>{renderInlineMarkdown(item, isEnglish)}</li>
            ))}
          </ol>
        );
        orderedListItems = [];
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      const heading = trimmed.match(/^(#{1,3})\s+(.+?)\s*#*$/);
      if (heading) {
        flushParagraph();
        flushList();
        const level = heading[1].length;
        const className = level === 1
          ? 'mb-2 text-base sm:text-lg font-black'
          : level === 2
          ? 'mb-2 text-sm sm:text-base font-black'
          : 'mb-1 text-xs sm:text-sm font-black';
        blocks.push(
          <h4 key={`h-${blocks.length}`} className={className}>
            {renderInlineMarkdown(heading[2], isEnglish)}
          </h4>
        );
        return;
      }

      const bullet = trimmed.match(/^[-*+]\s+(.+)$/);
      if (bullet) {
        flushParagraph();
        orderedListItems = [];
        listItems.push(bullet[1]);
        return;
      }

      const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);
      if (ordered) {
        flushParagraph();
        listItems = [];
        orderedListItems.push(ordered[1]);
        return;
      }

      flushList();
      paragraph.push(trimmed);
    });

    flushParagraph();
    flushList();

    return <>{blocks}</>;
  };

  if (languageMode === 'en') {
    return (
      <div className="flex flex-col gap-1">
        <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase">
          <Languages className="w-3 h-3" />
          <span>English Version</span>
        </div>
        {activeEnText ? (
          <div>{renderMarkdownBlocks(activeEnText, true)}</div>
        ) : (
          <div className="reader-empty-note text-xs font-bold">
            Draft English translation belum tersedia.
          </div>
        )}
      </div>
    );
  }

  if (languageMode === 'dual') {
    const activeDualLanguage = activeEnText ? dualLanguage : 'id';

    return (
      <div className="flex flex-col gap-2 sm:gap-3">
        <div className="sm:hidden reader-soft-panel grid grid-cols-2 gap-1 rounded-xl p-1" role="group" aria-label="Pilih bahasa cerita">
          <button
            type="button"
            onClick={() => setDualLanguage('id')}
            aria-pressed={activeDualLanguage === 'id'}
            className={`min-h-11 rounded-lg px-3 text-xs font-black transition-colors ${
              activeDualLanguage === 'id' ? 'bg-[var(--magic-blue)] text-white' : 'text-[var(--muted-ink)] dark:text-slate-300'
            }`}
          >
            Bahasa Indonesia
          </button>
          {activeEnText && (
            <button
              type="button"
              onClick={() => setDualLanguage('en')}
              aria-pressed={activeDualLanguage === 'en'}
              className={`min-h-11 rounded-lg px-3 text-xs font-black transition-colors ${
                activeDualLanguage === 'en' ? 'bg-[var(--magic-blue)] text-white' : 'text-[var(--muted-ink)] dark:text-slate-300'
              }`}
            >
              English
            </button>
          )}
        </div>

        {/* Indonesian Version */}
        <div className={`reader-language-card rounded-xl p-2.5 sm:block sm:rounded-2xl sm:p-3 ${activeDualLanguage === 'id' ? 'block' : 'hidden'}`}>
          <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase mb-1">
            <span>🇮🇩 Bahasa Indonesia</span>
          </div>
          <div className="leading-relaxed font-bold">
            {renderMarkdownBlocks(text, false)}
          </div>
        </div>

        {activeEnText && (
          <div className={`reader-language-card rounded-xl p-2.5 sm:block sm:rounded-2xl sm:p-3 ${activeDualLanguage === 'en' ? 'block' : 'hidden'}`}>
            <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase mb-1">
              <span>🇬🇧 English Version (Tap words to translate)</span>
            </div>
            <div className="reader-story-copy leading-relaxed font-bold">
              {renderMarkdownBlocks(activeEnText, true)}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default 'id' Bahasa Indonesia
  return renderMarkdownBlocks(text, false);
};
