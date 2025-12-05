import type { DataParams } from '@/models/params.ts';
import type { Product, ProductBatch } from '../../generated/prisma/browser.ts';

export const getAllProductsPaginated = (params: DataParams<Product>) => {
  const getAllProductsPaginated = window.electronAPI.getAllProductsPaginated;
  return getAllProductsPaginated(params);
};

export const getAllProducts = () => {
  const getAllProducts = window.electronAPI.getAllProducts;
  return getAllProducts();
};

export const getProductById = (id: string) => {
  const getProductBtId = window.electronAPI.getProductById;
  return getProductBtId(id);
};

export const createProduct = (product: Product) => {
  const createProduct = window.electronAPI.createProduct;
  return createProduct(product);
};

export const updateProduct = (id: string, product: Product) => {
  const updateProduct = window.electronAPI.updateProduct;
  return updateProduct(id, product);
};

export const deleteProduct = (id: string) => {
  const deleteProduct = window.electronAPI.deleteProduct;
  return deleteProduct(id);
};

export const getAllProductBatchesPaginated = (
  params: DataParams<Product & ProductBatch>,
) => {
  const getAllProductBatchesPaginated =
    window.electronAPI.getAllProductBatchesPaginated;
  return getAllProductBatchesPaginated(params);
};

export const getAllProductBatches = () => {
  const getAllProductBatches = window.electronAPI.getAllProductBatches;
  return getAllProductBatches();
};

export const getProductBatchById = (id: string) => {
  const getProductBatchById = window.electronAPI.getProductBatchById;
  return getProductBatchById(id);
};

export const createProductBatch = (productBatch: Product & ProductBatch) => {
  const createProductBatch = window.electronAPI.createProductBatch;
  return createProductBatch(productBatch);
};

export const updateProductBatch = (
  id: string,
  productBatch: Product & ProductBatch,
) => {
  const updateProductBatch = window.electronAPI.updateProductBatch;
  return updateProductBatch(id, productBatch);
};

export const deleteProductBatch = (id: string) => {
  const deleteProductBatch = window.electronAPI.deleteProductBatch;
  return deleteProductBatch(id);
};
