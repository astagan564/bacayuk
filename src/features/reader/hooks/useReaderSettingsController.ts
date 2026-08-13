import { useCallback, useEffect, useState } from 'react';
import type { ReadingSettings } from '@/types';

const DEFAULT_READING_SETTINGS: ReadingSettings = {
  autoPlay: false,
  autoPlayDelay: 4,
  soundFx: true,
  pageAudioFx: true,
  bgMusic: false,
  speechRate: 0.9,
  speechPitch: 1,
  fontSize: 'base',
  displayView: 'double',
  themeMode: 'day',
  languageMode: 'id',
};

const READER_SETTINGS_KEY = 'bacayuk_reader_settings_v1';

function loadReadingSettings(): ReadingSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(READER_SETTINGS_KEY) || '{}') as Partial<ReadingSettings>;
    return {
      ...DEFAULT_READING_SETTINGS,
      ...saved,
      themeMode: saved.themeMode === 'night' ? 'night' : 'day',
    };
  } catch {
    return DEFAULT_READING_SETTINGS;
  }
}

export function useReaderSettingsController() {
  const [settings, setSettings] = useState<ReadingSettings>(loadReadingSettings);
  const isNight = settings.themeMode === 'night';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isNight);
    try {
      localStorage.setItem(READER_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Keep the active React state when browser storage is unavailable.
    }
  }, [isNight, settings]);

  const updateSettings = useCallback((updates: Partial<ReadingSettings>) => {
    setSettings((currentSettings) => ({ ...currentSettings, ...updates }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      themeMode: currentSettings.themeMode === 'night' ? 'day' : 'night',
    }));
  }, []);

  return {
    settings,
    isNight,
    updateSettings,
    toggleTheme,
  };
}

export type ReaderSettingsController = ReturnType<typeof useReaderSettingsController>;
