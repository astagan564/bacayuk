interface StoryMakerChoiceGroupProps {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}

export function StoryMakerChoiceGroup({
  label,
  options,
  value,
  onChange,
}: StoryMakerChoiceGroupProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-xs font-bold uppercase tracking-wider text-primary">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              value === option
                ? 'bg-brand-gold text-white shadow-md'
                : 'reader-soft-panel text-secondary hover:text-primary hover:bg-surface-hover border border-default'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
