import type { Dispatch, SetStateAction } from 'react';
import type { Story } from '@/types';
import { PIPELINE_STEPS } from '@/features/book-studio/constants';
import { hasCompleteStoryImages, inferPipelineStatus, visualPresetLabel } from '@/features/book-studio/helpers/storyDraft';

interface ProductionStatusSectionProps {
  story: Story;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
}

export function ProductionStatusSection({ story, onStoryChange }: ProductionStatusSectionProps) {
  const pipelineStatus = inferPipelineStatus(story);
  const activeIndex = PIPELINE_STEPS.findIndex((step) => step.id === pipelineStatus);

  return (
    <>
      <section className="reader-soft-panel rounded-2xl p-3.5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-secondary">Status produksi buku</span>
            <p className="mt-1 text-[11px] leading-5 text-secondary">
              Buku tetap draft sampai kamu publish, tetapi pipeline ini membantu melacak kesiapan konten.
            </p>
          </div>
          <select
            value={pipelineStatus}
            onChange={(event) => onStoryChange({
              ...story,
              pipelineStatus: event.target.value as NonNullable<Story['pipelineStatus']>,
            })}
            className="reader-field rounded-xl px-3 py-2 text-[11px] font-black"
          >
            {PIPELINE_STEPS.map((step) => (
              <option
                key={step.id}
                value={step.id}
                disabled={!hasCompleteStoryImages(story) && ['illustrated', 'enhanced', 'ready_to_publish'].includes(step.id)}
              >
                {step.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PIPELINE_STEPS.map((step, stepIndex) => (
            <div
              key={step.id}
              className={`rounded-xl px-2.5 py-2 text-[10px] font-black border ${
                stepIndex <= activeIndex
                  ? 'bg-brand-green/12 border-brand-green/35 text-brand-green'
                  : 'bg-surface border-default text-secondary'
              }`}
            >
              {step.label}
            </div>
          ))}
        </div>
      </section>

      {story.productionGuide && (
        <section className="rounded-2xl border border-brand-green/25 bg-brand-green/7 p-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-xs font-black">Acuan visual buku</span>
              <p className="mt-1 text-[11px] leading-5 text-secondary">
                Acuan ini otomatis dipakai setiap kali gambar halaman dibuat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black">
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">{visualPresetLabel(story.productionGuide.visualPreset)}</span>
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">{story.productionGuide.characterBible.length} karakter</span>
              <span className="rounded-lg bg-surface/70 px-2.5 py-1.5">{story.productionGuide.aspectRatio}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {story.productionGuide.characterBible.map((character) => (
              <article key={character.id} className="reader-field min-w-[15rem] max-w-[19rem] rounded-xl p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-xs">{character.name}</span>
                  <span className="text-[9px] font-black text-brand-green dark:text-brand-green">
                    {character.role === 'main' ? 'Tokoh utama' : character.role === 'supporting' ? 'Pendukung' : 'Latar'}
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-4 text-secondary">
                  {[character.speciesOrIdentity, character.outfit].filter(Boolean).join(' · ')}
                </p>
                {character.immutableTraits.length > 0 && (
                  <p className="mt-2 text-[10px] leading-4 font-bold">
                    Tetap: {character.immutableTraits.slice(0, 2).join(' · ')}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
