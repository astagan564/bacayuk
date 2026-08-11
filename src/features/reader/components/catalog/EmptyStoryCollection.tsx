import { Heart } from 'lucide-react';

interface EmptyStoryCollectionProps {
  onShowAllStories: () => void;
}

export function EmptyStoryCollection({ onShowAllStories }: EmptyStoryCollectionProps) {
  return (
    <div className="rounded-2xl border border-dashed border-default p-8 text-center bg-surface text-primary">
      <Heart className="mx-auto h-8 w-8 text-brand-rose" />
      <h2 className="mt-3 text-xl">Belum ada buku di bagian ini</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-secondary">
        Pilih buku dari rak lalu tekan ikon hati untuk menyimpannya, atau lanjutkan cerita yang pernah dibaca.
      </p>
      <button type="button" onClick={onShowAllStories} className="btn-secondary mt-4 px-4 py-2.5 text-xs">
        Lihat semua buku
      </button>
    </div>
  );
}
