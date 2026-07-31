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

  it('sets isExpirable on a newly created product', async () => {
    const batch = await createProductBatch(prisma, inventoryId, {
      name: 'Non Expirable Product',
      isExpirable: false,
      quantity: 10,
    } as any);

    const product = await prisma.product.findUnique({
      where: { id: batch.productId },
    });
    expect(product?.isExpirable).toBe(false);
  });

  it('defaults isExpirable to true when not provided for a new product', async () => {
    const batch = await createProductBatch(prisma, inventoryId, {
      name: 'Default Expirable Product',
      quantity: 10,
    } as any);

    const product = await prisma.product.findUnique({
      where: { id: batch.productId },
    });
    expect(product?.isExpirable).toBe(true);
  });

  it('updates isExpirable on an existing product when provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Existing Expirable', inventoryId, isExpirable: true },
    });

    await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      isExpirable: false,
      quantity: 5,
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });

  it('returns the created batch (not the product update result) when isExpirable is provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Transactional Product', inventoryId, isExpirable: true },
    });

    const batch = await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      isExpirable: false,
      quantity: 42,
      productionDate: new Date('2025-01-01'),
      expirationDate: new Date('2026-12-31'),
    } as any);

    expect(batch).toBeDefined();
    expect(batch.productId).toBe(product.id);
    expect(batch.quantity).toBe(42);

    const persistedBatch = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(persistedBatch).toBeDefined();
    expect(persistedBatch?.quantity).toBe(42);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged on an existing product when not provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Untouched Flag', inventoryId, isExpirable: false },
    });

    await createProductBatch(prisma, inventoryId, {
      productId: product.id,
      quantity: 5,
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
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

  it('updates isExpirable alongside other product fields', async () => {
    const product = await prisma.product.create({
      data: { name: 'Original', inventoryId, isExpirable: true },
    });
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
      name: 'Original',
      isExpirable: false,
      quantity: 100,
      productionDate: null,
      expirationDate: null,
    } as any);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged when not provided', async () => {
    const product = await prisma.product.create({
      data: { name: 'Keep Flag', inventoryId, isExpirable: false },
    });
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
      name: 'Keep Flag',
      quantity: 90,
      productionDate: new Date('2025-01-01'),
      expirationDate: new Date('2026-12-31'),
    } as any);

    const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updatedProduct?.isExpirable).toBe(false);
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

describe('getAllProducts', () => {
  it('includes isExpirable in the returned fields', async () => {
    await prisma.product.create({
      data: { name: 'Flagged Product', inventoryId, isExpirable: false },
    });

    const { getAllProducts } = await import('@/prisma-actions/product.action.ts');
    const products = await getAllProducts(prisma, inventoryId);

    const found = products.find((p: { name: string }) => p.name === 'Flagged Product');
    expect(found).toBeDefined();
    expect(found.isExpirable).toBe(false);
  });
});
