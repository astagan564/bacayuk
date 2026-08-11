import { AlertCircle, Loader2, Wand2 } from 'lucide-react';
import {
  CHARACTER_TYPES,
  MORAL_VALUES,
  STORY_SETTINGS,
} from '@/features/story-maker/constants';
import { StoryMakerChoiceGroup } from '@/features/story-maker/components/StoryMakerChoiceGroup';
import type { StoryMakerController } from '@/features/story-maker/hooks/useStoryMakerController';

interface StoryMakerFormProps {
  controller: StoryMakerController;
  onClose: () => void;
}

export function StoryMakerForm({ controller, onClose }: StoryMakerFormProps) {
  const { form } = controller;
  return (
    <form onSubmit={controller.submit} className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
      {controller.errorMessage && (
        <div role="alert" className="p-3 bg-error/10 border border-error rounded-2xl text-xs text-error">
          {controller.errorMessage}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="story-maker-character-name" className="text-xs font-bold uppercase tracking-wider text-primary">
          Nama Tokoh Utama
        </label>
        <input
          id="story-maker-character-name"
          type="text"
          value={form.characterName}
          onChange={(event) => controller.updateField('characterName', event.target.value)}
          required
          placeholder="Contoh: Kiko, Milo, Loli"
          className="px-4 py-2.5 rounded-2xl reader-soft-panel border border-default text-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </div>

      <StoryMakerChoiceGroup
        label="Jenis Tokoh"
        options={CHARACTER_TYPES}
        value={form.characterType}
        onChange={(value) => controller.updateField('characterType', value)}
      />
      <StoryMakerChoiceGroup
        label="Latar Tempat Petualangan"
        options={STORY_SETTINGS}
        value={form.setting}
        onChange={(value) => controller.updateField('setting', value)}
      />
      <StoryMakerChoiceGroup
        label="Pesan Moral"
        options={MORAL_VALUES}
        value={form.moralValue}
        onChange={(value) => controller.updateField('moralValue', value)}
      />

      <div className="pt-2 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-2xl reader-soft-panel hover:bg-surface-hover text-secondary hover:text-primary font-bold text-xs"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={controller.isGenerating || controller.quotaRemaining <= 0}
          className="px-6 py-2.5 rounded-2xl bg-brand-gold hover:opacity-90 text-white font-black text-sm flex items-center gap-2 shadow-xl disabled:opacity-50"
        >
          {controller.isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin text-white" /><span>Merancang Cerita...</span></>
          ) : controller.quotaRemaining <= 0 ? (
            <><AlertCircle className="w-5 h-5" /><span>Kuota Habis</span></>
          ) : (
            <><Wand2 className="w-5 h-5" /><span>Ciptakan Cerita Ajaib</span></>
          )}
        </button>
      </div>
    </form>
  );
}
