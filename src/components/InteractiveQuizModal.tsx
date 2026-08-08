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
    <div className="fixed inset-0 z-50 bg-amber-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-amber-900 border-2 border-amber-500 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Modal Header */}
        <div className="p-5 bg-amber-950/70 border-b border-amber-800 flex items-center justify-between text-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500 text-amber-950">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-amber-200">Kuis Pemahaman Cerita</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-amber-800 hover:bg-amber-700 text-amber-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quiz Body */}
        <div className="p-6 flex flex-col gap-5 text-amber-100">
          <p className="text-base font-bold text-amber-100 leading-snug">
            {quiz.question}
          </p>

          <div className="flex flex-col gap-2.5">
            {quiz.options.map((opt, idx) => {
              let btnStyle = 'bg-amber-950/60 border-amber-700 text-amber-100 hover:bg-amber-800';
              if (isAnswered) {
                if (idx === quiz.answerIndex) {
                  btnStyle = 'bg-emerald-600 border-emerald-400 text-white font-bold ring-2 ring-emerald-300';
                } else if (idx === selectedIndex) {
                  btnStyle = 'bg-rose-700 border-rose-500 text-white';
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
                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                  : 'bg-amber-950/90 border-amber-600 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 font-bold">
                {isCorrect ? (
                  <>
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span>Hebat Sekali! Jawabanmu Benar! 🎉</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-400" />
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
              className="mt-2 w-full py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-transform hover:scale-[1.02]"
            >
              Lanjutkan Membaca
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
