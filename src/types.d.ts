import type { DataParams } from '@/models/params.ts';
import type { PurchaseFormData } from '@/models/purchase-form.ts';
import type { PurchasesListResult } from '@/models/purchases-list-result.ts';
import type { SaleFormData } from '@/models/sales-form.ts';
import type { SalesListResult } from '@/models/sales-list-result.ts';
import type { UserModel } from '@/models/user.ts';
import type {
  Customer,
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

      // window actions
      closeWindow: () => void;
      maximizeWindow: () => void;
      minimizeWindow: () => void;
      restoreWindow: () => void;

      // users actions
      getUsers: () => Promise<User[]>;
      getUserById: (id: string) => Promise<User | null>;
      getUserByUsername: (username: string) => Promise<User | null>;
      getUsersCount: () => Promise<number>;
      createUser: (user: UserModel) => Promise<User>;
      signIn: (username: string, password: string) => Promise<User | null>;

      // products actions
      getAllProductsPaginated: (
        params: DataParams<Product, ProductWhereInput>,
      ) => Promise<{ data: Product[]; total: number }>;
      getAllProducts: () => Promise<Pick<Product, 'id' | 'name'>[]>;
      getProductById: (id: string) => Promise<Product | null>;
      createProduct: (product: Product) => Promise<Product>;
      updateProduct: (id: string, product: Product) => Promise<Product>;
      deleteProduct: (id: string) => Promise<Product>;

      // product batches actions
      getAllProductBatchesPaginated: (
        params: DataParams<
          Product & ProductBatch,
          ProductBatchWhereInput & { product: ProductWhereInput }
        >,
      ) => Promise<{ data: (Product & ProductBatch)[]; total: number }>;
      getAllProductBatches: () => Promise<Pick<Product & ProductBatch>[]>;
      getProductBatchById: (
        id: string,
      ) => Promise<(Product & ProductBatch) | null>;
      createProductBatch: (product: Product) => Promise<Product & ProductBatch>;
      updateProductBatch: (
        id: string,
        product: Product & ProductBatch,
      ) => Promise<Product & ProductBatch>;
      deleteProductBatch: (id: string) => Promise<Product & ProductBatch>;

      // customer actions
      getAllCustomersPaginated: (
        params: DataParams<Customer, CustomerWhereInput>,
      ) => Promise<{ data: Customer[]; total: number }>;
      getAllCustomers: () => Promise<Pick<Customer, 'id' | 'name'>[]>;
      getCustomerById: (id: string) => Promise<Customer | null>;
      createCustomer: (customer: Customer) => Promise<Customer>;
      updateCustomer: (id: string, customer: Customer) => Promise<Customer>;
      deleteCustomer: (id: string) => Promise<Customer>;

      // provider actions
      getAllProvidersPaginated: (
        params: DataParams<Provider, ProviderWhereInput>,
      ) => Promise<{ data: Provider[]; total: number }>;
      getAllProviders: () => Promise<Pick<Provider, 'id' | 'name'>[]>;
      getProviderById: (id: string) => Promise<Provider | null>;
      createProvider: (provider: Provider) => Promise<Provider>;
      updateProvider: (id: string, provider: Provider) => Promise<Provider>;
      deleteProvider: (id: string) => Promise<Provider>;

      // purchase actions
      getAllPurchasesPaginated: (
        params: DataParams<
          Purchase,
          PurchaseWhereInput & {
            itemsCount?: number;
            totalCost?: number;
            remainingCost?: number;
          }
        >,
      ) => Promise<{ data: PurchasesListResult[]; total: number }>;
      getAllPurchases: () => Promise<Pick<Purchase, 'id' | 'name'>[]>;
      getPurchaseById: (id: string) => Promise<Purchase | null>;
      createPurchase: (purchase: PurchaseFormData) => Promise<Purchase>;
      updatePurchase: (
        id: string,
        purchase: Partial<Purchase>,
      ) => Promise<Purchase>;
      deletePurchase: (id: string) => Promise<Purchase>;
      getAllPurchaseItems: (
        purchaseId: string,
      ) => Promise<(PurchaseItem & Product & ProductBatch)[]>;

      // sales actions
      getAllSalesPaginated: (
        params: DataParams<
          Sale,
          SaleWhereInput & {
            itemsCount?: number;
            totalCost?: number;
            remainingCost?: number;
          }
        >,
      ) => Promise<{ data: SalesListResult[]; total: number }>;
      getAllSales: () => Promise<Pick<Sale, 'id' | 'name'>[]>;
      getSaleById: (id: string) => Promise<Sale | null>;
      createSale: (sale: SaleFormData) => Promise<Sale>;
      updateSale: (id: string, sale: Partial<Sale>) => Promise<Sale>;
      deleteSale: (id: string) => Promise<Sale>;
      getAllSaleItems: (
        saleId: string,
      ) => Promise<(SaleItem & Product & ProductBatch)[]>;
    };
  }
}
