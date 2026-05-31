// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type { Product, ProductBatch } from '../../generated/prisma/client.ts';
import type { ProductWhereInput } from '../../generated/prisma/models/Product.ts';
import type { ProductBatchWhereInput } from '../../generated/prisma/models/ProductBatch.ts';
import type { DataParams } from '../models/params.ts';

export const getAllProductsPaginated = async (
  prisma: PrismaClient,
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Product, ProductWhereInput>,
) => {
  const where = { AND: [{ inventoryId }, ...(filter ? [filter as ProductWhereInput] : [])] };
  const data = await prisma.product.findMany({
    where,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.product.count({ where })) as number;
  return { data, total };
};

export const getAllProducts = async (prisma: PrismaClient, inventoryId: string) => {
  const products = await prisma.product.findMany({ where: { inventoryId } });
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

export const createProduct = (prisma: PrismaClient, inventoryId: string, product: Product) => {
  return prisma.product.create({
    data: { ...product, inventoryId },
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
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<
    Product & ProductBatch,
    ProductBatchWhereInput & { product?: ProductWhereInput }
  >,
) => {
  const productProperties = ['name', 'description'];
  const isProductProperty = productProperties.includes(orderProperty as string);

  const orderBy = orderProperty
    ? isProductProperty
      ? { product: { [orderProperty]: orderDirection } }
      : { [orderProperty]: orderDirection }
    : undefined;

  const where = {
    AND: [
      { product: { inventoryId } },
      ...(filter ? [filter as ProductBatchWhereInput] : []),
    ],
  };

  const batches = await prisma.productBatch.findMany({
    where,
    orderBy,
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

  const total = (await prisma.productBatch.count({ where })) as number;

  return { data, total };
};

export const getAllProductBatches = (prisma: PrismaClient, inventoryId: string) => {
  return prisma.productBatch.findMany({
    where: { product: { inventoryId } },
    include: {
      product: true,
    },
  });
};

export const getProductBatch = (prisma: PrismaClient, id: string) => {
  return prisma.productBatch.findUnique({
    where: { id },
    include: {
      product: true,
    },
  });
};

export const createProductBatch = async (
  prisma: PrismaClient,
  inventoryId: string,
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
        inventoryId,
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
  const [, updatedBatch] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productBatch.productId },
      data: {
        name: productBatch.name,
        description: productBatch.description,
      },
    }),
    prisma.productBatch.update({
      where: { id },
      data: {
        quantity: productBatch.quantity,
        productionDate: productBatch.productionDate,
        expirationDate: productBatch.expirationDate,
      },
    }),
  ]);

  return updatedBatch;
};

export const deleteProductBatch = (prisma: PrismaClient, id: string) => {
  return prisma.productBatch.delete({
    where: { id },
  });
};
