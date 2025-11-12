import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand/react';
import type { CurrentUser } from '@/models/user.ts';

export const useCurrentUserStore = create()(
  persist(
    (set: (value: any) => void) => ({
      currentUser: null,
      setCurrentUser: (user: CurrentUser) => set({ currentUser: user }),
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
