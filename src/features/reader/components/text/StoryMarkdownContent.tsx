import { Fragment, useMemo } from 'react';
import type { VocabDefinition } from '@/data/vocabulary';
import type { GlossaryItem } from '@/types';
import {
  parseStoryInlineMarkdown,
  parseStoryMarkdown,
} from '@/features/reader/helpers/storyMarkdown';
import {
  createStoryVocabularyMatcher,
  splitStoryVocabulary,
  type StoryVocabularyMatcher,
} from '@/features/reader/helpers/storyVocabulary';

interface VocabularyTextProps {
  content: string;
  matcher: StoryVocabularyMatcher;
  onSelectVocab?: (vocab: VocabDefinition) => void;
  onSelectGlossary?: (glossaryItem: GlossaryItem) => void;
}

function VocabularyText({
  content,
  matcher,
  onSelectVocab,
  onSelectGlossary,
}: VocabularyTextProps) {
  return splitStoryVocabulary(content, matcher).map((part, index) => {
    if (part.glossaryItem && onSelectGlossary) {
      const item = part.glossaryItem;
      return (
        <button
          type="button"
          key={index}
          onClick={(event) => {
            event.stopPropagation();
            onSelectGlossary(item);
          }}
          className="reader-glossary-chip inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-black cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group"
          title={`Kamus Sentuh (Tap-to-Translate): "${item.wordEn}" = ${item.translationId}`}
        >
          <span>{part.text}</span>
          <span className="text-[10px] inline-block group-hover:animate-bounce">
            {item.emoji || '🇬🇧'}
          </span>
        </button>
      );
    }

    if (part.vocabulary && onSelectVocab) {
      const vocabulary = part.vocabulary;
      return (
        <button
          type="button"
          key={index}
          onClick={(event) => {
            event.stopPropagation();
            onSelectVocab(vocabulary);
          }}
          className="reader-vocab-chip inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md font-extrabold cursor-pointer transition-all border-b-2 border-dashed shadow-xs hover:scale-105 active:scale-95 group"
          title={`Klik untuk melihat arti "${vocabulary.word}"`}
        >
          <span>{part.text}</span>
          <span className="text-[10px] opacity-90 group-hover:animate-bounce inline-block">
            {vocabulary.icon}
          </span>
        </button>
      );
    }

    return <Fragment key={index}>{part.text}</Fragment>;
  });
}

interface InlineMarkdownProps extends Omit<VocabularyTextProps, 'content'> {
  content: string;
}

function InlineMarkdown(props: InlineMarkdownProps) {
  return parseStoryInlineMarkdown(props.content).map((token, index) => {
    if (token.type === 'code') {
      return (
        <code key={index} className="reader-inline-code rounded px-1 py-0.5 text-[0.9em] font-black">
          {token.content}
        </code>
      );
    }

    const content = <VocabularyText {...props} content={token.content} />;
    if (token.type === 'bold') return <strong key={index} className="font-black">{content}</strong>;
    if (token.type === 'italic') return <em key={index} className="italic">{content}</em>;
    return <Fragment key={index}>{content}</Fragment>;
  });
}

interface StoryMarkdownContentProps {
  content: string;
  glossary: GlossaryItem[];
  onSelectVocab?: (vocab: VocabDefinition) => void;
  onSelectGlossary?: (glossaryItem: GlossaryItem) => void;
}

export function StoryMarkdownContent({
  content,
  glossary,
  onSelectVocab,
  onSelectGlossary,
}: StoryMarkdownContentProps) {
  const blocks = useMemo(() => parseStoryMarkdown(content), [content]);
  const matcher = useMemo(() => createStoryVocabularyMatcher(glossary), [glossary]);
  const inlineProps = { matcher, onSelectVocab, onSelectGlossary };

  return blocks.map((block, index) => {
    if (block.type === 'heading') {
      const className = block.level === 1
        ? 'mb-2 text-base sm:text-lg font-black'
        : block.level === 2
          ? 'mb-2 text-sm sm:text-base font-black'
          : 'mb-1 text-xs sm:text-sm font-black';
      return <h4 key={index} className={className}><InlineMarkdown {...inlineProps} content={block.content} /></h4>;
    }
    if (block.type === 'unordered-list' || block.type === 'ordered-list') {
      const List = block.type === 'unordered-list' ? 'ul' : 'ol';
      const listClass = block.type === 'unordered-list' ? 'list-disc' : 'list-decimal';
      return (
        <List key={index} className={`mb-2 ml-4 ${listClass} space-y-1`}>
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}><InlineMarkdown {...inlineProps} content={item} /></li>
          ))}
        </List>
      );
    }
    return (
      <p key={index} className="mb-2 last:mb-0">
        <InlineMarkdown {...inlineProps} content={block.content} />
      </p>
    );
  });
}
