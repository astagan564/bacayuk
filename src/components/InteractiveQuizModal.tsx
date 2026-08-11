import React, { useState } from 'react';
import { QuizQuestion } from '../types';
import confetti from 'canvas-confetti';
import { HelpCircle, CheckCircle2, XCircle, Award, Sparkles, X } from 'lucide-react';

interface QuizModalProps {
  quiz: QuizQuestion;
  onClose: () => void;
}

export const InteractiveQuizModal: React.FC<QuizModalProps> = ({
  quiz,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleOptionClick = (idx: number) => {
    if (isAnswered) return;
    setSelectedIndex(idx);
    setIsAnswered(true);

    if (idx === quiz.answerIndex) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  const isCorrect = selectedIndex === quiz.answerIndex;

  return (
    <div className="fixed inset-0 z-50 bg-overlay backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="app-modal rounded-[1.35rem] w-full max-w-lg overflow-hidden flex flex-col relative">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b reader-divider flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-gold text-white">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-primary">Kuis Pemahaman Cerita</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-surface text-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Body */}
        <div className="p-6 flex flex-col gap-5 text-primary">
          <p className="text-base font-bold text-primary leading-snug">
            {quiz.question}
          </p>

          <div className="flex flex-col gap-2.5">
            {quiz.options.map((opt, idx) => {
              let btnStyle = 'bg-surface/50 border-default text-primary hover:bg-surface-hover';
              if (isAnswered) {
                if (idx === quiz.answerIndex) {
                  btnStyle = 'bg-success border-success text-white font-bold ring-2 ring-success/30';
                } else if (idx === selectedIndex) {
                  btnStyle = 'bg-error border-error text-white';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`p-3.5 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{opt}</span>
                  {isAnswered && idx === quiz.answerIndex && (
                    <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                  )}
                  {isAnswered && idx === selectedIndex && idx !== quiz.answerIndex && (
                    <XCircle className="w-5 h-5 text-white shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswered && (
            <div
              className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium animate-bounce-once ${
                isCorrect
                  ? 'bg-success/10 border-success/40 text-success'
                  : 'bg-brand-gold/10 border-brand-gold/40 text-brand-gold'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-bold">
                {isCorrect ? (
                  <>
                    <Award className="w-5 h-5" />
                    <span>Hebat Sekali! Jawabanmu Benar! 🎉</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Hampir Benar! Mari Coba Lagi Nanti!</span>
                  </>
                )}
              </div>
              <p className="leading-relaxed opacity-90">{quiz.explanation}</p>
            </div>
          )}

          {/* Close Button */}
          {isAnswered && (
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 bg-brand-gold hover:opacity-90 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-transform hover:scale-[1.02]"
            >
              Lanjutkan Membaca
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
