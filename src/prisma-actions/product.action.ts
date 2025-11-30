import type { PrismaClient } from '@prisma/client';
import type { Product } from '../../generated/prisma/client.ts';
import type { DataParams } from '../models/params.ts';

export const getAllProductsPaginated = (
  prisma: PrismaClient,
  { page, orderDirection, orderProperty, filter }: DataParams<Product>,
) => {
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

export const getAllProducts = async (prisma: PrismaClient) => {
  const products = await prisma.product.findMany({});
  return products.map((product: Product) => ({
    id: product.id,
    name: product.name,
  }));
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
