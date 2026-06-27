import type { PrismaClient } from '../../generated/prisma/client.ts';

let productCounter = 0;

export function makeProduct(overrides: Record<string, unknown> = {}) {
  productCounter++;
  return {
    name: `Product ${productCounter}`,
    description: `Description ${productCounter}`,
    ...overrides,
  };
}

export function makeProductBatch(
  productId: string,
  overrides: Record<string, unknown> = {},
) {
  const base = new Date('2025-01-01');
  const expiry = new Date('2026-12-31');
  return {
    productId,
    productionDate: base,
    expirationDate: expiry,
    quantity: 100,
    ...overrides,
  };
}

export async function seedProduct(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {},
  inventoryId?: string,
) {
  const data = { ...makeProduct(overrides), ...(inventoryId ? { inventoryId } : {}) };
  return prisma.product.create({
    data: data as Parameters<typeof prisma.product.create>[0]['data'],
  });
}

export async function seedProductBatch(
  prisma: PrismaClient,
  productId: string,
  overrides: Record<string, unknown> = {},
) {
  const data = makeProductBatch(productId, overrides);
  return prisma.productBatch.create({
    data: data as Parameters<typeof prisma.productBatch.create>[0]['data'],
  });
}

export function resetProductCounters() {
  productCounter = 0;
}
