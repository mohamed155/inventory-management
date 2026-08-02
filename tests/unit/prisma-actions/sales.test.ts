import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createSale,
  deleteSale,
  getAllSaleItems,
  getAllSalesPaginated,
  updateSale,
  updateSaleWithItems,
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

  it('rejects products from another inventory', async () => {
    const otherInventory = await prisma.inventory.create({
      data: { name: 'Other' },
    });
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, otherInventory.id);
    await seedProductBatch(prisma, product.id, { quantity: 20 });

    await expect(
      createSale(prisma, inventoryId, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 100,
        payDueDate: new Date('2026-12-31'),
        date: new Date(),
        discount: 0,
        products: [{ id: product.id, quantity: 5, unitPrice: 20 }],
      }),
    ).rejects.toThrow('selected inventory');
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

describe('updateSaleWithItems', () => {
  const seedSale = async (quantity = 20, stock = 100) => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, { quantity: stock });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity, unitPrice: 10 }],
    });

    return { user, customer, product, sale };
  };

  const totalStock = async (productId: string) => {
    const batches = await prisma.productBatch.findMany({
      where: { productId },
    });
    return batches.reduce(
      (sum: number, batch: { quantity: number }) => sum + batch.quantity,
      0,
    );
  };

  it('returns stock when the sold quantity is reduced', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);
    expect(await totalStock(product.id)).toBe(80);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 5, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(95);
  });

  it('consumes more stock when the sold quantity is increased', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 60, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(40);
  });

  it('lets an edit use stock the sale itself is holding', async () => {
    const { user, customer, product, sale } = await seedSale(100, 100);
    expect(await totalStock(product.id)).toBe(0);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 100, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(0);
    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      ),
    ).toBe(100);
  });

  it('rejects an increase beyond available stock and rolls back', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);

    await expect(
      updateSaleWithItems(prisma, inventoryId, sale.id, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 50,
        payDueDate: new Date('2026-12-31'),
        date: new Date('2026-01-01'),
        products: [{ id: product.id, quantity: 150, unitPrice: 10 }],
      }),
    ).rejects.toThrow('INSUFFICIENT_STOCK');

    expect(await totalStock(product.id)).toBe(80);
    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      ),
    ).toBe(20);
  });

  it('regroups a FIFO-split sale into the requested quantity', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma, {}, inventoryId);
    const product = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, product.id, {
      quantity: 30,
      expirationDate: new Date('2026-06-30'),
    });
    await seedProductBatch(prisma, product.id, {
      quantity: 30,
      expirationDate: new Date('2027-06-30'),
    });

    const sale = await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 50, unitPrice: 10 }],
    });

    const splitItems = await prisma.saleItem.findMany({
      where: { saleId: sale.id },
    });
    expect(splitItems.length).toBeGreaterThan(1);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: product.id, quantity: 20, unitPrice: 10 }],
    });

    const items = await prisma.saleItem.findMany({ where: { saleId: sale.id } });
    expect(
      items.reduce(
        (sum: number, item: { quantity: number }) => sum + item.quantity,
        0,
      ),
    ).toBe(20);
    expect(await totalStock(product.id)).toBe(40);
  });

  it('swaps to a different product, returning the original stock', async () => {
    const { user, customer, product, sale } = await seedSale(20, 100);
    const other = await seedProduct(prisma, {}, inventoryId);
    await seedProductBatch(prisma, other.id, { quantity: 50 });

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      payDueDate: new Date('2026-12-31'),
      date: new Date('2026-01-01'),
      products: [{ id: other.id, quantity: 10, unitPrice: 10 }],
    });

    expect(await totalStock(product.id)).toBe(100);
    expect(await totalStock(other.id)).toBe(40);
  });

  it('updates the sale scalar fields', async () => {
    const { user, customer, product, sale } = await seedSale(10, 100);

    await updateSaleWithItems(prisma, inventoryId, sale.id, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 321,
      discount: 15,
      payDueDate: new Date('2027-03-31'),
      date: new Date('2026-02-02'),
      products: [{ id: product.id, quantity: 10, unitPrice: 10 }],
    });

    const updated = await prisma.sale.findUnique({ where: { id: sale.id } });
    expect(updated?.paidAmount).toBe(321);
    expect(updated?.discount).toBe(15);
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
    const product = await seedProduct(
      prisma,
      { name: 'Item Product' },
      inventoryId,
    );
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
