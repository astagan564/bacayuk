import {
  BookOpen,
  Bookmark,
  CheckCircle2,
  Heart,
  History,
} from 'lucide-react';
import type { StoryCatalogController } from '@/features/reader/hooks/useStoryCatalogController';
import type { StoryLibraryView } from '@/features/reader/types/storyCatalog';

interface PersonalLibraryTabsProps {
  controller: StoryCatalogController;
}

export function PersonalLibraryTabs({ controller }: PersonalLibraryTabsProps) {
  const tabs: Array<{
    id: StoryLibraryView;
    label: string;
    count: number;
    icon: typeof BookOpen;
  }> = [
    { id: 'all', label: 'Semua buku', count: controller.publicStories.length, icon: BookOpen },
    { id: 'continue', label: 'Lanjutkan', count: controller.continueStories.length, icon: Bookmark },
    { id: 'favorites', label: 'Favorit', count: controller.favoriteStories.length, icon: Heart },
    { id: 'recent', label: 'Terakhir dibaca', count: controller.recentStories.length, icon: History },
    { id: 'completed', label: 'Selesai', count: controller.completedStoryList.length, icon: CheckCircle2 },
  ];

  return (
    <section className="book-panel rounded-2xl border border-default p-4 sm:p-5 text-primary" aria-labelledby="personal-library-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-secondary">Untuk waktu baca berikutnya</p>
          <h2 id="personal-library-title" className="mt-1 text-2xl sm:text-3xl">Koleksi saya</h2>
        </div>
        <p className="max-w-md text-xs leading-5 font-medium text-secondary">
          Simpan buku kesukaan dan temukan kembali cerita yang terakhir dibaca.
        </p>
      </div>
      <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" aria-label="Filter koleksi pribadi">
        {tabs.map(({ id, label, count, icon: Icon }) => {
          const isActive = controller.libraryView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => controller.selectLibraryView(id)}
              aria-pressed={isActive}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                isActive
                  ? 'bg-brand-green text-white shadow-sm'
                  : 'bg-surface text-secondary hover:bg-surface-hover'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-black/5'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </nav>
    </section>
  );
}
