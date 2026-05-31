import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';
import type { Product, ProductBatch } from '../../generated/prisma/browser.ts';
import type { ProductWhereInput } from '../../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../../generated/prisma/models/ProductBatch.ts';

const getInventoryId = () => useInventoryStore.getState().activeInventoryId ?? '';

export const productKeys = {
  all: (inventoryId: string) => ['products', inventoryId] as const,
  paginated: (inventoryId: string, params: unknown) => ['products', inventoryId, params] as const,
  batches: (inventoryId: string) => ['productBatches', inventoryId] as const,
  batchesPaginated: (inventoryId: string, params: unknown) => ['productBatches', inventoryId, params] as const,
};

export const getAllProductsPaginated = (
  params: DataParams<Product, ProductWhereInput>,
) => window.electronAPI.getAllProductsPaginated(getInventoryId(), params).then(unwrap);

export const getAllProducts = () =>
  window.electronAPI.getAllProducts(getInventoryId()).then(unwrap);

export const getProductById = (id: string) =>
  window.electronAPI.getProductById(id).then(unwrap);

export const createProduct = (product: Product) =>
  window.electronAPI.createProduct(getInventoryId(), product).then(unwrap);

export const updateProduct = (id: string, product: Product) =>
  window.electronAPI.updateProduct(id, product).then(unwrap);

export const deleteProduct = (id: string) =>
  window.electronAPI.deleteProduct(id).then(unwrap);

export const getAllProductBatchesPaginated = (
  params: DataParams<
    Product & ProductBatch,
    ProductBatchWhereInput & { product: ProductWhereInput }
  >,
) => window.electronAPI.getAllProductBatchesPaginated(getInventoryId(), params).then(unwrap);

export const getAllProductBatches = () =>
  window.electronAPI.getAllProductBatches(getInventoryId()).then(unwrap);

export const getProductBatchById = (id: string) =>
  window.electronAPI.getProductBatchById(id).then(unwrap);

export const createProductBatch = (productBatch: Product & ProductBatch) =>
  window.electronAPI.createProductBatch(getInventoryId(), productBatch).then(unwrap);

export const updateProductBatch = (
  id: string,
  productBatch: Product & ProductBatch,
) => window.electronAPI.updateProductBatch(id, productBatch).then(unwrap);

export const deleteProductBatch = (id: string) =>
  window.electronAPI.deleteProductBatch(id).then(unwrap);
