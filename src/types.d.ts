import type { DataParams } from '@/models/params.ts';
import type { UserModel } from '@/models/user.ts';
import type {
  Product,
  ProductBatch,
  User,
} from '../generated/prisma/browser.ts';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: 'text' | 'range' | 'select';
  }
}

declare global {
  interface Window {
    electronAPI: {
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: (isMaximized: boolean) => void) => void;

      closeWindow: () => void;
      maximizeWindow: () => void;
      minimizeWindow: () => void;
      restoreWindow: () => void;

      getUsers: () => Promise<User[]>;
      getUserById: (id: string) => Promise<User | null>;
      getUserByUsername: (username: string) => Promise<User | null>;
      getUsersCount: () => Promise<number>;
      createUser: (user: UserModel) => Promise<User>;
      signIn: (username: string, password: string) => Promise<User | null>;

      getAllProductsPaginated: (
        params: DataParams<Product>,
      ) => Promise<{ data: Product[]; total: number }>;
      getAllProducts: () => Promise<Pick<Product, 'id' | 'name'>[]>;
      getProductById: (id: string) => Promise<Product | null>;
      createProduct: (product: Product) => Promise<Product>;
      updateProduct: (id: string, product: Product) => Promise<Product>;
      deleteProduct: (id: string) => Promise<Product>;

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
    };
  }
}
