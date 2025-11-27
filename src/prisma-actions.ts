import type { PrismaClient } from '@prisma/client';
import { ipcMain } from 'electron';
import type { Product, User } from '../generated/prisma/client.ts';
import type { DataParams } from './models/params.ts';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from './prisma/product.prisma.ts';
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
} from './prisma/users.prisma.ts';

export const initPrismaActions = (prisma: PrismaClient) => {
  ipcMain.handle('getUsers', () => getAllUsers(prisma));
  ipcMain.handle('getUserById', (_, id) => getUserById(prisma, id));
  ipcMain.handle('getUserByUsername', (_, username) =>
    getUserByUsername(prisma, username),
  );
  ipcMain.handle('getUsersCount', () => getUsersCount(prisma));
  ipcMain.handle('createUser', (_, user: User) => createUser(prisma, user));
  ipcMain.handle('signIn', (_, username, password) =>
    signIn(prisma, username, password),
  );

  ipcMain.handle('getAllProducts', (_, params: DataParams<Product>) =>
    getAllProducts(prisma, params),
  );
  ipcMain.handle('getProductById', (_, id: string) =>
    getProductById(prisma, id),
  );
  ipcMain.handle('createProduct', (_, product: Product) =>
    createProduct(prisma, product),
  );
  ipcMain.handle('updateProduct', (_, id: string, product: Product) =>
    updateProduct(prisma, id, product),
  );
  ipcMain.handle('deleteProduct', (_, id: string) => deleteProduct(prisma, id));
};
