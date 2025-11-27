import type { PrismaClient } from '@prisma/client';
import type { Product } from '../../generated/prisma/client.ts';
import type { DataParams } from '../models/params.ts';

export const getAllProducts = (
  prisma: PrismaClient,
  { page, orderDirection, orderProperty, filter }: DataParams<Product>,
) => {
  console.log('filter:');
  console.log({ page, orderDirection, orderProperty, filter });
  return prisma.product.findMany({
    where: filter
      ? Object.entries(filter).map(([key, value]) => ({
          [key]: { contains: value },
        }))
      : undefined,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
};

export const getProductById = (prisma: PrismaClient, id: string) => {
  return prisma.product.findUnique({
    where: { id },
  });
};

export const createProduct = (prisma: PrismaClient, product: Product) => {
  return prisma.product.create({
    data: product,
  });
};

export const updateProduct = (
  prisma: PrismaClient,
  id: string,
  product: Product,
) => {
  return prisma.product.update({
    where: { id },
    data: product,
  });
};

export const deleteProduct = (prisma: PrismaClient, id: string) => {
  return prisma.product.delete({
    where: { id },
  });
};
