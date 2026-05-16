import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './fr.json';
import en from './en.json';
import { useSettingsStore } from '@/state/settingsStore';

// Read the persisted language at startup
const initialLanguage = useSettingsStore.getState().language;

function syncDocumentLanguage(language: 'fr' | 'en') {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
}

syncDocumentLanguage(initialLanguage);

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
});

// Keep i18next and the settings store in sync.
// When the toggle calls setLanguage(), this listener forwards the change to i18next.
useSettingsStore.subscribe((state, prev) => {
  if (state.language !== prev.language) {
    syncDocumentLanguage(state.language);
    void i18n.changeLanguage(state.language);
  }
});

export default i18n;
