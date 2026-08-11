import type { Story } from '@/types';
import type { UpdateStoryMetadata } from '@/features/book-studio/types/storyMetadata';

interface StoryCatalogFieldsProps {
  story: Story;
  onUpdateStory: UpdateStoryMetadata;
}

export function StoryCatalogFields({ story, onUpdateStory }: StoryCatalogFieldsProps) {
  return (
    <section className="contents" aria-label="Tampilan katalog buku">
      <div>
        <label htmlFor="story-cover-image" className="mb-1 block font-bold">URL Gambar Cover</label>
        <input
          id="story-cover-image"
          type="text"
          inputMode="url"
          value={story.coverImage}
          onChange={(event) => onUpdateStory({ coverImage: event.target.value })}
          className="reader-field w-full rounded-xl px-3 py-2"
          required
        />
        <div className="reader-soft-panel mt-2 flex items-center gap-3 rounded-2xl p-3">
          <img
            src={story.coverImage}
            alt={`Pratinjau cover ${story.title || 'buku'}`}
            className="h-28 w-20 rounded-xl border border-default bg-card object-cover dark:border-brand-blue"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{story.title || 'Judul buku'}</p>
            <p className="mt-1 line-clamp-3 text-[11px] text-secondary">
              {story.description || 'Deskripsi buku akan tampil di kartu katalog.'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="story-description" className="mb-1 block font-bold">Deskripsi Singkat Katalog</label>
        <textarea
          id="story-description"
          rows={2}
          value={story.description}
          onChange={(event) => onUpdateStory({ description: event.target.value })}
          className="reader-field w-full rounded-xl px-3 py-2"
          required
        />
      </div>

      <div>
        <label htmlFor="story-moral-message" className="mb-1 block font-bold">Pesan Moral Cerita</label>
        <textarea
          id="story-moral-message"
          rows={2}
          value={story.moralMessage}
          onChange={(event) => onUpdateStory({ moralMessage: event.target.value })}
          className="reader-field w-full rounded-xl px-3 py-2"
          required
        />
      </div>
    </section>
  );
}
