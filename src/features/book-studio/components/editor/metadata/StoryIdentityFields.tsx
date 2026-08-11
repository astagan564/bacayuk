import type { Story } from '@/types';
import type { UpdateStoryMetadata } from '@/features/book-studio/types/storyMetadata';

interface StoryIdentityFieldsProps {
  story: Story;
  isNewStory: boolean;
  onUpdateStory: UpdateStoryMetadata;
}

export function StoryIdentityFields({
  story,
  isNewStory,
  onUpdateStory,
}: StoryIdentityFieldsProps) {
  return (
    <section className="contents" aria-label="Identitas buku">
      <div>
        <label htmlFor="story-title" className="mb-1 block font-bold">Judul Buku Cerita</label>
        <input
          id="story-title"
          type="text"
          value={story.title}
          onChange={(event) => onUpdateStory({ title: event.target.value })}
          className="reader-field w-full rounded-xl px-3 py-2 font-bold"
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="story-author" className="mb-1 block font-bold">Penulis</label>
          <input
            id="story-author"
            type="text"
            value={story.author}
            onChange={(event) => onUpdateStory({ author: event.target.value })}
            className="reader-field w-full rounded-xl px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="story-status" className="mb-1 block font-bold">Status Publikasi</label>
          <select
            id="story-status"
            value={story.status || 'draft'}
            onChange={(event) => onUpdateStory({ status: event.target.value as Story['status'] })}
            className="reader-field w-full rounded-xl px-3 py-2"
          >
            <option value="draft">Draft - belum tampil di katalog</option>
            <option value="published">Published - tampil di katalog</option>
          </select>
        </div>
        <div>
          <label htmlFor="story-id" className="mb-1 block font-bold">ID Buku</label>
          <input
            id="story-id"
            type="text"
            value={story.id}
            onChange={(event) => onUpdateStory({ id: event.target.value.trim() })}
            className="reader-field w-full rounded-xl px-3 py-2"
            disabled={!isNewStory}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="story-category" className="mb-1 block font-bold">Kategori / Genre</label>
          <input
            id="story-category"
            type="text"
            value={story.category}
            onChange={(event) => onUpdateStory({ category: event.target.value })}
            className="reader-field w-full rounded-xl px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="story-target-age" className="mb-1 block font-bold">Usia Target Anak</label>
          <input
            id="story-target-age"
            type="text"
            value={story.targetAge}
            onChange={(event) => onUpdateStory({ targetAge: event.target.value })}
            className="reader-field w-full rounded-xl px-3 py-2"
            required
          />
        </div>
      </div>
    </section>
  );
}
