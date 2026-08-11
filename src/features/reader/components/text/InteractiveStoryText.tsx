import { useCallback, useState } from 'react';
import { Languages } from 'lucide-react';
import { StoryMarkdownContent } from '@/features/reader/components/text/StoryMarkdownContent';
import type { InteractiveStoryTextProps } from '@/features/reader/types/interactiveStoryText';

export function InteractiveStoryText({
  text,
  textEn,
  languageMode = 'id',
  glossary = [],
  onSelectVocab,
  onSelectGlossary,
}: InteractiveStoryTextProps) {
  const activeEnText = textEn?.trim() || '';
  const [dualLanguage, setDualLanguage] = useState<'id' | 'en'>('id');
  const selectIndonesian = useCallback(() => setDualLanguage('id'), []);
  const selectEnglish = useCallback(() => setDualLanguage('en'), []);
  const markdownProps = { glossary, onSelectVocab, onSelectGlossary };

  if (languageMode === 'en') {
    return (
      <div className="flex flex-col gap-1">
        <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase">
          <Languages className="w-3 h-3" />
          <span>English Version</span>
        </div>
        {activeEnText ? (
          <div><StoryMarkdownContent {...markdownProps} content={activeEnText} /></div>
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
            onClick={selectIndonesian}
            aria-pressed={activeDualLanguage === 'id'}
            className={`min-h-11 rounded-lg px-3 text-xs font-black transition-colors ${activeDualLanguage === 'id' ? 'bg-brand-blue text-white' : 'text-secondary hover:bg-surface-hover'}`}
          >
            Bahasa Indonesia
          </button>
          {activeEnText && (
            <button
              type="button"
              onClick={selectEnglish}
              aria-pressed={activeDualLanguage === 'en'}
              className={`min-h-11 rounded-lg px-3 text-xs font-black transition-colors ${activeDualLanguage === 'en' ? 'bg-brand-blue text-white' : 'text-secondary hover:bg-surface-hover'}`}
            >
              English
            </button>
          )}
        </div>

        <div className={`reader-language-card rounded-xl p-2.5 sm:block sm:rounded-2xl sm:p-3 ${activeDualLanguage === 'id' ? 'block' : 'hidden'}`}>
          <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase mb-1">
            <span>🇮🇩 Bahasa Indonesia</span>
          </div>
          <div className="leading-relaxed font-bold">
            <StoryMarkdownContent {...markdownProps} content={text} />
          </div>
        </div>

        {activeEnText && (
          <div className={`reader-language-card rounded-xl p-2.5 sm:block sm:rounded-2xl sm:p-3 ${activeDualLanguage === 'en' ? 'block' : 'hidden'}`}>
            <div className="reader-language-label inline-flex items-center gap-1 text-[10px] font-black uppercase mb-1">
              <span>🇬🇧 English Version (Tap words to translate)</span>
            </div>
            <div className="reader-story-copy leading-relaxed font-bold">
              <StoryMarkdownContent {...markdownProps} content={activeEnText} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return <StoryMarkdownContent {...markdownProps} content={text} />;
}
