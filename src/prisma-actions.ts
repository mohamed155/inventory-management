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
  getAllUsers,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
} from './prisma-actions/users.action.ts';

export const initPrismaActions = (prisma: PrismaClient) => {
  // Dashboard actions
  ipcMain.handle('getTotalSalesAmount', () =>
    ok(() => getTotalSalesAmount(prisma)),
  );
  ipcMain.handle('getTotalPurchasesAmount', () =>
    ok(() => getTotalPurchasesAmount(prisma)),
  );
  ipcMain.handle('getTotalProfit', () => ok(() => getTotalProfit(prisma)));
  ipcMain.handle('getDueFromCustomers', () =>
    ok(() => getDueFromCustomers(prisma)),
  );
  ipcMain.handle('getDueToProviders', () =>
    ok(() => getDueToProviders(prisma)),
  );
  ipcMain.handle('getAllOverduePayments', () =>
    ok(() => getAllOverduePayments(prisma)),
  );
  ipcMain.handle('getExpiringProducts', (_, days?: number) =>
    ok(() => getExpiringProducts(prisma, days)),
  );
  ipcMain.handle('getLowStockProducts', (_, threshold?: number) =>
    ok(() => getLowStockProducts(prisma, threshold)),
  );
  ipcMain.handle('getTopUpcomingPayingCustomers', () =>
    ok(() => getTopUpcomingPayingCustomers(prisma)),
  );
  ipcMain.handle('getTopUpcomingPayingProviders', () =>
    ok(() => getTopUpcomingPayingProviders(prisma)),
  );
  ipcMain.handle('getMonthlyChartData', () =>
    ok(() => getMonthlyChartData(prisma)),
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

  // Products actions
  ipcMain.handle(
    'getAllProductsPaginated',
    (_, params: DataParams<Product, ProductWhereInput>) =>
      ok(() => getAllProductsPaginated(prisma, params)),
  );
  ipcMain.handle('getAllProducts', () => ok(() => getAllProducts(prisma)));
  ipcMain.handle('getProductById', (_, id: string) =>
    ok(() => getProductById(prisma, id)),
  );
  ipcMain.handle('createProduct', (_, product: Product) =>
    ok(() => createProduct(prisma, product)),
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
      params: DataParams<
        Product & ProductBatch,
        ProductBatchWhereInput & { product: ProductWhereInput }
      >,
    ) => ok(() => getAllProductBatchesPaginated(prisma, params)),
  );
  ipcMain.handle('getAllProductBatches', () =>
    ok(() => getAllProductBatches(prisma)),
  );
  ipcMain.handle('getProductBatch', (_, id: string) =>
    ok(() => getProductBatch(prisma, id)),
  );
  ipcMain.handle(
    'createProductBatch',
    (_, productBatch: Product & ProductBatch) =>
      ok(() => createProductBatch(prisma, productBatch)),
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
    (_, params: DataParams<Customer, CustomerWhereInput>) =>
      ok(() => getAllCustomersPaginated(prisma, params)),
  );
  ipcMain.handle('getAllCustomers', () => ok(() => getAllCustomers(prisma)));
  ipcMain.handle('getCustomerById', (_, id: string) =>
    ok(() => getCustomerById(prisma, id)),
  );
  ipcMain.handle('createCustomer', (_, customer: Customer) =>
    ok(() => createCustomer(prisma, customer)),
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
    (_, params: DataParams<Provider, ProviderWhereInput>) =>
      ok(() => getAllProvidersPaginated(prisma, params)),
  );
  ipcMain.handle('getAllProviders', () => ok(() => getAllProviders(prisma)));
  ipcMain.handle('getProviderById', (_, id: string) =>
    ok(() => getProviderById(prisma, id)),
  );
  ipcMain.handle('createProvider', (_, provider: Provider) =>
    ok(() => createProvider(prisma, provider)),
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
    (_, params: DataParams<Purchase, PurchaseWhereInput>) =>
      ok(() => getAllPurchasesPaginated(prisma, params)),
  );
  ipcMain.handle('getAllPurchases', () => ok(() => getAllPurchases(prisma)));
  ipcMain.handle('getPurchaseById', (_, id: string) =>
    ok(() => getPurchaseById(prisma, id)),
  );
  ipcMain.handle('createPurchase', (_, data: PurchaseFormData) =>
    ok(() => createPurchase(prisma, data)),
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
  ipcMain.handle('getPurchasesByProviderId', (_, providerId: string) =>
    ok(() => getPurchasesByProviderId(prisma, providerId)),
  );

  // Sales actions
  ipcMain.handle(
    'getAllSalesPaginated',
    (_, params: DataParams<Sale, SaleWhereInput>) =>
      ok(() => getAllSalesPaginated(prisma, params)),
  );
  ipcMain.handle('getAllSales', () => ok(() => getAllSales(prisma)));
  ipcMain.handle('getSaleById', (_, id: string) =>
    ok(() => getSaleById(prisma, id)),
  );
  ipcMain.handle('createSale', (_, data: SaleFormData) =>
    ok(() => createSale(prisma, data)),
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
  ipcMain.handle('getSalesByCustomerId', (_, customerId: string) =>
    ok(() => getSalesByCustomerId(prisma, customerId)),
  );
};
