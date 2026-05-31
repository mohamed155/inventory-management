import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand/react';

interface InventoryState {
  activeInventoryId: string | null;
  setActiveInventoryId: (id: string) => void;
  clear: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      activeInventoryId: null,
      setActiveInventoryId: (id) => set({ activeInventoryId: id }),
      clear: () => set({ activeInventoryId: null }),
    }),
    {
      name: 'inventory',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
