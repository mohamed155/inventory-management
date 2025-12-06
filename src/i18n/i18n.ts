import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.ts';
import en from './locales/en.ts';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    ar: {
      translation: ar,
    },
  },
  lng: 'ar',
  fallbackLng: 'ar',
});
