import { Languages, Sparkles, X } from 'lucide-react';

interface VocabularyQuizHeaderProps {
  title: string;
  onClose: () => void;
}

export function VocabularyQuizHeader({ title, onClose }: VocabularyQuizHeaderProps) {
  return (
    <div className="flex items-center justify-between bg-brand-blue p-4 text-white sm:p-5">
      <div className="flex items-center gap-2.5">
        <div className="rounded-2xl bg-white/20 p-2 text-white backdrop-blur-xs">
          <Languages className="h-6 w-6" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-blue-100">
            <Sparkles className="h-3 w-3" />
            <span>Kuis Kosakata Bahasa Inggris</span>
          </div>
          <h3 id="vocabulary-quiz-title" className="text-base font-extrabold sm:text-lg">{title}</h3>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        aria-label="Tutup kuis kosakata"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
