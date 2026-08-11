import type { InteractiveElement } from '@/types';

interface StoryInteractiveElementsProps {
  elements?: InteractiveElement[];
  activeInteractive: InteractiveElement | null;
  animatedElementId: string | null;
  onInteractiveTap: (element: InteractiveElement) => void;
}

export function StoryInteractiveElements({
  elements,
  activeInteractive,
  animatedElementId,
  onInteractiveTap,
}: StoryInteractiveElementsProps) {
  return (
    <>
      {elements?.map((element) => {
        const isAnimated = animatedElementId === element.id;
        return (
          <button
            type="button"
            key={element.id}
            onClick={() => onInteractiveTap(element)}
            className={`group absolute z-20 grid min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/75 p-1.5 text-2xl shadow-lg backdrop-blur-sm transition-transform duration-300 hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 sm:text-3xl ${
              isAnimated ? 'scale-110 animate-bounce' : ''
            }`}
            style={{ left: `${element.x}%`, top: `${element.y}%` }}
            aria-label={element.label}
          >
            <span>{element.emoji || '✨'}</span>
            <span className="pointer-events-none absolute bottom-full mb-2 hidden whitespace-nowrap rounded-lg bg-primary/90 px-2 py-1 text-[10px] font-bold text-inverse shadow-md group-hover:block sm:block sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              {element.label}
            </span>
          </button>
        );
      })}

      {activeInteractive && elements?.some((element) => element.id === activeInteractive.id) && (
        <div className="absolute inset-x-4 bottom-4 z-30 mx-auto flex max-w-md items-center justify-center gap-2 rounded-xl border border-default bg-card/95 px-4 py-2.5 text-center text-xs font-semibold text-primary shadow-xl backdrop-blur-md sm:text-sm">
          <span>{activeInteractive.emoji}</span>
          <span>“{activeInteractive.dialogue || activeInteractive.label}”</span>
        </div>
      )}
    </>
  );
}
