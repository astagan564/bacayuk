import { CheckCircle2, Languages, Sparkles } from 'lucide-react';
import type { Story } from '@/types';

interface BookBackCoverProps {
  story: Story;
  hasVocabularyQuiz: boolean;
  onOpenVocabularyQuiz: () => void;
  onCompleteBook?: () => void;
}

export function BookBackCover({
  story,
  hasVocabularyQuiz,
  onOpenVocabularyQuiz,
  onCompleteBook,
}: BookBackCoverProps) {
  return (
    <section className="flex h-full min-h-[30rem] w-full flex-col items-center justify-center px-8 py-8 text-center bg-surface text-primary">
      <span className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-surface-hover">
        <Sparkles className="h-9 w-9 text-brand-gold" />
      </span>
      <p className="mb-2 text-xs font-semibold tracking-[0.2em] text-secondary">TAMAT</p>
      <h2 className="max-w-2xl font-serif text-3xl font-semibold leading-tight sm:text-5xl">
        Cerita selesai, pesannya tetap tinggal.
      </h2>
      <p className="mt-6 max-w-xl font-serif text-base leading-8 sm:text-lg text-secondary">
        “{story.moralMessage}”
      </p>
      <div className="mt-8 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        {hasVocabularyQuiz && (
          <button
            type="button"
            onClick={onOpenVocabularyQuiz}
            className="min-h-14 rounded-2xl bg-brand-blue px-4 py-3 text-sm font-black text-white shadow-sm transition-transform hover:brightness-110 active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <Languages className="h-5 w-5" />
              Kuis kosakata
            </span>
          </button>
        )}
        {onCompleteBook && (
          <button
            type="button"
            onClick={onCompleteBook}
            className={`min-h-14 rounded-2xl bg-brand-green px-4 py-3 text-sm font-black text-white shadow-sm transition-transform hover:brightness-110 active:scale-[0.98] ${
              hasVocabularyQuiz ? '' : 'sm:col-span-2'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Selesaikan buku
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
