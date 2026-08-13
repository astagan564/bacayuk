import { Edit, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { Story } from '@/types';

interface StoriesTabProps {
  defaultEbookPrice: number;
  stories: Story[];
  onCreateWithAi: () => void;
  onCreateManually: () => void;
  onDelete: (story: Story) => void;
  onEdit: (story: Story) => void;
}

export function StoriesTab({
  defaultEbookPrice,
  stories,
  onCreateWithAi,
  onCreateManually,
  onDelete,
  onEdit,
}: StoriesTabProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl mb-1">Kelola buku ({stories.length})</h3>
          <p className="text-xs text-[var(--muted-ink)] text-muted font-medium">
            Atur akses baca, unduhan offline, harga, dan stempel lisensi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onCreateWithAi} className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-4 h-4" />
            <span>Buat dengan AI</span>
          </button>
          <button
            onClick={onCreateManually}
            className="py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shrink-0 bg-surface/70 hover:bg-card text-secondary hover:text-primary border border-default font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Manual</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stories.map((story) => {
          const accessStatus = story.accessStatus === 'free_guest' ? 'free_guest' : 'free_member';
          const downloadEnabled = story.downloadEnabled !== false;
          const price = story.ebookPrice || defaultEbookPrice;

          return (
            <div key={story.id} className="p-4 rounded-xl border border-default bg-surface flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
              <img src={story.coverImage} alt={story.title} className="w-20 h-28 object-cover rounded-lg shadow-sm shrink-0 border border-default" />
              <div className="flex-1 flex flex-col justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    {accessStatus === 'free_guest' && <span className="px-2 py-0.5 rounded-md bg-brand-green/15 text-brand-green text-[10px] font-bold border border-brand-green/30">Gratis tanpa login</span>}
                    {accessStatus === 'free_member' && <span className="px-2 py-0.5 rounded-md bg-warning/20 text-warning dark:text-warning text-[10px] font-bold border border-[var(--warm-gold)]/35">Gratis setelah login</span>}
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${story.status === 'draft' ? 'bg-surface text-secondary border-default' : 'bg-brand-green/15 text-brand-green border-brand-green/30 dark:text-brand-green'}`}>
                      {story.status === 'draft' ? 'Draft' : 'Published'}
                    </span>
                    {downloadEnabled ? (
                      <span className="px-2 py-0.5 rounded-md bg-surface text-secondary text-[10px] font-bold">Unduh Rp {price.toLocaleString('id-ID')}</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-error/15 text-error text-[10px] font-bold">Unduh dikunci</span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-sm text-primary line-clamp-1">{story.title}</h4>
                  <p className="text-[11px] text-muted line-clamp-2">{story.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-default text-xs">
                  <span className="text-[11px] font-bold text-warning">{story.pages.length} halaman</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onEdit({ ...story, accessStatus, downloadEnabled, ebookPrice: price })} className="p-1.5 rounded-lg bg-brand-blue/10 text-info hover:bg-brand-blue/18 font-bold transition-colors flex items-center gap-1" title="Edit Buku Cerita">
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button onClick={() => onDelete(story)} className="p-1.5 rounded-lg bg-error/10 text-error hover:bg-error/18 font-bold transition-colors flex items-center gap-1" title="Hapus Buku Cerita">
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
