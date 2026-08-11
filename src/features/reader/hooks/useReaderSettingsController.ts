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

export function useReaderSettingsController() {
  const [settings, setSettings] = useState<ReadingSettings>(DEFAULT_READING_SETTINGS);
  const isNight = settings.themeMode === 'night';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isNight);
  }, [isNight]);

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
