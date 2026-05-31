import { contextBridge, ipcRenderer } from 'electron';
import type {
  Customer,
  Product,
  ProductBatch,
  Provider,
  Purchase,
  Sale,
  User,
} from '../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../generated/prisma/models/Customer.ts';
import type { ProductWhereInput } from '../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../generated/prisma/models/ProductBatch.ts';
import type { ProviderWhereInput } from '../generated/prisma/models/Provider.ts';
import type { SaleWhereInput } from '../generated/prisma/models/Sale.ts';
import type { DataParams } from './models/params.ts';
import type { PurchaseFormData } from './models/purchase-form.ts';
import type { SaleFormData } from './models/sales-form.ts';

contextBridge.exposeInMainWorld('electronAPI', {
  // properties
  isMaximized: () => ipcRenderer.invoke('is-maximized'),
  platform: () => ipcRenderer.invoke('platform'),

  // callbacks
  onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
    ipcRenderer.on('window-maximized', (_, isMaximized) =>
      callback(isMaximized),
    ),
  onUpdateDownloaded: (callback: () => void) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  installUpdate: () => ipcRenderer.send('install-update'),

  // window methods
  closeWindow: () => ipcRenderer.send('close-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),

  // inventory actions
  getAllInventories: () => ipcRenderer.invoke('getAllInventories'),
  getInventoryById: (id: string) => ipcRenderer.invoke('getInventoryById', id),
  getInventoriesCount: () => ipcRenderer.invoke('getInventoriesCount'),
  createInventory: (name: string) => ipcRenderer.invoke('createInventory', name),
  updateInventory: (id: string, name: string) => ipcRenderer.invoke('updateInventory', id, name),
  deleteInventory: (id: string) => ipcRenderer.invoke('deleteInventory', id),

  // prisma-actions actions
  createUser: (user: User) => ipcRenderer.invoke('createUser', user),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  getUserById: (id: string) => ipcRenderer.invoke('getUserById', id),
  getUserByUsername: (username: string) =>
    ipcRenderer.invoke('getUserByUsername', username),
  getUsersCount: () => ipcRenderer.invoke('getUsersCount'),
  signIn: (username: string, password: string) =>
    ipcRenderer.invoke('signIn', username, password),
  updateUser: (id: string, data: Partial<User>) =>
    ipcRenderer.invoke('updateUser', id, data),
  deleteUser: (id: string) => ipcRenderer.invoke('deleteUser', id),

  // products actions
  getAllProductsPaginated: (inventoryId: string, params: DataParams<Product, ProductWhereInput>) =>
    ipcRenderer.invoke('getAllProductsPaginated', inventoryId, params),
  getAllProducts: (inventoryId: string) => ipcRenderer.invoke('getAllProducts', inventoryId),
  getProductById: (id: string) => ipcRenderer.invoke('getProductById', id),
  createProduct: (inventoryId: string, product: Product) =>
    ipcRenderer.invoke('createProduct', inventoryId, product),
  updateProduct: (id: string, product: Product) =>
    ipcRenderer.invoke('updateProduct', id, product),
  deleteProduct: (id: string) => ipcRenderer.invoke('deleteProduct', id),

  getAllProductBatchesPaginated: (
    inventoryId: string,
    params: DataParams<
      Product & ProductBatch,
      ProductBatchWhereInput & { product: ProductWhereInput }
    >,
  ) => ipcRenderer.invoke('getAllProductBatchesPaginated', inventoryId, params),
  getAllProductBatches: (inventoryId: string) => ipcRenderer.invoke('getAllProductBatches', inventoryId),
  getProductBatchById: (id: string) =>
    ipcRenderer.invoke('getProductBatch', id),
  createProductBatch: (inventoryId: string, productBatch: Product & ProductBatch) =>
    ipcRenderer.invoke('createProductBatch', inventoryId, productBatch),
  updateProductBatch: (id: string, productBatch: Product & ProductBatch) =>
    ipcRenderer.invoke('updateProductBatch', id, productBatch),
  deleteProductBatch: (id: string) =>
    ipcRenderer.invoke('deleteProductBatch', id),

  // customer actions
  getAllCustomersPaginated: (
    inventoryId: string,
    params: DataParams<Customer, CustomerWhereInput>,
  ) => ipcRenderer.invoke('getAllCustomersPaginated', inventoryId, params),
  getAllCustomers: (inventoryId: string) => ipcRenderer.invoke('getAllCustomers', inventoryId),
  getCustomerById: (id: string) => ipcRenderer.invoke('getCustomerById', id),
  createCustomer: (inventoryId: string, customer: Customer) =>
    ipcRenderer.invoke('createCustomer', inventoryId, customer),
  updateCustomer: (id: string, customer: Customer) =>
    ipcRenderer.invoke('updateCustomer', id, customer),
  deleteCustomer: (id: string) => ipcRenderer.invoke('deleteCustomer', id),

  // provider actions
  getAllProvidersPaginated: (
    inventoryId: string,
    params: DataParams<Provider, ProviderWhereInput>,
  ) => ipcRenderer.invoke('getAllProvidersPaginated', inventoryId, params),
  getAllProviders: (inventoryId: string) => ipcRenderer.invoke('getAllProviders', inventoryId),
  getProviderById: (id: string) => ipcRenderer.invoke('getProviderById', id),
  createProvider: (inventoryId: string, provider: Provider) =>
    ipcRenderer.invoke('createProvider', inventoryId, provider),
  updateProvider: (id: string, provider: Provider) =>
    ipcRenderer.invoke('updateProvider', id, provider),
  deleteProvider: (id: string) => ipcRenderer.invoke('deleteProvider', id),

  // purchase actions
  getAllPurchasesPaginated: (inventoryId: string, params: DataParams<Purchase, ProductWhereInput>) =>
    ipcRenderer.invoke('getAllPurchasesPaginated', inventoryId, params),
  getAllPurchases: (inventoryId: string) => ipcRenderer.invoke('getAllPurchases', inventoryId),
  getPurchaseById: (id: string) => ipcRenderer.invoke('getPurchaseById', id),
  createPurchase: (inventoryId: string, body: PurchaseFormData) =>
    ipcRenderer.invoke('createPurchase', inventoryId, body),
  updatePurchase: (id: string, purchase: Purchase) =>
    ipcRenderer.invoke('updatePurchase', id, purchase),
  deletePurchase: (id: string) => ipcRenderer.invoke('deletePurchase', id),
  getAllPurchaseItems: (purchaseId: string) =>
    ipcRenderer.invoke('getAllPurchaseItems', purchaseId),
  getPurchasesByProviderId: (inventoryId: string, providerId: string) =>
    ipcRenderer.invoke('getPurchasesByProviderId', inventoryId, providerId),

  // sale actions
  getAllSalesPaginated: (inventoryId: string, params: DataParams<Sale, SaleWhereInput>) =>
    ipcRenderer.invoke('getAllSalesPaginated', inventoryId, params),
  getAllSales: (inventoryId: string) => ipcRenderer.invoke('getAllSales', inventoryId),
  getSaleById: (id: string) => ipcRenderer.invoke('getSaleById', id),
  createSale: (inventoryId: string, body: SaleFormData) => ipcRenderer.invoke('createSale', inventoryId, body),
  updateSale: (id: string, sale: Partial<Sale>) =>
    ipcRenderer.invoke('updateSale', id, sale),
  deleteSale: (id: string) => ipcRenderer.invoke('deleteSale', id),
  getAllSaleItems: (saleId: string) =>
    ipcRenderer.invoke('getAllSaleItems', saleId),
  getSalesByCustomerId: (inventoryId: string, customerId: string) =>
    ipcRenderer.invoke('getSalesByCustomerId', inventoryId, customerId),

  // dashboard actions
  getDueFromCustomers: (inventoryId: string) => ipcRenderer.invoke('getDueFromCustomers', inventoryId),
  getDueToProviders: (inventoryId: string) => ipcRenderer.invoke('getDueToProviders', inventoryId),
  getTotalProfit: (inventoryId: string) => ipcRenderer.invoke('getTotalProfit', inventoryId),
  getTotalPurchasesAmount: (inventoryId: string) => ipcRenderer.invoke('getTotalPurchasesAmount', inventoryId),
  getTotalSalesAmount: (inventoryId: string) => ipcRenderer.invoke('getTotalSalesAmount', inventoryId),
  getAllOverduePayments: (inventoryId: string) => ipcRenderer.invoke('getAllOverduePayments', inventoryId),
  getExpiringProducts: (inventoryId: string, days?: number) =>
    ipcRenderer.invoke('getExpiringProducts', inventoryId, days),
  getLowStockProducts: (inventoryId: string, threshold?: number) =>
    ipcRenderer.invoke('getLowStockProducts', inventoryId, threshold),
  getTopUpcomingPayingCustomers: (inventoryId: string) =>
    ipcRenderer.invoke('getTopUpcomingPayingCustomers', inventoryId),
  getTopUpcomingPayingProviders: (inventoryId: string) =>
    ipcRenderer.invoke('getTopUpcomingPayingProviders', inventoryId),
  getMonthlyChartData: (inventoryId: string) => ipcRenderer.invoke('getMonthlyChartData', inventoryId),
});
