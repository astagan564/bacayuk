import { CheckCircle2, Volume2, XCircle } from 'lucide-react';
import type { VocabularyQuizQuestion } from '@/types';

interface VocabularyQuizQuestionViewProps {
  question: VocabularyQuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  score: number;
  displayedOptions: string[];
  selectedOption: string | null;
  isAnswered: boolean;
  onSelectOption: (option: string) => void;
  onNextQuestion: () => void;
  onSpeakWord: () => void;
}

function getOptionStyle(
  option: string,
  correctOption: string,
  selectedOption: string | null,
  isAnswered: boolean,
): string {
  if (!isAnswered) return 'reader-field hover:border-brand-blue text-primary';
  if (option === correctOption) return 'bg-success border-success text-white font-black ring-2 ring-success/30';
  if (option === selectedOption) return 'bg-error border-error text-white font-bold';
  return 'bg-surface opacity-50 border-transparent';
}

export function VocabularyQuizQuestionView({
  question,
  questionIndex,
  totalQuestions,
  score,
  displayedOptions,
  selectedOption,
  isAnswered,
  onSelectOption,
  onNextQuestion,
  onSpeakWord,
}: VocabularyQuizQuestionViewProps) {
  return (
    <div className="flex flex-col gap-5 p-6">
      <div className="flex items-center justify-between text-xs font-black text-secondary">
        <span>Soal {questionIndex + 1} dari {totalQuestions}</span>
        <span className="rounded-lg bg-brand-blue/15 px-2.5 py-0.5 text-brand-blue">Skor: {score}</span>
      </div>

      <div className="reader-soft-panel flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
        <span className="animate-bounce text-4xl" aria-hidden="true">{question.emoji || '🇬🇧'}</span>
        <div className="flex items-center justify-center gap-2">
          <h4 className="text-2xl font-black text-primary sm:text-3xl">“{question.wordEn}”</h4>
          <button
            type="button"
            onClick={onSpeakWord}
            className="rounded-full bg-brand-blue/15 p-2 text-brand-blue transition-transform hover:bg-brand-blue/25 active:scale-90"
            aria-label={`Dengarkan pengucapan ${question.wordEn}`}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>
        {question.phonetic && (
          <span className="text-xs font-semibold italic text-secondary">Cara baca: [{question.phonetic}]</span>
        )}
        <p className="mt-2 text-xs font-extrabold text-secondary">
          Apa arti kata Bahasa Inggris di atas dalam Bahasa Indonesia?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {displayedOptions.map((option, optionIndex) => (
          <button
            type="button"
            key={`${option}-${optionIndex}`}
            onClick={() => onSelectOption(option)}
            disabled={isAnswered}
            className={`flex items-center justify-center gap-2 rounded-2xl border-2 p-3.5 text-center text-xs font-extrabold shadow-sm transition-all sm:text-sm ${getOptionStyle(
              option,
              question.correctTranslationId,
              selectedOption,
              isAnswered,
            )}`}
          >
            <span>{option}</span>
            {isAnswered && option === question.correctTranslationId && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-white" />
            )}
            {isAnswered && option === selectedOption && option !== question.correctTranslationId && (
              <XCircle className="h-4 w-4 shrink-0 text-white" />
            )}
          </button>
        ))}
      </div>

      {isAnswered && (
        <button type="button" onClick={onNextQuestion} className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-xs sm:text-sm">
          {questionIndex + 1 < totalQuestions ? 'Soal Berikutnya ➔' : 'Lihat Hasil Kuis 🎉'}
        </button>
      )}
    </div>
  );
}
