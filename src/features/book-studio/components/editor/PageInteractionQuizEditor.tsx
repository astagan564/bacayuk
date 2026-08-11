import type { Dispatch, SetStateAction } from 'react';
import type { InteractiveElement, Story, StoryPage } from '@/types';

interface PageInteractionQuizEditorProps {
  story: Story;
  previewPageIndex: number;
  onStoryChange: Dispatch<SetStateAction<Story | null>>;
}

export function PageInteractionQuizEditor({
  story,
  previewPageIndex,
  onStoryChange,
}: PageInteractionQuizEditorProps) {
  return (
    <>
      {story.pages.length > 0 && (() => {
        const pageIndex = Math.min(previewPageIndex, story.pages.length - 1);
        const page = story.pages[pageIndex];
        const updatePage = (nextPage: StoryPage) => {
          const newPages = [...story.pages];
          newPages[pageIndex] = nextPage;
          onStoryChange({ ...story, pages: newPages });
        };

        return (
          <div className="reader-soft-panel p-3.5 rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-black text-xs uppercase text-secondary">
                Interaksi & kuis halaman {pageIndex + 1}
              </span>
              <button
                type="button"
                onClick={() => {
                  const nextElement: InteractiveElement = {
                    id: `elem_${Date.now()}`,
                    type: 'character',
                    label: 'Tokoh',
                    x: 50,
                    y: 50,
                    animation: 'bounce',
                    soundType: 'pop',
                    dialogue: 'Halo!',
                    emoji: '⭐',
                  };
                  updatePage({ ...page, interactiveElements: [...(page.interactiveElements || []), nextElement] });
                }}
                className="px-2.5 py-1 rounded-lg bg-brand-green hover:bg-brand-green/80 text-white font-bold text-[11px]"
              >
                + Elemen Interaktif
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {(page.interactiveElements || []).map((element, elemIdx) => (
                <div key={element.id || elemIdx} className="grid grid-cols-1 sm:grid-cols-[1fr_4rem_4rem_4rem_auto] gap-2 items-end rounded-xl bg-surface p-2">
                  <div>
                    <label className="block text-[10px] font-bold">Label & dialog</label>
                    <input
                      value={element.label}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], label: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                    <input
                      value={element.dialogue || ''}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], dialogue: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg mt-1"
                      placeholder="Dialog saat disentuh"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">Emoji</label>
                    <input
                      value={element.emoji || ''}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], emoji: e.target.value };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">X%</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={element.x}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], x: Number(e.target.value) };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold">Y%</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={element.y}
                      onChange={(e) => {
                        const updated = [...(page.interactiveElements || [])];
                        updated[elemIdx] = { ...updated[elemIdx], y: Number(e.target.value) };
                        updatePage({ ...page, interactiveElements: updated });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (page.interactiveElements || []).filter((_, i) => i !== elemIdx);
                      updatePage({ ...page, interactiveElements: updated });
                    }}
                    className="px-2 py-2 rounded-lg bg-error/10 text-error text-[10px] font-bold"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-surface p-3 flex flex-col gap-2">
              <label className="flex items-center gap-2 font-bold">
                <input
                  type="checkbox"
                  checked={Boolean(page.quizQuestion)}
                  onChange={(e) => {
                    updatePage({
                      ...page,
                      quizQuestion: e.target.checked
                        ? {
                            question: 'Apa pesan dari halaman ini?',
                            options: ['Berani mencoba', 'Menyerah', 'Tidak peduli', 'Marah-marah'],
                            answerIndex: 0,
                            explanation: 'Jawaban terbaik adalah berani mencoba dengan hati baik.',
                          }
                        : undefined,
                    });
                  }}
                />
                Kuis mini di halaman ini
              </label>
              {page.quizQuestion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <textarea
                    rows={2}
                    value={page.quizQuestion.question}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, question: e.target.value } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg sm:col-span-2"
                    placeholder="Pertanyaan"
                  />
                  {page.quizQuestion.options.map((option, optionIdx) => (
                    <input
                      key={optionIdx}
                      value={option}
                      onChange={(e) => {
                        const options = [...page.quizQuestion!.options];
                        options[optionIdx] = e.target.value;
                        updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, options } });
                      }}
                      className="reader-field w-full p-2 text-[11px] rounded-lg"
                      placeholder={`Pilihan ${optionIdx + 1}`}
                    />
                  ))}
                  <select
                    value={page.quizQuestion.answerIndex}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, answerIndex: Number(e.target.value) } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                  >
                    {page.quizQuestion.options.map((_, optionIdx) => (
                      <option key={optionIdx} value={optionIdx}>
                        Jawaban benar: pilihan {optionIdx + 1}
                      </option>
                    ))}
                  </select>
                  <input
                    value={page.quizQuestion.explanation}
                    onChange={(e) =>
                      updatePage({ ...page, quizQuestion: { ...page.quizQuestion!, explanation: e.target.value } })
                    }
                    className="reader-field w-full p-2 text-[11px] rounded-lg"
                    placeholder="Penjelasan jawaban"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

    </>
  );
}
