import type { DataParams } from '@/models/params.ts';
import type { Product } from '../../generated/prisma/browser.ts';

export const getAllProducts = (params: DataParams<Product>) => {
  const getAllProducts = window.electronAPI.getAllProducts;
  return getAllProducts(params);
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
