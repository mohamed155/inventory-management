import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand/react';

export type ColorToken =
  | 'violet'
  | 'blue'
  | 'green'
  | 'orange'
  | 'red'
  | 'zinc';
export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'SAR' | 'AED' | 'GBP';
export type DateFormatPattern = 'dd/MM/yyyy' | 'MM/dd/yyyy' | 'yyyy-MM-dd';

interface SettingsState {
  primaryColor: ColorToken;
  currency: CurrencyCode;
  dateFormat: DateFormatPattern;
  expiryWarningDays: number;
  lowStockThreshold: number;
  setPrimaryColor: (color: ColorToken) => void;
  setCurrency: (currency: CurrencyCode) => void;
  setDateFormat: (format: DateFormatPattern) => void;
  setExpiryWarningDays: (days: number) => void;
  setLowStockThreshold: (threshold: number) => void;
  resetSettings: () => void;
}

const defaults = {
  primaryColor: 'violet' as ColorToken,
  currency: 'EGP' as CurrencyCode,
  dateFormat: 'dd/MM/yyyy' as DateFormatPattern,
  expiryWarningDays: 10,
  lowStockThreshold: 10,
};

export const useCurrentSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setPrimaryColor: (primaryColor) => set({ primaryColor }),
      setCurrency: (currency) => set({ currency }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setExpiryWarningDays: (expiryWarningDays) => set({ expiryWarningDays }),
      setLowStockThreshold: (lowStockThreshold) => set({ lowStockThreshold }),
      resetSettings: () => set(defaults),
    }),
    {
      name: 'app-settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
