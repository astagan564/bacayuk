import type { Story } from '@/types';
import type { UpdateStoryMetadata } from '@/features/book-studio/types/storyMetadata';

interface StoryAccessSettingsProps {
  accessStatus: Story['accessStatus'];
  onUpdateStory: UpdateStoryMetadata;
}

const ACCESS_OPTIONS = [
  { value: 'free_guest', label: 'Gratis tanpa login untuk buku pertama' },
  { value: 'free_member', label: 'Gratis setelah orang tua login' },
  { value: 'paid', label: 'Berbayar' },
] as const;

export function StoryAccessSettings({
  accessStatus,
  onUpdateStory,
}: StoryAccessSettingsProps) {
  const normalizedAccessStatus = accessStatus || 'free_member';

  return (
    <fieldset className="reader-soft-panel flex flex-col gap-2 rounded-2xl p-3">
      <legend className="text-xs font-black text-secondary">Akses membaca online</legend>
      <div className="flex flex-col gap-1.5">
        {ACCESS_OPTIONS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="accessStatus"
              value={option.value}
              checked={normalizedAccessStatus === option.value}
              onChange={() => onUpdateStory({ accessStatus: option.value })}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
