import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createPurchase,
  deletePurchase,
  getAllPurchaseItems,
  getAllPurchasesPaginated,
  updatePurchase,
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
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);

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
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);

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
    const product = await seedProduct(prisma);
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
    const provider = await seedProvider(prisma);
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
});

describe('updatePurchase', () => {
  it('updates paidAmount on an existing purchase', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);

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

describe('deletePurchase', () => {
  it('removes the purchase record', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);

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
});

describe('getAllPurchaseItems', () => {
  it('returns joined product and batch data for each item', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma, {
      name: 'Purchase Item Product',
    });

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
      const provider = await seedProvider(prisma);
      const product = await seedProduct(prisma);

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
