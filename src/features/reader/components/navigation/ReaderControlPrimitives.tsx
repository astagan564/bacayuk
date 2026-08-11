import type { LucideIcon } from 'lucide-react';

interface ReaderSectionLabelProps {
  text: string;
}

export function ReaderSectionLabel({ text }: ReaderSectionLabelProps) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex-1 h-px border-t border-default" />
      <span className="text-[10px] font-black uppercase text-secondary">{text}</span>
      <div className="flex-1 h-px border-t border-default" />
    </div>
  );
}

interface ReaderToggleRowProps {
  label: string;
  icon: LucideIcon;
  isOn: boolean;
  onClick: () => void;
}

export function ReaderToggleRow({
  label,
  icon: Icon,
  isOn,
  onClick,
}: ReaderToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isOn}
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isOn ? 'bg-brand-green text-white' : 'reader-soft-panel text-primary'
      }`}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="w-4 h-4 shrink-0" />
        {label}
      </span>
      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${isOn ? 'bg-white/20' : 'bg-surface-hover'}`}>
        {isOn ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
