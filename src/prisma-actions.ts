import type { PrismaClient } from '@prisma/client';
import { ipcMain } from 'electron';

export const initPrismaActions = (prisma: PrismaClient) => {
  ipcMain.handle('getUsers', () => {
    return prisma.user.findMany();
  });

  ipcMain.handle('getUserById', (_, id) => {
    return prisma.user.findUnique({
      where: { id },
    });
  });

  ipcMain.handle('getUserByUsername', (_, username) => {
    return prisma.user.findUnique({
      where: { username },
    });
  });

  ipcMain.handle('getUsersCount', () => {
    return prisma.user.count();
  });

  ipcMain.handle('createUser', (_, user) => {
    return prisma.user.create({
      data: user,
    });
  });
};
