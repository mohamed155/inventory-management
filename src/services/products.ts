import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import type { Product, ProductBatch } from '../../generated/prisma/browser.ts';
import type { ProductWhereInput } from '../../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../../generated/prisma/models/ProductBatch.ts';

export const getAllProductsPaginated = (
  params: DataParams<Product, ProductWhereInput>,
) => window.electronAPI.getAllProductsPaginated(params).then(unwrap);

export const getAllProducts = () =>
  window.electronAPI.getAllProducts().then(unwrap);

export const getProductById = (id: string) =>
  window.electronAPI.getProductById(id).then(unwrap);

export const createProduct = (product: Product) =>
  window.electronAPI.createProduct(product).then(unwrap);

export const updateProduct = (id: string, product: Product) =>
  window.electronAPI.updateProduct(id, product).then(unwrap);

export const deleteProduct = (id: string) =>
  window.electronAPI.deleteProduct(id).then(unwrap);

export const getAllProductBatchesPaginated = (
  params: DataParams<
    Product & ProductBatch,
    ProductBatchWhereInput & { product: ProductWhereInput }
  >,
) => window.electronAPI.getAllProductBatchesPaginated(params).then(unwrap);

export const getAllProductBatches = () =>
  window.electronAPI.getAllProductBatches().then(unwrap);

export const getProductBatchById = (id: string) =>
  window.electronAPI.getProductBatchById(id).then(unwrap);

export const createProductBatch = (productBatch: Product & ProductBatch) =>
  window.electronAPI.createProductBatch(productBatch).then(unwrap);

export const updateProductBatch = (
  id: string,
  productBatch: Product & ProductBatch,
) => window.electronAPI.updateProductBatch(id, productBatch).then(unwrap);

export const deleteProductBatch = (id: string) =>
  window.electronAPI.deleteProductBatch(id).then(unwrap);
