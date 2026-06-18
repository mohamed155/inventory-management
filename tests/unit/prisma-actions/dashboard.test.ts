import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  getAllOverduePayments,
  getDueFromCustomers,
  getDueToProviders,
  getExpiringProducts,
  getLowStockProducts,
  getTopUpcomingPayingCustomers,
  getTopUpcomingPayingProviders,
  getTotalProfit,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
} from '@/prisma-actions/dashboard.actions.ts';
import { createPurchase } from '@/prisma-actions/purchases.action.ts';
import { createSale } from '@/prisma-actions/sales.action.ts';
import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { seedCustomer } from '../../fixtures/customers.ts';
import { seedProduct, seedProductBatch } from '../../fixtures/products.ts';
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

describe('getTotalSalesAmount', () => {
  it('returns 0 when no sales exist', async () => {
    const result = await getTotalSalesAmount(prisma, inventoryId);
    expect(Number(result)).toBe(0);
  });

  it('equals sum of (paidAmount - discount) across all sales', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 80,
      discount: 10,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [{ id: product.id, quantity: 5, unitPrice: 20 }],
    });

    const result = await getTotalSalesAmount(prisma, inventoryId);
    expect(Number(result)).toBe(70); // 80 - 10
  });
});

describe('getTotalPurchasesAmount', () => {
  it('returns 0 when no purchases exist', async () => {
    const result = await getTotalPurchasesAmount(prisma, inventoryId);
    expect(Number(result)).toBe(0);
  });

  it('equals sum of paidAmount across all purchases', async () => {
    const user = await seedUser(prisma);
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 300,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 10,
          unitPrice: 30,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const result = await getTotalPurchasesAmount(prisma, inventoryId);
    expect(Number(result)).toBe(300);
  });
});

describe('getTotalProfit', () => {
  it('equals sales amount minus purchases amount', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const provider = await seedProvider(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 500,
      discount: 0,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [{ id: product.id, quantity: 10, unitPrice: 50 }],
    });

    await createPurchase(prisma, inventoryId, {
      userId: user.id,
      providerId: provider.id,
      paidAmount: 200,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [
        {
          id: product.id,
          quantity: 5,
          unitPrice: 40,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    const profit = await getTotalProfit(prisma, inventoryId);
    expect(Number(profit)).toBe(300); // 500 - 200
  });
});

describe('getDueFromCustomers', () => {
  it('returns 0 when no sales exist', async () => {
    const result = await getDueFromCustomers(prisma, inventoryId);
    expect(Number(result)).toBe(0);
  });

  it('calculates outstanding customer amount correctly', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 30,
      discount: 10,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [{ id: product.id, quantity: 5, unitPrice: 20 }],
    });

    // totalValue = 100, discount = 10, paidAmount = 30, due = 100 - 10 - 30 = 60
    const due = await getDueFromCustomers(prisma, inventoryId);
    expect(Number(due)).toBe(60);
  });
});

describe('getDueToProviders', () => {
  it('returns 0 when no purchases exist', async () => {
    const result = await getDueToProviders(prisma, inventoryId);
    expect(Number(result)).toBe(0);
  });

  it('calculates outstanding provider amount correctly', async () => {
    const user = await seedUser(prisma);
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
          quantity: 10,
          unitPrice: 50,
          productionDate: new Date('2025-01-01'),
          expirationDate: new Date('2026-12-31'),
        },
      ],
    });

    // totalValue = 500, paidAmount = 100, due = 400
    const due = await getDueToProviders(prisma, inventoryId);
    expect(Number(due)).toBe(400);
  });
});

describe('getAllOverduePayments', () => {
  it('includes sale with past due date and outstanding balance', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 20,
      discount: 0,
      payDueDate: new Date('2020-01-01'), // past due
      date: new Date('2019-12-01'),
      products: [{ id: product.id, quantity: 5, unitPrice: 30 }],
    });

    const result = await getAllOverduePayments(prisma, inventoryId);
    expect(Number(result.count)).toBeGreaterThanOrEqual(1);
    expect(Number(result.totalRemainingAmount)).toBeGreaterThan(0);
  });

  it('excludes fully-paid sale even if past due date', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    // Fully paid sale: paidAmount = total cost
    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 150,
      discount: 0,
      payDueDate: new Date('2020-01-01'), // past due
      date: new Date('2019-12-01'),
      products: [{ id: product.id, quantity: 5, unitPrice: 30 }],
    });

    const result = await getAllOverduePayments(prisma, inventoryId);
    expect(Number(result.count)).toBe(0);
  });
});

describe('getExpiringProducts', () => {
  it('returns products expiring within the warning window', async () => {
    const product = await seedProduct(prisma, { name: 'Expiring Soon' });
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 5); // expires in 5 days

    await seedProductBatch(prisma, product.id, {
      expirationDate: soonDate,
      quantity: 20,
    });

    const results = await getExpiringProducts(prisma, inventoryId, 10);
    const found = results.find((r) => r.name === 'Expiring Soon');
    expect(found).toBeDefined();
  });

  it('does not return products expiring beyond the window', async () => {
    const product = await seedProduct(prisma, { name: 'Far Future' });
    const farDate = new Date();
    farDate.setDate(farDate.getDate() + 60); // expires in 60 days

    await seedProductBatch(prisma, product.id, {
      expirationDate: farDate,
      quantity: 20,
    });

    const results = await getExpiringProducts(prisma, inventoryId, 10);
    const found = results.find((r) => r.name === 'Far Future');
    expect(found).toBeUndefined();
  });
});

describe('getLowStockProducts', () => {
  it('returns product with total quantity at or below threshold', async () => {
    const product = await seedProduct(prisma, { name: 'Low Stock Item' });
    await seedProductBatch(prisma, product.id, { quantity: 5 });

    const results = await getLowStockProducts(prisma, inventoryId, 10);
    const found = results.find((r) => r.name === 'Low Stock Item');
    expect(found).toBeDefined();
    expect(Number(found?.totalQuantity)).toBe(5);
  });

  it('does not return product above the threshold', async () => {
    const product = await seedProduct(prisma, { name: 'Well Stocked' });
    await seedProductBatch(prisma, product.id, { quantity: 50 });

    const results = await getLowStockProducts(prisma, inventoryId, 10);
    const found = results.find((r) => r.name === 'Well Stocked');
    expect(found).toBeUndefined();
  });
});

describe('getTopUpcomingPayingCustomers', () => {
  it('returns at most 5 customers with outstanding balances, ordered by payDueDate', async () => {
    const user = await seedUser(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 1000 });

    for (let i = 0; i < 6; i++) {
      const customer = await seedCustomer(prisma);
      const due = new Date();
      due.setDate(due.getDate() + i + 1);
      await createSale(prisma, inventoryId, {
        userId: user.id,
        customerId: customer.id,
        paidAmount: 0,
        discount: 0,
        payDueDate: due,
        date: new Date(),
        products: [{ id: product.id, quantity: 1, unitPrice: 100 }],
      });
    }

    const results = await getTopUpcomingPayingCustomers(prisma, inventoryId);
    expect(results).toHaveLength(5);
    // First result should have the earliest due date
    expect(new Date(results[0].payDueDate).getTime()).toBeLessThan(
      new Date(results[4].payDueDate).getTime(),
    );
  });

  it('excludes fully-paid sales from upcoming customers', async () => {
    const user = await seedUser(prisma);
    const customer = await seedCustomer(prisma);
    const product = await seedProduct(prisma);
    await seedProductBatch(prisma, product.id, { quantity: 100 });

    await createSale(prisma, inventoryId, {
      userId: user.id,
      customerId: customer.id,
      paidAmount: 50,
      discount: 0,
      payDueDate: new Date('2026-12-31'),
      date: new Date(),
      products: [{ id: product.id, quantity: 1, unitPrice: 50 }],
    });

    const results = await getTopUpcomingPayingCustomers(prisma, inventoryId);
    expect(results).toHaveLength(0);
  });
});

describe('getTopUpcomingPayingProviders', () => {
  it('returns at most 5 providers with outstanding balances, ordered by payDueDate', async () => {
    const user = await seedUser(prisma);
    const product = await seedProduct(prisma);

    for (let i = 0; i < 6; i++) {
      const provider = await seedProvider(prisma);
      const due = new Date();
      due.setDate(due.getDate() + i + 1);
      await createPurchase(prisma, inventoryId, {
        userId: user.id,
        providerId: provider.id,
        paidAmount: 0,
        payDueDate: due,
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

    const results = await getTopUpcomingPayingProviders(prisma, inventoryId);
    expect(results).toHaveLength(5);
  });
});
