import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand/react';

interface LangState {
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
}

export const useCurrentLang = create<LangState>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    {
      name: 'lang',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
