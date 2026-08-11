import { Moon, Music, Pause, Play, Sun, Type } from 'lucide-react';
import type { ReadingSettings } from '@/types';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import {
  ReaderSectionLabel,
  ReaderToggleRow,
} from '@/features/reader/components/navigation/ReaderControlPrimitives';

interface DesktopReaderSettingsProps {
  controller: ReaderNavigationController;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
}

const LANGUAGE_OPTIONS = [
  { mode: 'id', label: 'ID' },
  { mode: 'en', label: 'EN' },
  { mode: 'dual', label: 'ID+EN' },
] as const;

const DESKTOP_FONT_SIZES = ['sm', 'base', 'lg'] as const;

export function DesktopReaderSettings({
  controller,
  settings,
  onUpdateSettings,
}: DesktopReaderSettingsProps) {
  return (
    <>
      <ReaderSectionLabel text="Bahasa" />
      <div className="reader-soft-panel grid grid-cols-3 gap-1 rounded-xl p-1">
        {LANGUAGE_OPTIONS.map(({ mode, label }) => {
          const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
          return (
            <button
              type="button"
              key={mode}
              onClick={() => onUpdateSettings({ languageMode: mode })}
              aria-pressed={isActive}
              className={`rounded-lg py-2 text-xs font-black transition-all ${
                isActive ? 'bg-brand-blue text-white' : 'text-secondary'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <ReaderSectionLabel text="Pengaturan" />
      <button
        type="button"
        onClick={() => onUpdateSettings({ themeMode: controller.isNight ? 'day' : 'night' })}
        className="reader-soft-panel flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
      >
        <span className="flex items-center gap-2.5">
          {controller.isNight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          Tema
        </span>
        <span className="rounded-lg bg-surface-hover px-2 py-0.5 text-[10px] font-black">
          {controller.isNight ? 'Malam' : 'Siang'}
        </span>
      </button>
      <ReaderToggleRow
        label="Putar otomatis"
        icon={settings.autoPlay ? Pause : Play}
        isOn={settings.autoPlay}
        onClick={() => onUpdateSettings({ autoPlay: !settings.autoPlay })}
      />
      <ReaderToggleRow
        label="Musik latar"
        icon={Music}
        isOn={settings.bgMusic}
        onClick={controller.toggleBackgroundMusic}
      />

      <div className="reader-soft-panel flex items-center justify-between gap-2 rounded-xl px-3 py-2.5">
        <span className="flex shrink-0 items-center gap-2.5 text-sm font-semibold">
          <Type className="h-4 w-4 shrink-0" />
          Ukuran teks
        </span>
        <div className="flex items-center gap-0.5 rounded-lg bg-surface-hover p-0.5">
          {DESKTOP_FONT_SIZES.map((fontSize) => (
            <button
              type="button"
              key={fontSize}
              onClick={() => onUpdateSettings({ fontSize })}
              aria-pressed={settings.fontSize === fontSize}
              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase transition-colors ${
                settings.fontSize === fontSize ? 'bg-brand-blue text-white' : 'text-secondary'
              }`}
            >
              {fontSize}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
