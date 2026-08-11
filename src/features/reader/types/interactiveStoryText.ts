import type { VocabDefinition } from '@/data/vocabulary';
import type { GlossaryItem } from '@/types';

export interface InteractiveStoryTextProps {
  text: string;
  textEn?: string;
  languageMode?: 'id' | 'en' | 'dual';
  glossary?: GlossaryItem[];
  onSelectVocab?: (vocab: VocabDefinition) => void;
  onSelectGlossary?: (glossaryItem: GlossaryItem) => void;
}
