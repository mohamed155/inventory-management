import { ipcMain } from 'electron';
import type { PrismaClient } from '../generated/prisma/client';
import type { Product, User } from '../generated/prisma/client.ts';
import type { DataParams } from './models/params.ts';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getAllProductsPaginated,
  getProductById,
  updateProduct,
} from './prisma-actions/product.action.ts';
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
} from './prisma-actions/users.action.ts';

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

  ipcMain.handle('getAllProductsPaginated', (_, params: DataParams<Product>) =>
    getAllProductsPaginated(prisma, params),
  );
  ipcMain.handle('getAllProducts', () => getAllProducts(prisma));
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
