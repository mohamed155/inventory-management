import type { IpcResponse } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import type { PurchasesListResult } from '@/models/purchases-list-result.ts';
import type { SaleFormData } from '@/models/sales-form.ts';
import type { SalesListResult } from '@/models/sales-list-result.ts';
import type { UserModel } from '@/models/user.ts';
import type {
  Customer,
  Inventory,
  ProductBatch,
  Provider,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  User,
} from '../generated/prisma/browser.ts';
import type { CustomerWhereInput } from '../generated/prisma/models/Customer.ts';
import type { ProductWhereInput } from '../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../generated/prisma/models/ProductBatch.ts';
import type { ProviderWhereInput } from '../generated/prisma/models/Provider.ts';
import type { PurchaseWhereInput } from '../generated/prisma/models/Purchase.ts';
import type { SaleWhereInput } from '../generated/prisma/models/Sale.ts';

declare module '@tanstack/react-table' {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    filterVariant?: 'text' | 'number' | 'date' | 'select';
    selectOptions?: string[];
  }
}

declare global {
  interface Window {
    electronAPI: {
      platform: () => Promise<'darwin' | 'win32' | 'linux'>;

      // window properties
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;
      onUpdateAvailable: (callback: () => void) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      downloadUpdate: () => void;
      installUpdate: () => void;

      // window actions
      closeWindow: () => void;
      maximizeWindow: () => void;
      minimizeWindow: () => void;
      restoreWindow: () => void;

      // inventory actions
      getAllInventories: () => Promise<IpcResponse<Inventory[]>>;
      getInventoryById: (id: string) => Promise<IpcResponse<Inventory | null>>;
      getInventoriesCount: () => Promise<IpcResponse<number>>;
      createInventory: (name: string) => Promise<IpcResponse<Inventory>>;
      updateInventory: (id: string, name: string) => Promise<IpcResponse<Inventory>>;
      deleteInventory: (id: string) => Promise<IpcResponse<void>>;

      // dashboard actions
      getDueFromCustomers: (inventoryId: string) => Promise<IpcResponse<number>>;
      getDueToProviders: (inventoryId: string) => Promise<IpcResponse<number>>;
      getTotalProfit: (inventoryId: string) => Promise<IpcResponse<number>>;
      getTotalPurchasesAmount: (inventoryId: string) => Promise<IpcResponse<number>>;
      getTotalSalesAmount: (inventoryId: string) => Promise<IpcResponse<number>>;
      getAllOverduePayments: (inventoryId: string) => Promise<
        IpcResponse<{ totalRemainingAmount: number; count: number }>
      >;
      getExpiringProducts: (
        inventoryId: string,
        days?: number,
      ) => Promise<
        IpcResponse<
          { name: string; expirationDate: string; quantity: number }[]
        >
      >;
      getLowStockProducts: (
        inventoryId: string,
        threshold?: number,
      ) => Promise<IpcResponse<{ name: string; totalQuantity: number }[]>>;
      getTopUpcomingPayingCustomers: (inventoryId: string) => Promise<
        IpcResponse<
          {
            name: string;
            phone: string;
            payDueDate: string;
            amountDue: number;
          }[]
        >
      >;
      getTopUpcomingPayingProviders: (inventoryId: string) => Promise<
        IpcResponse<
          {
            name: string;
            phone: string;
            payDueDate: string;
            amountDue: number;
          }[]
        >
      >;
      getMonthlyChartData: (inventoryId: string) => Promise<
        IpcResponse<
          { month: string; sales: number; purchases: number; profit: number }[]
        >
      >;

      // users actions
      getUsers: () => Promise<IpcResponse<User[]>>;
      getUserById: (id: string) => Promise<IpcResponse<User | null>>;
      getUserByUsername: (
        username: string,
      ) => Promise<IpcResponse<User | null>>;
      getUsersCount: () => Promise<IpcResponse<number>>;
      createUser: (user: UserModel) => Promise<IpcResponse<User>>;
      updateUser: (
        id: string,
        data: Partial<UserModel>,
      ) => Promise<IpcResponse<User>>;
      deleteUser: (id: string) => Promise<IpcResponse<User>>;
      signIn: (
        username: string,
        password: string,
      ) => Promise<IpcResponse<User | null>>;

      // products actions
      getAllProductsPaginated: (
        inventoryId: string,
        params: DataParams<Product, ProductWhereInput>,
      ) => Promise<IpcResponse<{ data: Product[]; total: number }>>;
      getAllProducts: (inventoryId: string) => Promise<
        IpcResponse<Pick<Product, 'id' | 'name'>[]>
      >;
      getProductById: (id: string) => Promise<IpcResponse<Product | null>>;
      createProduct: (inventoryId: string, product: Product) => Promise<IpcResponse<Product>>;
      updateProduct: (
        id: string,
        product: Product,
      ) => Promise<IpcResponse<Product>>;
      deleteProduct: (id: string) => Promise<IpcResponse<Product>>;

      // product batches actions
      getAllProductBatchesPaginated: (
        inventoryId: string,
        params: DataParams<
          Product & ProductBatch,
          ProductBatchWhereInput & { product: ProductWhereInput }
        >,
      ) => Promise<
        IpcResponse<{ data: (Product & ProductBatch)[]; total: number }>
      >;
      getAllProductBatches: (inventoryId: string) => Promise<
        IpcResponse<(Product & ProductBatch)[]>
      >;
      getProductBatchById: (
        id: string,
      ) => Promise<IpcResponse<(Product & ProductBatch) | null>>;
      createProductBatch: (
        inventoryId: string,
        product: Product,
      ) => Promise<IpcResponse<Product & ProductBatch>>;
      updateProductBatch: (
        id: string,
        product: Product & ProductBatch,
      ) => Promise<IpcResponse<Product & ProductBatch>>;
      deleteProductBatch: (
        id: string,
      ) => Promise<IpcResponse<Product & ProductBatch>>;

      // customer actions
      getAllCustomersPaginated: (
        inventoryId: string,
        params: DataParams<Customer, CustomerWhereInput>,
      ) => Promise<IpcResponse<{ data: Customer[]; total: number }>>;
      getAllCustomers: (inventoryId: string) => Promise<
        IpcResponse<Pick<Customer, 'id' | 'firstname' | 'lastname'>[]>
      >;
      getCustomerById: (id: string) => Promise<IpcResponse<Customer | null>>;
      createCustomer: (inventoryId: string, customer: Customer) => Promise<IpcResponse<Customer>>;
      updateCustomer: (
        id: string,
        customer: Customer,
      ) => Promise<IpcResponse<Customer>>;
      deleteCustomer: (id: string) => Promise<IpcResponse<Customer>>;

      // provider actions
      getAllProvidersPaginated: (
        inventoryId: string,
        params: DataParams<Provider, ProviderWhereInput>,
      ) => Promise<IpcResponse<{ data: Provider[]; total: number }>>;
      getAllProviders: (inventoryId: string) => Promise<
        IpcResponse<Pick<Provider, 'id' | 'name'>[]>
      >;
      getProviderById: (id: string) => Promise<IpcResponse<Provider | null>>;
      createProvider: (inventoryId: string, provider: Provider) => Promise<IpcResponse<Provider>>;
      updateProvider: (
        id: string,
        provider: Provider,
      ) => Promise<IpcResponse<Provider>>;
      deleteProvider: (id: string) => Promise<IpcResponse<Provider>>;

      // purchase actions
      getAllPurchasesPaginated: (
        inventoryId: string,
        params: DataParams<
          Purchase,
          PurchaseWhereInput & {
            itemsCount?: number;
            totalCost?: number;
            remainingCost?: number;
          }
        >,
      ) => Promise<IpcResponse<{ data: PurchasesListResult[]; total: number }>>;
      getAllPurchases: (inventoryId: string) => Promise<
        IpcResponse<Pick<Purchase, 'id' | 'name'>[]>
      >;
      getPurchaseById: (id: string) => Promise<IpcResponse<Purchase | null>>;
      createPurchase: (
        inventoryId: string,
        purchase: PurchaseFormData,
      ) => Promise<IpcResponse<Purchase>>;
      updatePurchase: (
        id: string,
        purchase: Partial<Purchase>,
      ) => Promise<IpcResponse<Purchase>>;
      deletePurchase: (id: string) => Promise<IpcResponse<Purchase>>;
      getAllPurchaseItems: (
        purchaseId: string,
      ) => Promise<IpcResponse<(PurchaseItem & Product & ProductBatch)[]>>;
      getPurchasesByProviderId: (inventoryId: string, providerId: string) => Promise<
        IpcResponse<
          {
            id: string;
            date: Date;
            payDueDate: Date;
            totalCost: number;
            paidAmount: number;
            remainingCost: number;
            items: { name: string; quantity: number }[];
          }[]
        >
      >;

      // sales actions
      getAllSalesPaginated: (
        inventoryId: string,
        params: DataParams<
          Sale,
          SaleWhereInput & {
            itemsCount?: number;
            totalCost?: number;
            remainingCost?: number;
          }
        >,
      ) => Promise<IpcResponse<{ data: SalesListResult[]; total: number }>>;
      getAllSales: (inventoryId: string) => Promise<IpcResponse<Pick<Sale, 'id' | 'name'>[]>>;
      getSaleById: (id: string) => Promise<IpcResponse<Sale | null>>;
      createSale: (inventoryId: string, sale: SaleFormData) => Promise<IpcResponse<Sale>>;
      updateSale: (
        id: string,
        sale: Partial<Sale>,
      ) => Promise<IpcResponse<Sale>>;
      deleteSale: (id: string) => Promise<IpcResponse<Sale>>;
      getAllSaleItems: (
        saleId: string,
      ) => Promise<IpcResponse<(SaleItem & Product & ProductBatch)[]>>;
      getSalesByCustomerId: (inventoryId: string, customerId: string) => Promise<
        IpcResponse<
          {
            id: string;
            date: Date;
            payDueDate: Date;
            totalCost: number;
            paidAmount: number;
            remainingCost: number;
            items: { name: string; quantity: number }[];
          }[]
        >
      >;
    };
  }
}
