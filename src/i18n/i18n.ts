import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useCurrentLang } from '@/store/lang.store.ts';
import ar from './locales/ar.ts';
import en from './locales/en.ts';

const currentLang = useCurrentLang.getState().lang;

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en,
    },
    ar: {
      translation: ar,
    },
  },
  lng: currentLang,
  fallbackLng: 'en',
});
