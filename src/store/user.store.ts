import { createJSONStorage, persist } from 'zustand/middleware';
import { create } from 'zustand/react';
import type { CurrentUser } from '@/models/user.ts';

interface UserState {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser) => void;
}

export const useCurrentUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
