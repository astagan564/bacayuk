import { Moon, Music, Pause, Play, Sun, Type } from 'lucide-react';
import type { ReadingSettings } from '@/types';
import type { ReaderNavigationController } from '@/features/reader/hooks/useReaderNavigationController';
import { ReaderToggleRow } from '@/features/reader/components/navigation/ReaderControlPrimitives';

interface MobileReaderSettingsProps {
  controller: ReaderNavigationController;
  settings: ReadingSettings;
  onUpdateSettings: (newSettings: Partial<ReadingSettings>) => void;
}

const LANGUAGE_OPTIONS = [
  { mode: 'id', label: 'ID' },
  { mode: 'en', label: 'EN' },
  { mode: 'dual', label: 'ID + EN' },
] as const;

const MOBILE_FONT_SIZES = ['sm', 'base', 'lg', 'xl'] as const;

export function MobileReaderSettings({
  controller,
  settings,
  onUpdateSettings,
}: MobileReaderSettingsProps) {
  return (
    <>
      <div className="reader-soft-panel flex flex-col gap-3 rounded-2xl p-3">
        <span className="text-xs font-black text-secondary">Bahasa cerita</span>
        <div className="grid grid-cols-3 gap-2">
          {LANGUAGE_OPTIONS.map(({ mode, label }) => {
            const isActive = settings.languageMode === mode || (!settings.languageMode && mode === 'id');
            return (
              <button
                type="button"
                key={mode}
                onClick={() => onUpdateSettings({ languageMode: mode })}
                aria-pressed={isActive}
                className={`h-10 rounded-xl text-xs font-black transition-colors ${
                  isActive ? 'bg-brand-blue text-white' : 'bg-surface-hover text-secondary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="reader-soft-panel flex flex-col gap-2 rounded-2xl p-3">
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
        <button
          type="button"
          onClick={() => onUpdateSettings({ themeMode: controller.isNight ? 'day' : 'night' })}
          className="flex min-h-12 items-center justify-between gap-3 rounded-xl px-3 text-sm font-bold"
        >
          <span className="flex items-center gap-2">
            {controller.isNight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Tema
          </span>
          <span className="text-xs text-secondary">{controller.isNight ? 'Malam' : 'Siang'}</span>
        </button>
      </div>

      <div className="reader-soft-panel flex flex-col gap-2 rounded-2xl p-3">
        <span className="flex items-center gap-2 text-sm font-bold"><Type className="h-4 w-4" /> Ukuran teks</span>
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-surface-hover p-1">
          {MOBILE_FONT_SIZES.map((fontSize) => (
            <button
              type="button"
              key={fontSize}
              onClick={() => onUpdateSettings({ fontSize })}
              aria-pressed={settings.fontSize === fontSize}
              className={`min-h-10 rounded-lg text-[10px] font-black uppercase transition-colors ${
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
