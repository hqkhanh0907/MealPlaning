import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from '../locales/vi.json';

// Initialize i18n for tests — loads Vietnamese translations so existing assertions keep working.
i18n.use(initReactI18next).init({
  lng: 'vi',
  fallbackLng: 'vi',
  resources: { vi: { translation: vi } },
  interpolation: { escapeValue: false },
});
