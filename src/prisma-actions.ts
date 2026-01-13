import { ipcMain } from 'electron';
import type {
  Customer,
  PrismaClient,
  ProductBatch,
  Provider,
  Purchase,
} from '../generated/prisma/client';
import type { Product, User } from '../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../generated/prisma/models/Customer.ts';
import type { ProductWhereInput } from '../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../generated/prisma/models/ProductBatch.ts';
import type { ProviderWhereInput } from '../generated/prisma/models/Provider.ts';
import type { PurchaseWhereInput } from '../generated/prisma/models/Purchase.ts';
import type { DataParams } from './models/params.ts';
import type { PurchaseFormData } from './models/purchase-form.ts';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getAllCustomersPaginated,
  updateCustomer,
} from './prisma-actions/customer.actions.ts';
import {
  createProduct,
  createProductBatch,
  deleteProduct,
  deleteProductBatch,
  getAllProductBatches,
  getAllProductBatchesPaginated,
  getAllProducts,
  getAllProductsPaginated,
  getProductBatch,
  getProductById,
  updateProduct,
  updateProductBatch,
} from './prisma-actions/product.action.ts';
import {
  createProvider,
  deleteProvider,
  getAllProviders,
  getAllProvidersPaginated,
  updateProvider,
} from './prisma-actions/provider.actions.ts';
import {
  createPurchase,
  deletePurchase,
  getAllPurchaseItems,
  getAllPurchases,
  getAllPurchasesPaginated,
  getPurchaseById,
  updatePurchase,
} from './prisma-actions/purchases.action.ts';
import {
  createUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
} from './prisma-actions/users.action.ts';

export const initPrismaActions = (prisma: PrismaClient) => {
  // Users actions
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

  // Products actions
  ipcMain.handle(
    'getAllProductsPaginated',
    (_, params: DataParams<Product, ProductWhereInput>) =>
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

  // Product Batches actions
  ipcMain.handle(
    'getAllProductBatchesPaginated',
    (
      _,
      params: DataParams<
        Product & ProductBatch,
        ProductBatchWhereInput & { product: ProductWhereInput }
      >,
    ) => getAllProductBatchesPaginated(prisma, params),
  );
  ipcMain.handle('getAllProductBatches', () => getAllProductBatches(prisma));
  ipcMain.handle('getProductBatch', (_, id: string) =>
    getProductBatch(prisma, id),
  );
  ipcMain.handle(
    'createProductBatch',
    (_, productBatch: Product & ProductBatch) =>
      createProductBatch(prisma, productBatch),
  );
  ipcMain.handle(
    'updateProductBatch',
    (_, id: string, productBatch: Product & ProductBatch) =>
      updateProductBatch(prisma, id, productBatch),
  );
  ipcMain.handle('deleteProductBatch', (_, id: string) =>
    deleteProductBatch(prisma, id),
  );

  // Customers actions
  ipcMain.handle(
    'getAllCustomersPaginated',
    (_, params: DataParams<Customer, CustomerWhereInput>) =>
      getAllCustomersPaginated(prisma, params),
  );
  ipcMain.handle('getAllCustomers', () => getAllCustomers(prisma));
  ipcMain.handle('getCustomerById', (_, id: string) =>
    getProductById(prisma, id),
  );
  ipcMain.handle('createCustomer', (_, customer: Customer) =>
    createCustomer(prisma, customer),
  );
  ipcMain.handle('updateCustomer', (_, id: string, customer: Customer) =>
    updateCustomer(prisma, id, customer),
  );
  ipcMain.handle('deleteCustomer', (_, id: string) =>
    deleteCustomer(prisma, id),
  );

  // Providers actions
  ipcMain.handle(
    'getAllProvidersPaginated',
    (_, params: DataParams<Provider, ProviderWhereInput>) =>
      getAllProvidersPaginated(prisma, params),
  );
  ipcMain.handle('getAllProviders', () => getAllProviders(prisma));
  ipcMain.handle('getProviderById', (_, id: string) =>
    getProductById(prisma, id),
  );
  ipcMain.handle('createProvider', (_, provider: Provider) =>
    createProvider(prisma, provider),
  );
  ipcMain.handle('updateProvider', (_, id: string, provider: Provider) =>
    updateProvider(prisma, id, provider),
  );
  ipcMain.handle('deleteProvider', (_, id: string) =>
    deleteProvider(prisma, id),
  );

  // Purchases actions
  ipcMain.handle(
    'getAllPurchasesPaginated',
    (_, params: DataParams<Purchase, PurchaseWhereInput>) =>
      getAllPurchasesPaginated(prisma, params),
  );
  ipcMain.handle('getAllPurchases', (_) => getAllPurchases(prisma));
  ipcMain.handle('getPurchaseById', (_, id: string) =>
    getPurchaseById(prisma, id),
  );
  ipcMain.handle('createPurchase', (_, data: PurchaseFormData) =>
    createPurchase(prisma, data),
  );
  ipcMain.handle('updatePurchase', (_, id: string, purchase: Purchase) =>
    updatePurchase(prisma, id, purchase),
  );
  ipcMain.handle('deletePurchase', (_, id: string) =>
    deletePurchase(prisma, id),
  );
  ipcMain.handle('getAllPurchaseItems', (_, purchaseId: string) =>
    getAllPurchaseItems(prisma, purchaseId),
  );
};
