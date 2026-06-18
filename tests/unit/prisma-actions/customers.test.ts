import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getAllCustomersPaginated,
  getCustomerById,
  updateCustomer,
} from '@/prisma-actions/customer.actions.ts';
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

describe('getAllCustomersPaginated', () => {
  it('returns page 1 of 10 with total of 15', async () => {
    for (let i = 0; i < 15; i++) {
      await prisma.customer.create({
        data: {
          firstname: `First${i}`,
          lastname: `Last${i}`,
          phone: `010${String(i).padStart(8, '0')}`,
          inventoryId,
        },
      });
    }

    const result = await getAllCustomersPaginated(prisma, inventoryId, {
      page: 1,
      filter: [],
    } as any);

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
  });

  it('returns page 2 with 5 remaining records', async () => {
    for (let i = 0; i < 15; i++) {
      await prisma.customer.create({
        data: {
          firstname: `First${i}`,
          lastname: `Last${i}`,
          phone: `011${String(i).padStart(8, '0')}`,
          inventoryId,
        },
      });
    }

    const result = await getAllCustomersPaginated(prisma, inventoryId, {
      page: 2,
      filter: [],
    } as any);

    expect(result.data).toHaveLength(5);
    expect(result.total).toBe(15);
  });

  it('sorts by firstname ascending', async () => {
    const names = ['Zara', 'Alice', 'Mohamed'];
    for (let i = 0; i < names.length; i++) {
      await prisma.customer.create({
        data: {
          firstname: names[i],
          lastname: 'Test',
          phone: `012${String(i).padStart(8, '0')}`,
          inventoryId,
        },
      });
    }

    const result = await getAllCustomersPaginated(prisma, inventoryId, {
      page: 1,
      orderProperty: 'firstname',
      orderDirection: 'asc',
      filter: [],
    } as any);

    expect(result.data[0].firstname).toBe('Alice');
  });
});

describe('getAllCustomers', () => {
  it('returns only id, firstname, lastname fields', async () => {
    await prisma.customer.create({
      data: {
        firstname: 'Minimal',
        lastname: 'Return',
        phone: '01099999999',
        address: 'Some Street',
        inventoryId,
      },
    });

    const customers = await getAllCustomers(prisma, inventoryId);

    expect(customers.length).toBeGreaterThan(0);
    const customer = customers[0];
    expect(customer).toHaveProperty('id');
    expect(customer).toHaveProperty('firstname');
    expect(customer).toHaveProperty('lastname');
    expect(customer).not.toHaveProperty('phone');
    expect(customer).not.toHaveProperty('address');
  });
});

describe('CRUD round-trip', () => {
  it('creates, updates, and deletes a customer', async () => {
    const created = await createCustomer(prisma, inventoryId, {
      firstname: 'Create',
      lastname: 'Me',
      phone: '01011111111',
    } as any);

    expect(created.firstname).toBe('Create');

    await updateCustomer(prisma, created.id, {
      ...created,
      firstname: 'Updated',
    });

    const updated = await getCustomerById(prisma, created.id);
    expect(updated?.firstname).toBe('Updated');

    await deleteCustomer(prisma, created.id);

    const deleted = await getCustomerById(prisma, created.id);
    expect(deleted).toBeNull();
  });
});
