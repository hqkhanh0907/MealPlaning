import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import vi from './locales/vi.json';
import en from './locales/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage'], // Only localStorage — navigator excluded so first-install always defaults to 'vi' via fallbackLng
      lookupLocalStorage: 'mp-language',
      caches: ['localStorage'],
    },
  });

export default i18n;
