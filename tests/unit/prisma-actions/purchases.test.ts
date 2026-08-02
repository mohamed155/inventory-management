import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createPurchase,
  deletePurchase,
  getAllPurchaseItems,
  getAllPurchasesPaginated,
  updatePurchase,
  updatePurchaseWithItems,
} from '@/prisma-actions/purchases.action.ts';
import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { seedProduct } from '../../fixtures/products.ts';
import { seedProvider } from '../../fixtures/providers.ts';
import { seedUser } from '../../fixtures/users.ts';
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

describe('createPurchase - batch management', () => {
  it('creates new batch when no matching batch exists', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const batchCountBefore = await prisma.productBatch.count();

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 500,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 30,
          unitPrice: 15,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batchCountAfter = await prisma.productBatch.count();
    expect(batchCountAfter).toBe(batchCountBefore + 1);

    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch?.quantity).toBe(30);
  });

  it('merges into existing batch with matching dates', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const prodDate = new Date('2025-01-01');
    const expDate = new Date('2026-12-31');

    const existingBatch = await prisma.productBatch.create({
      data: {
        productId: product.id,
        productionDate: prodDate,
        expirationDate: expDate,
        quantity: 20,
      },
    });

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 500,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 15,
          unitPrice: 10,
          productionDate: prodDate,
          expirationDate: expDate,
        },
      ],
    });

    const updatedBatch = await prisma.productBatch.findUnique({
      where: { id: existingBatch.id },
    });
    expect(updatedBatch?.quantity).toBe(35);
    expect(await prisma.productBatch.count()).toBe(1);
  });

  it('creates inline provider when no providerId given', async () => {
    const user = await seedUser(prisma);
    const product = await seedProduct(prisma, {}, inventoryId);
    const countBefore = await prisma.provider.count();

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: undefined,
      providerName: 'Inline Provider',
      providerPhone: '01288888888',
      providerAddress: 'Inline Road',
      paidAmount: 200,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 20,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const countAfter = await prisma.provider.count();
    expect(countAfter).toBe(countBefore + 1);
  });

  it('creates inline product when no product id given', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const productCountBefore = await prisma.product.count();

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 300,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: undefined,
          name: 'Brand New Product',
          quantity: 5,
          unitPrice: 60,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const productCountAfter = await prisma.product.count();
    expect(productCountAfter).toBe(productCountBefore + 1);

    const newProduct = await prisma.product.findFirst({
      where: { name: 'Brand New Product' },
    });
    expect(newProduct).toBeDefined();
  });

  it('sets isExpirable on a newly created product from a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: undefined,
          name: 'Non Expirable Purchase Product',
          isExpirable: false,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const newProduct = await prisma.product.findFirst({
      where: { name: 'Non Expirable Purchase Product' },
    });
    expect(newProduct?.isExpirable).toBe(false);
  });

  it('updates isExpirable on an existing product when provided in a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, { isExpirable: true }, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          isExpirable: false,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });

  it('leaves isExpirable unchanged on an existing product when not provided in a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, { isExpirable: false }, inventoryId);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 20,
        },
      ],
    } as any);

    const updated = await prisma.product.findUnique({ where: { id: product.id } });
    expect(updated?.isExpirable).toBe(false);
  });
});

describe('updatePurchase', () => {
  it('updates paidAmount on an existing purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 0,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 50,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    await updatePurchase(prisma, purchase.id, { paidAmount: 300 });

    const updated = await prisma.purchase.findUnique({
      where: { id: purchase.id },
    });
    expect(updated?.paidAmount).toBe(300);
  });
});

describe('updatePurchaseWithItems', () => {
  const seedPurchase = async (quantity = 100) => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    return { user, provider, product, purchase };
  };

  it('increases batch stock when quantity is increased', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 130,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch?.quantity).toBe(130);
  });

  it('decreases batch stock when quantity is reduced within headroom', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 60,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch?.quantity).toBe(60);
  });

  it('allows a reduction down to exactly the already-sold floor', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 70,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const after = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(after?.quantity).toBe(0);
  });

  it('rejects a reduction below the already-sold floor and rolls back', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await expect(
      updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [
          {
            id: product.id,
            quantity: 50,
            unitPrice: 10,
            productionDate: new Date('2025-01-01'),
            expirationDate: new Date('2026-12-31'),
          },
        ],
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');

    const after = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(after?.quantity).toBe(30);
    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(100);
  });

  it('reports the reduction floor, not remaining stock, in the error', async () => {
    const { user, provider, product, purchase } = await seedPurchase(100);
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 30 },
    });

    await expect(
      updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [
          {
            id: product.id,
            quantity: 50,
            unitPrice: 10,
            productionDate: new Date('2025-01-01'),
            expirationDate: new Date('2026-12-31'),
          },
        ],
      }),
    ).rejects.toThrow(`INSUFFICIENT_STOCK:${product.id}:70`);
  });

  it('moves stock between batches when a line changes its dates', async () => {
    const { user, provider, product, purchase } = await seedPurchase(40);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 40,
          unitPrice: 10,
          productionDate: new Date('2025-06-01'),
          expirationDate: new Date('2027-06-30'),
        },
      ],
    });

    const oldBatch = await prisma.productBatch.findFirst({
      where: {
        productId: product.id,
        productionDate: new Date('2025-01-01'),
      },
    });
    const newBatch = await prisma.productBatch.findFirst({
      where: {
        productId: product.id,
        productionDate: new Date('2025-06-01'),
      },
    });
    expect(oldBatch?.quantity).toBe(0);
    expect(newBatch?.quantity).toBe(40);
  });

  it('updates the purchase scalar fields', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 777,
      discount: 55,
      payDueDate: new Date('2027-03-31'),
      date: new Date('2026-02-02'),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const updated = await prisma.purchase.findUnique({
      where: { id: purchase.id },
    });
    expect(updated?.paidAmount).toBe(777);
    expect(updated?.discount).toBe(55);
  });

  it('replaces purchase items rather than appending to them', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 25,
          unitPrice: 12,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(25);
    expect(items[0].unitPrice).toBe(12);
  });

  it('creates a brand new product added during an edit', async () => {
    const { user, provider, product, purchase } = await seedPurchase(10);

    await updatePurchaseWithItems(prisma, inventoryId, purchase.id, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 10,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
        {
          id: undefined,
          name: 'Added During Edit',
          isExpirable: false,
          quantity: 6,
          unitPrice: 30,
        },
      ],
    });

    const created = await prisma.product.findFirst({
      where: { name: 'Added During Edit' },
    });
    expect(created).not.toBeNull();
    const items = await prisma.purchaseItem.findMany({
      where: { purchaseId: purchase.id },
    });
    expect(items).toHaveLength(2);
  });
});

describe('deletePurchase', () => {
  it('removes the purchase record', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 20,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    await prisma.purchaseItem.deleteMany({
      where: { purchaseId: purchase.id },
    });
    await deletePurchase(prisma, purchase.id);

    const found = await prisma.purchase.findUnique({
      where: { id: purchase.id },
    });
    expect(found).toBeNull();
  });

  it('reverses purchased stock when deleting a purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 20,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const batchBeforeDelete = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batchBeforeDelete).not.toBeNull();
    if (!batchBeforeDelete) throw new Error('Expected purchase batch');
    expect(batchBeforeDelete.quantity).toBe(5);

    await deletePurchase(prisma, purchase.id);

    const batchAfterDelete = await prisma.productBatch.findUnique({
      where: { id: batchBeforeDelete.id },
    });
    expect(batchAfterDelete?.quantity).toBe(0);
  });

  it('does not delete a purchase when its stock has already been sold', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 20,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });
    const batch = await prisma.productBatch.findFirst({
      where: { productId: product.id },
    });
    expect(batch).not.toBeNull();
    if (!batch) throw new Error('Expected purchase batch');
    await prisma.productBatch.update({
      where: { id: batch.id },
      data: { quantity: 2 },
    });

    await expect(deletePurchase(prisma, purchase.id)).rejects.toThrow(
      'already been sold',
    );

    const found = await prisma.purchase.findUnique({
      where: { id: purchase.id },
    });
    expect(found).not.toBeNull();
  });
});

describe('getAllPurchaseItems', () => {
  it('returns joined product and batch data for each item', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma, {}, inventoryId);
    const product = await seedProduct(
      prisma,
      {
        name: 'Purchase Item Product',
      },
      inventoryId,
    );

    const purchase = await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 200,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 8,
          unitPrice: 25,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const items = await getAllPurchaseItems(prisma, purchase.id);

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Purchase Item Product');
    expect(items[0].quantity).toBe(8);
  });
});

describe('getAllPurchasesPaginated', () => {
  it('returns page 1 of 10 with correct total', async () => {
    const user = await seedUser(prisma);

    for (let i = 0; i < 15; i++) {
      const provider = await seedProvider(prisma, {}, inventoryId);
      const product = await seedProduct(prisma, {}, inventoryId);

      await createPurchase(prisma, inventoryId, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date(),
        products: [
          {
            id: product.id,
            quantity: 1,
            unitPrice: 100,
            productionDate: new Date('2025-01-01'),
            expirationDate: new Date('2026-12-31'),
          },
        ],
      });
    }

    const result = await getAllPurchasesPaginated(prisma, inventoryId, {
      page: 1,
      filter: {},
    } as any);

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
  });
});
