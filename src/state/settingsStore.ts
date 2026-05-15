import { create } from 'zustand';
import { SettingsSchema, type Settings } from '@/lib/storage/schema';
import { readValidated, write } from '@/lib/storage/localStorage';

const STORAGE_KEY = 'settings';

function loadInitial(): Settings {
  return readValidated(STORAGE_KEY, SettingsSchema) ?? { language: 'fr' };
}

type SettingsState = Settings & {
  setLanguage: (lang: 'fr' | 'en') => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  ...loadInitial(),
  setLanguage: (language) => {
    set({ language });
    write(STORAGE_KEY, { language });
  },
}));
