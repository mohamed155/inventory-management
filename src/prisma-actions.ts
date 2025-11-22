import type { PrismaClient } from '@prisma/client';
import { ipcMain } from 'electron';
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
} from '@/prisma/users.prisma.ts';
import type { User } from '../generated/prisma/client.ts';

export const initPrismaActions = (prisma: PrismaClient) => {
  ipcMain.handle('getUsers', () => getAllUsers(prisma));
  ipcMain.handle('getUserById', (_, id) => getUserById(prisma, id));
  ipcMain.handle('getUserByUsername', (_, username) =>
    getUserByUsername(prisma, username),
  );
  ipcMain.handle('getUsersCount', () => getUsersCount(prisma));
  ipcMain.handle('createUser', (_, user: User) => createUser(prisma, user));
};
