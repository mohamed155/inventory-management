import type { UserModel } from '@/models/user.ts';
import type { User } from '../generated/prisma/browser.ts';

declare global {
  interface Window {
    electronAPI: {
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;

      closeWindow: () => void;
      maximizeWindow: () => void;
      minimizeWindow: () => void;
      restoreWindow: () => void;

      getUsers: () => Promise<User[]>;
      getUserById: (id: string) => Promise<User | null>;
      getUserByUsername: (username: string) => Promise<User | null>;
      getUsersCount: () => Promise<number>;
      createUser: (user: UserModel) => Promise<User>;
      signIn: (username: string, password: string) => Promise<User | null>;
    };
  }
}
