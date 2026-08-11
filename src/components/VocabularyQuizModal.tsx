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
    <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div
        className="app-modal w-full max-w-lg rounded-[1.35rem] overflow-hidden relative flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-brand-blue text-white flex items-center justify-between">
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
            <div className="flex items-center justify-between text-xs font-black text-secondary">
              <span>
                Soal {currentQuestionIndex + 1} dari {quiz.questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-brand-blue/15 text-brand-blue">
                Skor: {score}
              </span>
            </div>

            {/* Question Card */}
            <div className="reader-soft-panel p-5 rounded-2xl flex flex-col items-center text-center gap-2">
              <span className="text-4xl animate-bounce">{question.emoji || '🇬🇧'}</span>
              
              <div className="flex items-center justify-center gap-2">
                <h4 className="text-2xl sm:text-3xl font-black text-primary">
                  "{question.wordEn}"
                </h4>
                <button
                  onClick={handleSpeakWord}
                  className="p-2 rounded-full bg-brand-blue/15 hover:bg-brand-blue/25 text-brand-blue transition-transform active:scale-90"
                  title="Dengarkan pengucapan kata"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {question.phonetic && (
                <span className="text-xs font-semibold text-secondary italic">
                  Cara baca: [{question.phonetic}]
                </span>
              )}

              <p className="text-xs font-extrabold text-secondary mt-2">
                Apa arti kata Bahasa Inggris di atas dalam Bahasa Indonesia?
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
              {displayedOptions.map((opt, idx) => {
                let btnStyle = 'reader-field hover:border-brand-blue text-primary';
                if (isAnswered) {
                  if (opt === question.correctTranslationId) {
                    btnStyle = 'bg-success border-success text-white font-black ring-2 ring-success/30';
                  } else if (opt === selectedOption) {
                    btnStyle = 'bg-error border-error text-white font-bold';
                  } else {
                    btnStyle = 'bg-surface opacity-50 border-transparent';
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
            <div className="p-5 rounded-3xl bg-brand-gold text-white shadow-xl text-5xl animate-bounce">
              🏆
            </div>

            <div>
              <h3 className="text-2xl font-black text-primary">
                Kuis Kosakata Selesai!
              </h3>
              <p className="text-xs text-secondary mt-1">
                Kamu menjawab dengan luar biasa!
              </p>
            </div>

            <div className="reader-soft-panel p-4 w-full rounded-2xl flex flex-col gap-1 items-center">
              <span className="text-xs uppercase font-extrabold text-secondary">
                Skor Akhir Kamu
              </span>
              <span className="text-4xl font-black text-primary">
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
