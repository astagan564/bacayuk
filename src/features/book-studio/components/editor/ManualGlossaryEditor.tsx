import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { BookOpen, Megaphone } from 'lucide-react';

interface ManualGlossaryEditorProps {
  story: Story;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
}

export function ManualGlossaryEditor({
  story,
  onStoryChange,
}: ManualGlossaryEditorProps) {
  return (
    <>
      {/* --- 2. MANAJEMEN GLOSARIUM KAMUS SENTUH --- */}
      <div className="p-3.5 rounded-2xl bg-purple-50  border-2 border-purple-200 dark:border-purple-800 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-black text-xs uppercase text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Glosarium sentuh</span>
          </span>
          <button
            type="button"
            onClick={() => {
              const currentGlossary = story.glossary || [];
              const newItem = {
                id: `g_${Date.now()}`,
                wordEn: 'Friend',
                translationId: 'Sahabat',
                phonetic: 'frend',
                emoji: '🤝',
              };
              onStoryChange({
                ...story,
                glossary: [...currentGlossary, newItem],
              });
            }}
            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px]"
          >
            + Tambah Kata
          </button>
        </div>

        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {(story.glossary || []).map((item, gIdx) => (
            <div
              key={item.id || gIdx}
              className="p-2.5 rounded-xl bg-card border border-purple-200 dark:border-purple-700/60 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center text-[11px]"
            >
              <input
                type="text"
                placeholder="Kata EN (Mis: Rabbit)"
                value={item.wordEn}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], wordEn: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300 font-bold"
              />
              <input
                type="text"
                placeholder="Arti ID (Mis: Kelinci)"
                value={item.translationId}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], translationId: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300"
              />
              <input
                type="text"
                placeholder="Fonetik (Mis: rab-it)"
                value={item.phonetic || ''}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], phonetic: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300"
              />
              <input
                type="text"
                placeholder="Emoji (Mis: 🐰)"
                value={item.emoji || ''}
                onChange={(e) => {
                  const updated = [...(story.glossary || [])];
                  updated[gIdx] = { ...updated[gIdx], emoji: e.target.value };
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded border border-purple-300 text-center"
              />
              <button
                type="button"
                onClick={() => {
                  const updated = (story.glossary || []).filter((_, i) => i !== gIdx);
                  onStoryChange({ ...story, glossary: updated });
                }}
                className="px-2 py-1 rounded bg-error hover:bg-error text-white font-bold text-[10px]"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* --- 3. PUSTAKA SUARA (AUDIO LIBRARY NATIVE NARRATION) --- */}
      <div className="p-3.5 rounded-2xl bg-warning/10  border-2 border-warning dark:border-warning flex flex-col gap-2">
        <span className="font-black text-xs uppercase text-warning dark:text-warning flex items-center gap-1.5">
          <Megaphone className="w-4 h-4 text-warning" />
          <span>Pustaka suara narator</span>
        </span>
        <p className="text-[11px] text-warning/80 dark:text-brand-blue">
          Audio otomatis memakai suara perangkat. Orang tua juga dapat merekam narasi per halaman.
        </p>
      </div>
    </>
  );
}
