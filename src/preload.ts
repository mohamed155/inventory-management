import { contextBridge, ipcRenderer } from 'electron';
import type {
  Customer,
  Product,
  ProductBatch,
  Provider,
  Purchase,
  User,
} from '../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../generated/prisma/models/Customer.ts';
import type { ProductWhereInput } from '../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../generated/prisma/models/ProductBatch.ts';
import type { ProviderWhereInput } from '../generated/prisma/models/Provider.ts';
import type { DataParams } from './models/params.ts';
import type { PurchaseFormData } from './models/purchase-form.ts';

contextBridge.exposeInMainWorld('electronAPI', {
  // properties
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // callbacks
  onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
    ipcRenderer.on('window-maximized', (_, isMaximized) =>
      callback(isMaximized),
    ),

  // window methods
  closeWindow: () => ipcRenderer.send('close-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),

  // prisma-actions actions
  createUser: (user: User) => ipcRenderer.invoke('createUser', user),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  getUserById: (id: number) => ipcRenderer.invoke('getUserById', id),
  getUserByUsername: (username: string) =>
    ipcRenderer.invoke('getUserByUsername', username),
  getUsersCount: () => ipcRenderer.invoke('getUsersCount'),
  signIn: (username: string, password: string) =>
    ipcRenderer.invoke('signIn', username, password),

  // products actions
  getAllProductsPaginated: (params: DataParams<Product, ProductWhereInput>) =>
    ipcRenderer.invoke('getAllProductsPaginated', params),
  getAllProducts: () => ipcRenderer.invoke('getAllProducts'),
  getProductById: (id: string) => ipcRenderer.invoke('getProductById', id),
  createProduct: (product: Product) =>
    ipcRenderer.invoke('createProduct', product),
  updateProduct: (id: string, product: Product) =>
    ipcRenderer.invoke('updateProduct', id, product),
  deleteProduct: (id: string) => ipcRenderer.invoke('deleteProduct', id),

  getAllProductBatchesPaginated: (
    params: DataParams<
      Product & ProductBatch,
      ProductBatchWhereInput & { product: ProductWhereInput }
    >,
  ) => ipcRenderer.invoke('getAllProductBatchesPaginated', params),
  getAllProductBatches: () => ipcRenderer.invoke('getAllProductBatches'),
  createProductBatch: (productBatch: Product & ProductBatch) =>
    ipcRenderer.invoke('createProductBatch', productBatch),
  updateProductBatch: (id: string, productBatch: Product & ProductBatch) =>
    ipcRenderer.invoke('updateProductBatch', id, productBatch),
  deleteProductBatch: (id: string) =>
    ipcRenderer.invoke('deleteProductBatch', id),

  // customer actions
  getAllCustomersPaginated: (
    params: DataParams<Customer, CustomerWhereInput>,
  ) => ipcRenderer.invoke('getAllCustomersPaginated', params),
  getAllCustomers: () => ipcRenderer.invoke('getAllCustomers'),
  getCustomerById: (id: string) => ipcRenderer.invoke('getCustomerById', id),
  createCustomer: (customer: Customer) =>
    ipcRenderer.invoke('createCustomer', customer),
  updateCustomer: (id: string, customer: Customer) =>
    ipcRenderer.invoke('updateCustomer', id, customer),
  deleteCustomer: (id: string) => ipcRenderer.invoke('deleteCustomer', id),

  // provider actions
  getAllProvidersPaginated: (
    params: DataParams<Provider, ProviderWhereInput>,
  ) => ipcRenderer.invoke('getAllProvidersPaginated', params),
  getAllProviders: () => ipcRenderer.invoke('getAllProviders'),
  getProviderById: (id: string) => ipcRenderer.invoke('getProviderById', id),
  createProvider: (provider: Provider) =>
    ipcRenderer.invoke('createProvider', provider),
  updateProvider: (id: string, provider: Provider) =>
    ipcRenderer.invoke('updateProvider', id, provider),
  deleteProvider: (id: string) => ipcRenderer.invoke('deleteProvider', id),

  // purchase actions
  getAllPurchasesPaginated: (params: DataParams<Purchase, ProductWhereInput>) =>
    ipcRenderer.invoke('getAllPurchasesPaginated', params),
  getAllPurchases: () => ipcRenderer.invoke('getAllPurchases'),
  getPurchaseById: (id: string) => ipcRenderer.invoke('getPurchaseById', id),
  createPurchase: (body: PurchaseFormData) =>
    ipcRenderer.invoke('createPurchase', body),
  updatePurchase: (id: string, purchase: Purchase) =>
    ipcRenderer.invoke('updatePurchase', id, purchase),
  deletePurchase: (id: string) => ipcRenderer.invoke('deletePurchase', id),
  getAllPurchaseItems: (purchaseId: string) =>
    ipcRenderer.invoke('getAllPurchaseItems', purchaseId),
});
