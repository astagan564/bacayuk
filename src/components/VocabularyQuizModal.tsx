import React, { useState } from 'react';
import { VocabularyQuiz } from '../types';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, XCircle, Volume2, Sparkles, X, Languages, RotateCcw } from 'lucide-react';
import { speechEngine } from '../utils/speechEngine';

interface VocabularyQuizModalProps {
  quiz: VocabularyQuiz;
  onClose: () => void;
  isNight?: boolean;
}

export const VocabularyQuizModal: React.FC<VocabularyQuizModalProps> = ({
  quiz,
  onClose,
  isNight = false,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const question = quiz.questions[currentQuestionIndex];

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
      speechEngine.speak(`Great job! ${question.wordEn} means ${question.correctTranslationId}`, 0.95, 1.0);
    } else {
      speechEngine.speak(`Try again next time!`, 0.95, 1.0);
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
    speechEngine.speak(question.wordEn, 0.9, 1.0);
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-4 relative flex flex-col ${
          isNight
            ? 'bg-slate-900 border-indigo-500/80 text-slate-100'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}
      >
        {/* Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-700 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-white/20 backdrop-blur-xs text-white">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
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
            <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-indigo-200">
              <span>
                Soal {currentQuestionIndex + 1} dari {quiz.questions.length}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 dark:text-indigo-300">
                Skor: {score}
              </span>
            </div>

            {/* Question Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm flex flex-col items-center text-center gap-2">
              <span className="text-4xl animate-bounce">{question.emoji || '🇬🇧'}</span>
              
              <div className="flex items-center justify-center gap-2">
                <h4 className="text-2xl sm:text-3xl font-black text-indigo-950 dark:text-indigo-100">
                  "{question.wordEn}"
                </h4>
                <button
                  onClick={handleSpeakWord}
                  className="p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/60 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 transition-transform active:scale-90"
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

              <p className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 mt-2">
                Apa arti kata Bahasa Inggris di atas dalam Bahasa Indonesia?
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid grid-cols-2 gap-3">
              {question.optionsId.map((opt, idx) => {
                let btnStyle = 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400 text-slate-800 dark:text-slate-100';
                if (isAnswered) {
                  if (opt === question.correctTranslationId) {
                    btnStyle = 'bg-emerald-600 border-emerald-400 text-white font-black ring-2 ring-emerald-300';
                  } else if (opt === selectedOption) {
                    btnStyle = 'bg-rose-600 border-rose-400 text-white font-bold';
                  } else {
                    btnStyle = 'bg-slate-100 dark:bg-slate-850 opacity-50 border-transparent';
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
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
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
              <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-100">
                Kuis Kosakata Selesai!
              </h3>
              <p className="text-xs text-slate-800 dark:text-slate-300 mt-1">
                Kamu menjawab dengan luar biasa!
              </p>
            </div>

            <div className="p-4 w-full rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col gap-1 items-center">
              <span className="text-xs uppercase font-extrabold text-indigo-800 dark:text-indigo-300">
                Skor Akhir Kamu
              </span>
              <span className="text-4xl font-black text-indigo-900 dark:text-indigo-100">
                {score} / {quiz.questions.length}
              </span>
            </div>

            <div className="w-full flex items-center gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-2xl bg-indigo-100 hover:bg-indigo-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-indigo-900 dark:text-indigo-200 font-extrabold text-xs flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Coba Lagi</span>
              </button>

              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md"
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
