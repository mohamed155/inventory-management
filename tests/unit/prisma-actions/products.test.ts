import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createProductBatch,
  deleteProductBatch,
  getAllProductBatchesPaginated,
  getProductBatch,
  updateProductBatch,
} from '@/prisma-actions/product.action.ts';
import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { clearDatabase, createTestPrisma } from '../../setup/db.ts';

let prisma: PrismaClient;
let closeDb: () => void;
let inventoryId: string;

beforeAll(async () => {
  const db = await createTestPrisma();
  prisma = db.prisma;
  closeDb = db.close;
  const inv = await prisma.inventory.create({ data: { name: 'Test' } });
  inventoryId = inv.id;
});

afterAll(() => {
  closeDb();
});

afterEach(async () => {
  await clearDatabase(prisma);
});

describe('createProductBatch', () => {
  it('creates a new product when no productId is provided', async () => {
    const batch = await createProductBatch(prisma, inventoryId, {
      name: 'New Product',
      description: 'desc',
      productionDate: new Date('2025-01-01'),
      expirationDate: new Date('2026-12-31'),
      quantity: 50,
    } as any);

    expect(batch).toBeDefined();
    expect(batch.quantity).toBe(50);

    const product = await prisma.product.findUnique({
      where: { id: batch.productId },
    });
    expect(product?.name).toBe('New Product');
  });

  it('links to existing product when productId is provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Existing Product', inventoryId },
    });

    const batch = await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      productionDate: new Date('2025-03-01'),
      expirationDate: new Date('2026-06-30'),
      quantity: 30,
    } as any);

    expect(batch.productId).toBe(product.id);
    expect(batch.quantity).toBe(30);
  });

  it('throws when productId refers to a non-existent product', async () => {
    await expect(
      createProductBatch(prisma, inventoryId, {
        productId: 'non-existent-id',
        productionDate: new Date(),
        expirationDate: new Date(),
        quantity: 10,
      } as any),
    ).rejects.toThrow();
  });
});

describe('updateProductBatch', () => {
  it('updates product name and batch fields', async () => {
    const product = await prisma.product.create({ data: { name: 'Original', inventoryId } });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: new Date('2025-01-01'),
        expirationDate: new Date('2026-12-31'),
        quantity: 100,
      },
    });

    await updateProductBatch(prisma, batch.id, {
      productId: product.id,
      name: 'Updated Name',
      quantity: 75,
      productionDate: new Date('2025-02-01'),
      expirationDate: new Date('2026-11-30'),
    } as any);

    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });
    const updatedBatch = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });

    expect(updatedProduct?.name).toBe('Updated Name');
    expect(updatedBatch?.quantity).toBe(75);
  });
});

describe('deleteProductBatch', () => {
  it('removes the batch record', async () => {
    const product = await prisma.product.create({
      data: { name: 'To Delete', inventoryId },
    });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: new Date(),
        expirationDate: new Date(),
        quantity: 10,
      },
    });

    await deleteProductBatch(prisma, batch.id);

    const found = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(found).toBeNull();
  });
});

describe('getAllProductBatchesPaginated', () => {
  it('returns page 1 of 10 with correct total', async () => {
    for (let i = 0; i < 15; i++) {
      const product = await prisma.product.create({
        data: { name: `Product ${i}`, inventoryId },
      });
      await prisma.productBatch.create({
        data: {
          productId: product.id,
          productionDate: new Date(),
          expirationDate: new Date('2026-12-31'),
          quantity: 10,
        },
      });
    }

    const result = await getAllProductBatchesPaginated(prisma, inventoryId, {
      page: 1,
      filter: {},
    } as any);

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
  });

  it('returns page 2 with remaining records', async () => {
    for (let i = 0; i < 15; i++) {
      const product = await prisma.product.create({
        data: { name: `Batch Product ${i}`, inventoryId },
      });
      await prisma.productBatch.create({
        data: {
          productId: product.id,
          productionDate: new Date(),
          expirationDate: new Date('2026-12-31'),
          quantity: 10,
        },
      });
    }

    const result = await getAllProductBatchesPaginated(prisma, inventoryId, {
      page: 2,
      filter: {},
    } as any);

    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(15);
  });
});

describe('getProductBatch', () => {
  it('returns batch with joined product data', async () => {
    const product = await prisma.product.create({
      data: { name: 'Joined Product', inventoryId },
    });
    const batch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: new Date(),
        expirationDate: new Date(),
        quantity: 20,
      },
    });

    const result = await getProductBatch(prisma, batch.id);

    expect(result).toBeDefined();
    expect(result?.product?.name).toBe('Joined Product');
  });

  it('returns null for unknown id', async () => {
    const result = await getProductBatch(prisma, 'unknown-id');
    expect(result).toBeNull();
  });
});
