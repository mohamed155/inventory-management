import type { PrismaClient } from '@prisma/client';
import type { Product, ProductBatch } from '../../generated/prisma/client.ts';
import type { DataParams } from '../models/params.ts';

export const getAllProductsPaginated = async (
  prisma: PrismaClient,
  { page, orderDirection, orderProperty, filter }: DataParams<Product>,
) => {
  const data = await prisma.product.findMany({
    where: filter
      ? Object.entries(filter).map(([key, value]) => ({
          [key]: { contains: value },
        }))
      : undefined,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.product.count()) as number;
  return { data, total };
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

export const getAllProductBatchesPaginated = async (
  prisma: PrismaClient,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Product & ProductBatch>,
) => {
  const isProductProperty = ['name', 'description'].includes(
    orderProperty as string,
  );

  const orderBy = orderProperty
    ? isProductProperty
      ? { product: { [orderProperty]: orderDirection } }
      : { [orderProperty]: orderDirection }
    : undefined;

  const batches = await prisma.productBatch.findMany({
    where: filter
      ? Object.entries(filter).map(([key, value]) => ({
          [key]: { contains: value },
        }))
      : undefined,
    orderBy: orderBy,
    skip: (page - 1) * 10,
    take: 10,
    include: {
      product: true,
    },
  });

  const data = batches.map((batch: ProductBatch & { product: Product }) => ({
    ...batch.product,
    ...batch,
    productId: batch.product.id,
  }));

  const total = (await prisma.productBatch.count()) as number;

  return { data, total };
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

export const createProductBatch = async (
  prisma: PrismaClient,
  productBatch: Product & ProductBatch,
) => {
  if (productBatch.productId) {
    const product = await prisma.product.findUnique({
      where: { id: productBatch.productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return prisma.productBatch.create({
      data: {
        id: productBatch.id,
        productId: product.id,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
        quantity: productBatch.quantity,
      },
    });
  } else {
    const product = await prisma.product.create({
      data: {
        name: productBatch.name,
        description: productBatch.description,
      },
    });
    return prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
        quantity: productBatch.quantity,
      },
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
    data: {
      name: productBatch.name,
      description: productBatch.description,
    },
  });

  return prisma.productBatch.update({
    where: { id },
    data: {
      quantity: productBatch.quantity,
      productionDate: productBatch.productionDate,
      expirationDate: productBatch.expirationDate,
    },
  });
};

export const deleteProductBatch = (prisma: PrismaClient, id: string) => {
  return prisma.productBatch.delete({
    where: { id },
  });
};
