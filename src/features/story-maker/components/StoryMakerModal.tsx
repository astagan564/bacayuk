import { Wand2, X } from 'lucide-react';
import { StoryMakerForm } from '@/features/story-maker/components/StoryMakerForm';
import { useStoryMakerController } from '@/features/story-maker/hooks/useStoryMakerController';
import type { StoryMakerModalProps } from '@/features/story-maker/types';

export function StoryMakerModal(props: StoryMakerModalProps) {
  const controller = useStoryMakerController(props);
  return (
    <div className="fixed inset-0 z-50 bg-[var(--color-overlay)] backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-maker-title"
        className="reader-modal border-2 border-brand-gold rounded-[1.35rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b reader-divider flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-brand-gold text-white shadow-md">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h3 id="story-maker-title" className="text-xl font-black text-primary">Buat Buku Cerita AI</h3>
              <p className="text-xs text-secondary">Rancang tokoh, petualangan, dan pesan moral sendiri!</p>
            </div>
          </div>
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] uppercase font-bold text-brand-gold">Kuota VIP</span>
            <span className="text-sm font-black text-primary">
              {controller.quotaRemaining} <span className="text-brand-gold">/ {controller.maxQuota}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={props.onClose}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors"
            aria-label="Tutup pembuat cerita"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <StoryMakerForm controller={controller} onClose={props.onClose} />
      </div>
    </div>
  );
}
