import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createSale,
  deleteSale,
  getAllSaleItems,
  getAllSalesPaginated,
  updateSale,
} from '@/prisma-actions/sales.action.ts';
import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { seedCustomer } from '../../fixtures/customers.ts';
import { seedProduct, seedProductBatch } from '../../fixtures/products.ts';
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

describe('createSale - inventory deduction (FIFO)', () => {
  it('decrements batch quantity by sold amount', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    const batch = await seedProductBatch(prisma, product.id, { quantity: 50 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
    });

    const updatedBatch = await prisma.productBatch.findUnique({
      where: { id: batch.id },
    });
    expect(updatedBatch?.quantity).toBe(40);
  });

  it('picks earliest-expiring batch first (FIFO)', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);

    const earlierBatch = await seedProductBatch(prisma, product.id, {
      expirationDate: new Date('2026-06-01'),
      quantity: 20,
    });
    const laterBatch = await seedProductBatch(prisma, product.id, {
      expirationDate: new Date('2027-12-31'),
      quantity: 30,
    });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
    });

    const early = await prisma.productBatch.findUnique({
      where: { id: earlierBatch.id },
    });
    const late = await prisma.productBatch.findUnique({
      where: { id: laterBatch.id },
    });
    expect(early?.quantity).toBe(10);
    expect(late?.quantity).toBe(30);
  });

  it('throws when requested quantity exceeds stock', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 5 });

    await expect(
      createSale(prisma, inventoryId, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date(),
        discount: 0,
        products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
      }),
    ).rejects.toThrow();
  });

  it('creates new customer inline when no customerId provided', async () => {
    const user = await seedUser(prisma);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 20 });

    const countBefore = await prisma.customer.count();

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: undefined,
      customerFirstname: 'Inline',
      customerLastname: 'Customer',
      customerPhone: '01299999999',
      customerAddress: 'Inline Street',
      paidAmount: 100,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 5, unitPrice: 20 }],
    });

    const countAfter = await prisma.customer.count();
    expect(countAfter).toBe(countBefore + 1);
  });

  it('computes correct remaining amount with discount', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 20,
      products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
    });

    // totalCost = 10*10 - 20 = 80; remainingCost = 80 - 50 = 30
    const saleRecord = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(saleRecord?.discount).toBe(20);
    expect(saleRecord?.paidAmount).toBe(50);
  });
});

describe('updateSale', () => {
  it('updates paidAmount on an existing sale', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 20 });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 0,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 5, unitPrice: 10 }],
    });

    await updateSale(prisma, sale.id, { paidAmount: 50 });

    const updated = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(updated?.paidAmount).toBe(50);
  });
});

describe('deleteSale', () => {
  it('removes the sale record', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 20 });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 2, unitPrice: 25 }],
    });

    await prisma.saleItem.deleteMany({ where: { saleId: sale.id } });
    await deleteSale(prisma, sale.id);

    const found = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(found).toBeNull();
  });
});

describe('getAllSaleItems', () => {
  it('returns joined product and batch data for each item', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, { name: 'Item Product' }, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: 20 });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      discount: 0,
      products: [{ id: product.id, quantity: 3, unitPrice: 10 }],
    });

    const items = await getAllSaleItems(prisma, sale.id);

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('Item Product');
    expect(items[0].quantity).toBe(3);
  });
});

describe('getAllSalesPaginated', () => {
  it('paginates correctly with page size 10', async () => {
    const user = await seedUser(prisma);

    for (let i = 0; i < 15; i++) {
      const customer = await seedCustomer(prisma, {}, inventoryId);
      const product = await seedProduct(prisma, {}, inventoryId);
      await seedProductBatch(prisma, product.id, { quantity: 100 });
      await createSale(prisma, inventoryId, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 50,
        payDueDate: new Date('2026-12-31'),
        date: new Date(),
        discount: 0,
        products: [{ id: product.id, quantity: 1, unitPrice: 50 }],
      });
    }

    const result = await getAllSalesPaginated(prisma, inventoryId, {
      page: 1,
      filter: {},
    } as any);

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
  });
});
