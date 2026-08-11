import { RotateCcw } from 'lucide-react';

interface VocabularyQuizResultsProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  onClose: () => void;
}

export function VocabularyQuizResults({
  score,
  totalQuestions,
  onRestart,
  onClose,
}: VocabularyQuizResultsProps) {
  return (
    <div className="flex flex-col items-center gap-5 p-8 text-center">
      <div className="animate-bounce rounded-3xl bg-brand-gold p-5 text-5xl text-white shadow-xl" aria-hidden="true">
        🏆
      </div>
      <div>
        <h3 className="text-2xl font-black text-primary">Kuis Kosakata Selesai!</h3>
        <p className="mt-1 text-xs text-secondary">Kamu menjawab dengan luar biasa!</p>
      </div>
      <div className="reader-soft-panel flex w-full flex-col items-center gap-1 rounded-2xl p-4">
        <span className="text-xs font-extrabold uppercase text-secondary">Skor Akhir Kamu</span>
        <span className="text-4xl font-black text-primary">{score} / {totalQuestions}</span>
      </div>
      <div className="flex w-full items-center gap-3">
        <button type="button" onClick={onRestart} className="btn-secondary flex flex-1 items-center justify-center gap-2 px-4 py-3 text-xs">
          <RotateCcw className="h-4 w-4" />
          <span>Coba Lagi</span>
        </button>
        <button type="button" onClick={onClose} className="btn-primary flex-1 px-4 py-3 text-xs">
          Selesai
        </button>
      </div>
    </div>
  );
}
