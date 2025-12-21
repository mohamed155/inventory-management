import type { DataParams } from '@/models/params.ts';
import type { UserModel } from '@/models/user.ts';
import type { Customer, User } from '../generated/prisma/browser.ts';

declare module '@tanstack/react-table' {
  interface ColumnMeta<_TData extends RowData, _TValue> {
    filterVariant?: 'text' | 'number' | 'date';
  }
}

declare global {
  interface Window {
    electronAPI: {
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
        params: DataParams<Product>,
      ) => Promise<{ data: Product[]; total: number }>;
      getAllProducts: () => Promise<Pick<Product, 'id' | 'name'>[]>;
      getProductById: (id: string) => Promise<Product | null>;
      createProduct: (product: Product) => Promise<Product>;
      updateProduct: (id: string, product: Product) => Promise<Product>;
      deleteProduct: (id: string) => Promise<Product>;

      // product batches actions
      getAllProductBatchesPaginated: (
        params: DataParams<Product & ProductBatch>,
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
        params: DataParams<Customer>,
      ) => Promise<{ data: Customer[]; total: number }>;
      getAllCustomers: () => Promise<Pick<Customer, 'id' | 'name'>[]>;
      getCustomerById: (id: string) => Promise<Customer | null>;
      createCustomer: (customer: Customer) => Promise<Customer>;
      updateCustomer: (id: string, customer: Customer) => Promise<Customer>;
      deleteCustomer: (id: string) => Promise<Customer>;
    };
  }
}
