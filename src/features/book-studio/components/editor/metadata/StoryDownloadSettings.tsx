import type { Story } from '@/types';
import type { AdminSettings } from '@/features/admin/types/adminStore';
import type { UpdateStoryMetadata } from '@/features/book-studio/types/storyMetadata';

interface StoryDownloadSettingsProps {
  story: Story;
  settings: AdminSettings;
  onUpdateStory: UpdateStoryMetadata;
}

export function StoryDownloadSettings({
  story,
  settings,
  onUpdateStory,
}: StoryDownloadSettingsProps) {
  const isDownloadEnabled = story.downloadEnabled !== false;

  return (
    <section className="reader-soft-panel flex flex-col gap-2 rounded-2xl p-3" aria-labelledby="story-download-title">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <span id="story-download-title" className="text-xs font-bold text-secondary">Unduhan offline</span>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={isDownloadEnabled}
            onChange={(event) => onUpdateStory({ downloadEnabled: event.target.checked })}
          />
          <span className="text-xs font-bold">Aktifkan Unduh</span>
        </label>
      </div>

      {isDownloadEnabled && (
        <div className="grid grid-cols-2 gap-2 pt-2">
          <div>
            <label htmlFor="story-ebook-price" className="block text-[11px] font-bold">Harga E-Book (Rp)</label>
            <input
              id="story-ebook-price"
              type="number"
              min={0}
              step={1000}
              value={story.ebookPrice || settings.defaultEbookPrice}
              onChange={(event) => onUpdateStory({ ebookPrice: Number(event.target.value) })}
              className="reader-field w-full rounded-xl px-3 py-1.5 font-bold"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={story.watermarkEnabled !== false}
                onChange={(event) => onUpdateStory({ watermarkEnabled: event.target.checked })}
              />
              <span className="text-[11px] font-bold">Stempel otomatis</span>
            </label>
          </div>
        </div>
      )}
    </section>
  );
}
