import React, { useState } from 'react';
import { VocabularyQuiz } from '../types';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Volume2, Sparkles, X, Languages, RotateCcw } from 'lucide-react';
import { speechEngine } from '../utils/speechEngine';
import { arrangeQuizOptions } from '../utils/quizOptions';

interface VocabularyQuizModalProps {
  quiz: VocabularyQuiz;
  onClose: () => void;
  isNight?: boolean;
}

const createOptionOrders = (quiz: VocabularyQuiz) => {
  const maximumOptionCount = Math.max(1, ...quiz.questions.map((question) => question.optionsId.length));
  const startingPosition = maximumOptionCount > 1
    ? 1 + Math.floor(Math.random() * (maximumOptionCount - 1))
    : 0;

  return quiz.questions.map((question, questionIndex) =>
    arrangeQuizOptions(
      question.optionsId,
      question.correctTranslationId,
      startingPosition + questionIndex
    )
  );
};

export const VocabularyQuizModal: React.FC<VocabularyQuizModalProps> = ({
  quiz,
  onClose,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [optionOrders, setOptionOrders] = useState(() => createOptionOrders(quiz));

  const question = quiz.questions[currentQuestionIndex];
  const displayedOptions = optionOrders[currentQuestionIndex] || question.optionsId;

  const handleOptionClick = (opt: string) => {
    if (isAnswered) return;
    setSelectedOption(opt);
    setIsAnswered(true);

    const isCorrect = opt === question.correctTranslationId;
    if (isCorrect) {
      setScore((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      speechEngine.speak(`Great job! ${question.wordEn} means ${question.correctTranslationId}`, 0.95, 1.0, { language: 'en-US' });
    } else {
      speechEngine.speak(`Try again next time!`, 0.95, 1.0, { language: 'en-US' });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < quiz.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
      });
    }
  };

  const handleSpeakWord = () => {
    speechEngine.speak(question.wordEn, 0.9, 1.0, { language: 'en-US' });
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
    setOptionOrders(createOptionOrders(quiz));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div
        className="reader-modal w-full max-w-lg rounded-[1.35rem] overflow-hidden relative flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[var(--magic-blue)] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
                <Sparkles className="w-3 h-3" />
                <span>Kuis Kosakata Bahasa Inggris</span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg">{quiz.title}</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Body */}
        {!isFinished ? (
          <div className="p-6 flex flex-col gap-5">
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs font-black text-[var(--muted-ink)] dark:text-blue-200">
              <span>
                Soal {currentQuestionIndex + 1} dari {quiz.questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[var(--magic-blue)]/15 text-[var(--magic-blue)] dark:text-blue-200">
                Skor: {score}
              </span>
            </div>

            {/* Question Card */}
            <div className="reader-soft-panel p-5 rounded-2xl flex flex-col items-center text-center gap-2">
              <span className="text-4xl animate-bounce">{question.emoji || '🇬🇧'}</span>
              
              <div className="flex items-center justify-center gap-2">
                <h4 className="text-2xl sm:text-3xl font-black text-[var(--ink)] dark:text-slate-100">
                  "{question.wordEn}"
                </h4>
                <button
                  onClick={handleSpeakWord}
                  className="p-2 rounded-full bg-[var(--magic-blue)]/12 hover:bg-[var(--magic-blue)]/20 dark:bg-blue-950/70 dark:hover:bg-blue-900 text-[var(--magic-blue)] dark:text-blue-200 transition-transform active:scale-90"
                  title="Dengarkan pengucapan kata"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {question.phonetic && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 italic">
                  Cara baca: [{question.phonetic}]
                </span>
              )}

              <p className="text-xs font-extrabold text-[var(--muted-ink)] dark:text-slate-300 mt-2">
                Apa arti kata Bahasa Inggris di atas dalam Bahasa Indonesia?
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
              {displayedOptions.map((opt, idx) => {
                let btnStyle = 'reader-field hover:border-[var(--magic-blue)] text-slate-800 dark:text-slate-100';
                if (isAnswered) {
                  if (opt === question.correctTranslationId) {
                    btnStyle = 'bg-emerald-600 border-emerald-400 text-white font-black ring-2 ring-emerald-300';
                  } else if (opt === selectedOption) {
                    btnStyle = 'bg-rose-600 border-rose-400 text-white font-bold';
                  } else {
                    btnStyle = 'bg-slate-100 dark:bg-slate-800 opacity-50 border-transparent';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    disabled={isAnswered}
                    className={`p-3.5 rounded-2xl border-2 text-center text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && opt === question.correctTranslationId && (
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    )}
                    {isAnswered && opt === selectedOption && opt !== question.correctTranslationId && (
                      <XCircle className="w-4 h-4 text-white shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            {isAnswered && (
              <button
                onClick={handleNextQuestion}
                className="btn-primary w-full py-3.5 text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <span>
                  {currentQuestionIndex + 1 < quiz.questions.length ? 'Soal Berikutnya ➔' : 'Lihat Hasil Kuis 🎉'}
                </span>
              </button>
            )}
          </div>
        ) : (
          /* Quiz Results View */
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="p-5 rounded-3xl bg-amber-400 text-amber-950 shadow-xl text-5xl animate-bounce">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-black text-[var(--ink)] dark:text-slate-100">
                Kuis Kosakata Selesai!
              </h3>
              <p className="text-xs text-slate-800 dark:text-slate-300 mt-1">
                Kamu menjawab dengan luar biasa!
              </p>
            </div>

            <div className="reader-soft-panel p-4 w-full rounded-2xl flex flex-col gap-1 items-center">
              <span className="text-xs uppercase font-extrabold text-[var(--muted-ink)] dark:text-blue-200">
                Skor Akhir Kamu
              </span>
              <span className="text-4xl font-black text-[var(--ink)] dark:text-slate-100">
                {score} / {quiz.questions.length}
              </span>
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="btn-secondary flex-1 py-3 px-4 text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>

              <button
                onClick={onClose}
                className="btn-primary flex-1 py-3 px-4 text-xs"
              >
                Selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
