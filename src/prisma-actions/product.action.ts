import type { PrismaClient } from '@prisma/client';
import type { Product, ProductBatch } from '../../generated/prisma/client.ts';
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

export const getAllProductBatchesPaginated = (
  prisma: PrismaClient,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Product & ProductBatch>,
) => {
  return prisma.productBatch.findMany({
    where: filter
      ? Object.entries(filter).map(([key, value]) => ({
          [key]: { contains: value },
        }))
      : undefined,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
    relationLoadStrategy: 'join',
    include: {
      product: true,
    },
  });
};

export const getAllProductBatches = (prisma: PrismaClient) => {
  return prisma.productBatch.findMany({
    relationLoadStrategy: 'join',
    include: {
      product: true,
    },
  });
};

export const getProductBatch = (prisma: PrismaClient, id: string) => {
  return prisma.productBatch.findUnique({
    where: { id },
    relationLoadStrategy: 'join',
    include: {
      product: true,
    },
  });
};

export const createProductBatch = (
  prisma: PrismaClient,
  productBatch: Product & ProductBatch,
) => {
  const product = prisma.product.findUnique({
    where: { id: productBatch.productId },
  });

  if (product) {
    return prisma.productBatch.create(productBatch);
  } else {
    const product = prisma.product.create(productBatch);
    return prisma.productBatch.create({
      ...productBatch,
      productId: product.id,
    });
  }
};

export const updateProductBatch = async (
  prisma: PrismaClient,
  id: string,
  productBatch: Product & ProductBatch,
) => {
  await prisma.product.update({
    where: { id: productBatch.productId },
    data: productBatch,
  });

  return prisma.productBatch.update({
    where: { id },
    data: productBatch,
  });
};

export const deleteProductBatch = (prisma: PrismaClient, id: string) => {
  return prisma.productBatch.delete({
    where: { id },
  });
};
