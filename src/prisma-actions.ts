import { ipcMain } from 'electron';
import type {
  Customer,
  PrismaClient,
  ProductBatch,
  Provider,
  Purchase,
  Sale,
} from '../generated/prisma/client';
import type { Product, User } from '../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../generated/prisma/models/Customer.ts';
import type { ProductWhereInput } from '../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../generated/prisma/models/ProductBatch.ts';
import type { ProviderWhereInput } from '../generated/prisma/models/Provider.ts';
import type { PurchaseWhereInput } from '../generated/prisma/models/Purchase.ts';
import type { SaleWhereInput } from '../generated/prisma/models/Sale.ts';
import { ok } from './lib/ipc.ts';
import type { DataParams } from './models/params.ts';
import type { PurchaseFormData } from './models/purchase-form.ts';
import type { SaleFormData } from './models/sales-form.ts';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getAllCustomersPaginated,
  getCustomerById,
  updateCustomer,
} from './prisma-actions/customer.actions.ts';
import {
  getAllOverduePayments,
  getDueFromCustomers,
  getDueToProviders,
  getExpiringProducts,
  getLowStockProducts,
  getMonthlyChartData,
  getTopUpcomingPayingCustomers,
  getTopUpcomingPayingProviders,
  getTotalProfit,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
} from './prisma-actions/dashboard.actions.ts';
import {
  createInventory,
  deleteInventory,
  getAllInventories,
  getInventoriesCount,
  getInventoryById,
  updateInventory,
} from './prisma-actions/inventory.actions.ts';
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
  getProviderById,
  updateProvider,
} from './prisma-actions/provider.actions.ts';
import {
  createPurchase,
  deletePurchase,
  getAllPurchaseItems,
  getAllPurchases,
  getAllPurchasesPaginated,
  getPurchaseById,
  getPurchasesByProviderId,
  updatePurchase,
} from './prisma-actions/purchases.action.ts';
import {
  createSale,
  deleteSale,
  getAllSaleItems,
  getAllSales,
  getAllSalesPaginated,
  getSaleById,
  getSalesByCustomerId,
  updateSale,
} from './prisma-actions/sales.action.ts';
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
  updateUser,
} from './prisma-actions/users.action.ts';

export const initPrismaActions = (prisma: PrismaClient) => {
  // Inventory actions
  ipcMain.handle('getAllInventories', () => ok(() => getAllInventories(prisma)));
  ipcMain.handle('getInventoryById', (_, id: string) => ok(() => getInventoryById(prisma, id)));
  ipcMain.handle('getInventoriesCount', () => ok(() => getInventoriesCount(prisma)));
  ipcMain.handle('createInventory', (_, name: string) => ok(() => createInventory(prisma, name)));
  ipcMain.handle('updateInventory', (_, id: string, name: string) => ok(() => updateInventory(prisma, id, name)));
  ipcMain.handle('deleteInventory', (_, id: string) => ok(() => deleteInventory(prisma, id)));

  // Dashboard actions
  ipcMain.handle('getTotalSalesAmount', (_, inventoryId: string) =>
    ok(() => getTotalSalesAmount(prisma, inventoryId)),
  );
  ipcMain.handle('getTotalPurchasesAmount', (_, inventoryId: string) =>
    ok(() => getTotalPurchasesAmount(prisma, inventoryId)),
  );
  ipcMain.handle('getTotalProfit', (_, inventoryId: string) => ok(() => getTotalProfit(prisma, inventoryId)));
  ipcMain.handle('getDueFromCustomers', (_, inventoryId: string) =>
    ok(() => getDueFromCustomers(prisma, inventoryId)),
  );
  ipcMain.handle('getDueToProviders', (_, inventoryId: string) =>
    ok(() => getDueToProviders(prisma, inventoryId)),
  );
  ipcMain.handle('getAllOverduePayments', (_, inventoryId: string) =>
    ok(() => getAllOverduePayments(prisma, inventoryId)),
  );
  ipcMain.handle('getExpiringProducts', (_, inventoryId: string, days?: number) =>
    ok(() => getExpiringProducts(prisma, inventoryId, days)),
  );
  ipcMain.handle('getLowStockProducts', (_, inventoryId: string, threshold?: number) =>
    ok(() => getLowStockProducts(prisma, inventoryId, threshold)),
  );
  ipcMain.handle('getTopUpcomingPayingCustomers', (_, inventoryId: string) =>
    ok(() => getTopUpcomingPayingCustomers(prisma, inventoryId)),
  );
  ipcMain.handle('getTopUpcomingPayingProviders', (_, inventoryId: string) =>
    ok(() => getTopUpcomingPayingProviders(prisma, inventoryId)),
  );
  ipcMain.handle('getMonthlyChartData', (_, inventoryId: string) =>
    ok(() => getMonthlyChartData(prisma, inventoryId)),
  );

  // Users actions
  ipcMain.handle('getUsers', () => ok(() => getAllUsers(prisma)));
  ipcMain.handle('getUserById', (_, id) => ok(() => getUserById(prisma, id)));
  ipcMain.handle('getUserByUsername', (_, username) =>
    ok(() => getUserByUsername(prisma, username)),
  );
  ipcMain.handle('getUsersCount', () => ok(() => getUsersCount(prisma)));
  ipcMain.handle('createUser', (_, user: User) =>
    ok(() => createUser(prisma, user)),
  );
  ipcMain.handle('signIn', (_, username, password) =>
    ok(() => signIn(prisma, username, password)),
  );
  ipcMain.handle('updateUser', (_, id: string, data: Partial<User>) =>
    ok(() => updateUser(prisma, id, data)),
  );
  ipcMain.handle('deleteUser', (_, id: string) =>
    ok(() => deleteUser(prisma, id)),
  );

  // Products actions
  ipcMain.handle(
    'getAllProductsPaginated',
    (_, inventoryId: string, params: DataParams<Product, ProductWhereInput>) =>
      ok(() => getAllProductsPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllProducts', (_, inventoryId: string) => ok(() => getAllProducts(prisma, inventoryId)));
  ipcMain.handle('getProductById', (_, id: string) =>
    ok(() => getProductById(prisma, id)),
  );
  ipcMain.handle('createProduct', (_, inventoryId: string, product: Product) =>
    ok(() => createProduct(prisma, inventoryId, product)),
  );
  ipcMain.handle('updateProduct', (_, id: string, product: Product) =>
    ok(() => updateProduct(prisma, id, product)),
  );
  ipcMain.handle('deleteProduct', (_, id: string) =>
    ok(() => deleteProduct(prisma, id)),
  );

  // Product Batches actions
  ipcMain.handle(
    'getAllProductBatchesPaginated',
    (
      _,
      inventoryId: string,
      params: DataParams<
        Product & ProductBatch,
        ProductBatchWhereInput & { product?: ProductWhereInput }
      >,
    ) => ok(() => getAllProductBatchesPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllProductBatches', (_, inventoryId: string) =>
    ok(() => getAllProductBatches(prisma, inventoryId)),
  );
  ipcMain.handle('getProductBatch', (_, id: string) =>
    ok(() => getProductBatch(prisma, id)),
  );
  ipcMain.handle(
    'createProductBatch',
    (_, inventoryId: string, productBatch: Product & ProductBatch) =>
      ok(() => createProductBatch(prisma, inventoryId, productBatch)),
  );
  ipcMain.handle(
    'updateProductBatch',
    (_, id: string, productBatch: Product & ProductBatch) =>
      ok(() => updateProductBatch(prisma, id, productBatch)),
  );
  ipcMain.handle('deleteProductBatch', (_, id: string) =>
    ok(() => deleteProductBatch(prisma, id)),
  );

  // Customers actions
  ipcMain.handle(
    'getAllCustomersPaginated',
    (_, inventoryId: string, params: DataParams<Customer, CustomerWhereInput>) =>
      ok(() => getAllCustomersPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllCustomers', (_, inventoryId: string) => ok(() => getAllCustomers(prisma, inventoryId)));
  ipcMain.handle('getCustomerById', (_, id: string) =>
    ok(() => getCustomerById(prisma, id)),
  );
  ipcMain.handle('createCustomer', (_, inventoryId: string, customer: Customer) =>
    ok(() => createCustomer(prisma, inventoryId, customer)),
  );
  ipcMain.handle('updateCustomer', (_, id: string, customer: Customer) =>
    ok(() => updateCustomer(prisma, id, customer)),
  );
  ipcMain.handle('deleteCustomer', (_, id: string) =>
    ok(() => deleteCustomer(prisma, id)),
  );

  // Providers actions
  ipcMain.handle(
    'getAllProvidersPaginated',
    (_, inventoryId: string, params: DataParams<Provider, ProviderWhereInput>) =>
      ok(() => getAllProvidersPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllProviders', (_, inventoryId: string) => ok(() => getAllProviders(prisma, inventoryId)));
  ipcMain.handle('getProviderById', (_, id: string) =>
    ok(() => getProviderById(prisma, id)),
  );
  ipcMain.handle('createProvider', (_, inventoryId: string, provider: Provider) =>
    ok(() => createProvider(prisma, inventoryId, provider)),
  );
  ipcMain.handle('updateProvider', (_, id: string, provider: Provider) =>
    ok(() => updateProvider(prisma, id, provider)),
  );
  ipcMain.handle('deleteProvider', (_, id: string) =>
    ok(() => deleteProvider(prisma, id)),
  );

  // Purchases actions
  ipcMain.handle(
    'getAllPurchasesPaginated',
    (_, inventoryId: string, params: DataParams<Purchase, PurchaseWhereInput>) =>
      ok(() => getAllPurchasesPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllPurchases', (_, inventoryId: string) => ok(() => getAllPurchases(prisma, inventoryId)));
  ipcMain.handle('getPurchaseById', (_, id: string) =>
    ok(() => getPurchaseById(prisma, id)),
  );
  ipcMain.handle('createPurchase', (_, inventoryId: string, data: PurchaseFormData) =>
    ok(() => createPurchase(prisma, inventoryId, data)),
  );
  ipcMain.handle('updatePurchase', (_, id: string, purchase: Purchase) =>
    ok(() => updatePurchase(prisma, id, purchase)),
  );
  ipcMain.handle('deletePurchase', (_, id: string) =>
    ok(() => deletePurchase(prisma, id)),
  );
  ipcMain.handle('getAllPurchaseItems', (_, purchaseId: string) =>
    ok(() => getAllPurchaseItems(prisma, purchaseId)),
  );
  ipcMain.handle('getPurchasesByProviderId', (_, inventoryId: string, providerId: string) =>
    ok(() => getPurchasesByProviderId(prisma, inventoryId, providerId)),
  );

  // Sales actions
  ipcMain.handle(
    'getAllSalesPaginated',
    (_, inventoryId: string, params: DataParams<Sale, SaleWhereInput>) =>
      ok(() => getAllSalesPaginated(prisma, inventoryId, params)),
  );
  ipcMain.handle('getAllSales', (_, inventoryId: string) => ok(() => getAllSales(prisma, inventoryId)));
  ipcMain.handle('getSaleById', (_, id: string) =>
    ok(() => getSaleById(prisma, id)),
  );
  ipcMain.handle('createSale', (_, inventoryId: string, data: SaleFormData) =>
    ok(() => createSale(prisma, inventoryId, data)),
  );
  ipcMain.handle('updateSale', (_, id: string, sale: Sale) =>
    ok(() => updateSale(prisma, id, sale)),
  );
  ipcMain.handle('deleteSale', (_, id: string) =>
    ok(() => deleteSale(prisma, id)),
  );
  ipcMain.handle('getAllSaleItems', (_, saleId: string) =>
    ok(() => getAllSaleItems(prisma, saleId)),
  );
  ipcMain.handle('getSalesByCustomerId', (_, inventoryId: string, customerId: string) =>
    ok(() => getSalesByCustomerId(prisma, inventoryId, customerId)),
  );
};
