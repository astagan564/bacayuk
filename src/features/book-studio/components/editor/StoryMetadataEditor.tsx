import type { Dispatch, SetStateAction } from 'react';
import type { AdminSettings } from '@/utils/adminStore';
import type { Story } from '@/types';

interface StoryMetadataEditorProps {
  story: Story;
  isNewStory: boolean;
  settings: AdminSettings;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
}

export function StoryMetadataEditor({
  story,
  isNewStory,
  settings,
  onStoryChange,
}: StoryMetadataEditorProps) {
  return (
    <>
      <div>
        <label className="block font-bold mb-1">Judul Buku Cerita</label>
        <input
          type="text"
          value={story.title}
          onChange={(e) => onStoryChange({ ...story, title: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl font-bold"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold mb-1">Penulis</label>
          <input
            type="text"
            value={story.author}
            onChange={(e) => onStoryChange({ ...story, author: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Status Publikasi</label>
          <select
            value={story.status || 'draft'}
            onChange={(e) => onStoryChange({ ...story, status: e.target.value as Story['status'] })}
            className="reader-field w-full px-3 py-2 rounded-xl"
          >
            <option value="draft">Draft - belum tampil di katalog</option>
            <option value="published">Published - tampil di katalog</option>
          </select>
        </div>
        <div>
          <label className="block font-bold mb-1">ID Buku</label>
          <input
            type="text"
            value={story.id}
            onChange={(e) => onStoryChange({ ...story, id: e.target.value.trim() })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            disabled={!isNewStory}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold mb-1">Kategori / Genrenya</label>
          <input
            type="text"
            value={story.category}
            onChange={(e) => onStoryChange({ ...story, category: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
        <div>
          <label className="block font-bold mb-1">Usia Target Anak</label>
          <input
            type="text"
            value={story.targetAge}
            onChange={(e) => onStoryChange({ ...story, targetAge: e.target.value })}
            className="reader-field w-full px-3 py-2 rounded-xl"
            required
          />
        </div>
      </div>

      <div>
        <label className="block font-bold mb-1">URL Gambar Cover</label>
        <input
          type="text"
          value={story.coverImage}
          onChange={(e) => onStoryChange({ ...story, coverImage: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
        <div className="mt-2 flex items-center gap-3 rounded-2xl reader-soft-panel p-3">
          <img
            src={story.coverImage}
            alt={story.title}
            className="h-28 w-20 rounded-xl object-cover border border-default dark:border-brand-blue bg-card"
          />
          <div className="min-w-0">
            <p className="font-black text-sm truncate">{story.title || 'Judul buku'}</p>
            <p className="mt-1 text-[11px] text-[var(--muted-ink)] text-secondary line-clamp-3">
              {story.description || 'Deskripsi buku akan tampil di kartu katalog.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block font-bold mb-1">Deskripsi Singkat Katalog</label>
        <textarea
          rows={2}
          value={story.description}
          onChange={(e) => onStoryChange({ ...story, description: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
      </div>

      <div>
        <label className="block font-bold mb-1">Pesan Moral Cerita</label>
        <textarea
          rows={2}
          value={story.moralMessage}
          onChange={(e) => onStoryChange({ ...story, moralMessage: e.target.value })}
          className="reader-field w-full px-3 py-2 rounded-xl"
          required
        />
      </div>

      {/* STATUS AKSES BUKU */}
      <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
        <label className="font-black text-xs text-secondary">
          Akses membaca online
        </label>
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="free_guest"
              checked={story.accessStatus === 'free_guest'}
              onChange={() => onStoryChange({ ...story, accessStatus: 'free_guest' })}
            />
            <span>Gratis tanpa login untuk buku pertama</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="free_member"
              checked={story.accessStatus === 'free_member' || !story.accessStatus}
              onChange={() => onStoryChange({ ...story, accessStatus: 'free_member' })}
            />
            <span>Gratis setelah orang tua login</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="accessStatus"
              value="paid"
              checked={story.accessStatus === 'paid'}
              onChange={() => onStoryChange({ ...story, accessStatus: 'paid' })}
            />
            <span>Berbayar</span>
          </label>
        </div>
      </div>

      {/* PENGUNCI FITUR UNDUHAN & HARGA */}
      <div className="reader-soft-panel p-3 rounded-2xl flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="font-bold text-xs text-secondary">
            Unduhan offline
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={story.downloadEnabled !== false}
              onChange={(e) => onStoryChange({ ...story, downloadEnabled: e.target.checked })}
            />
            <span className="font-bold text-xs">Aktifkan Unduh</span>
          </label>
        </div>

        {story.downloadEnabled !== false && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-[11px] font-bold">Harga E-Book (Rp)</label>
              <input
                type="number"
                step={1000}
                value={story.ebookPrice || settings.defaultEbookPrice}
                onChange={(e) =>
                  onStoryChange({ ...story, ebookPrice: Number(e.target.value) })
                }
                className="reader-field w-full px-3 py-1.5 rounded-xl font-bold"
              />
            </div>

            <div className="flex items-center gap-2 pt-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={story.watermarkEnabled !== false}
                  onChange={(e) =>
                    onStoryChange({ ...story, watermarkEnabled: e.target.checked })
                  }
                />
                <span className="text-[11px] font-bold">Stempel otomatis</span>
              </label>
            </div>
          </div>
        )}
      </div>

    </>
  );
}
