interface VocabularyQuizEmptyStateProps {
  onClose: () => void;
}

export function VocabularyQuizEmptyState({ onClose }: VocabularyQuizEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 text-center">
      <span className="text-4xl" aria-hidden="true">📚</span>
      <div>
        <h3 className="text-lg font-black text-primary">Soal belum tersedia</h3>
        <p className="mt-1 text-xs text-secondary">Tambahkan pertanyaan kosakata sebelum memulai kuis.</p>
      </div>
      <button type="button" onClick={onClose} className="btn-primary px-5 py-3 text-xs">Tutup</button>
    </div>
  );
}
