import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createProvider,
  deleteProvider,
  getAllProviders,
  getAllProvidersPaginated,
  getProviderById,
  updateProvider,
} from '@/prisma-actions/provider.actions.ts';
import type { PrismaClient } from '../../../generated/prisma/client.ts';
import { clearDatabase, createTestPrisma } from '../../setup/db.ts';

let prisma: PrismaClient;
let closeDb: () => void;

beforeAll(async () => {
  const db = await createTestPrisma();
  prisma = db.prisma;
  closeDb = db.close;
});

afterAll(() => {
  closeDb();
});

afterEach(async () => {
  await clearDatabase(prisma);
});

describe('getAllProvidersPaginated', () => {
  it('returns page 1 of 10 with total of 15', async () => {
    for (let i = 0; i < 15; i++) {
      await prisma.provider.create({
        data: {
          name: `Provider ${i}`,
          phone: `010${String(i).padStart(8, '0')}`,
        },
      });
    }

    const result = await getAllProvidersPaginated(prisma, {
      page: 1,
      filter: [],
    } as any);

    expect(result.data).toHaveLength(10);
    expect(result.total).toBe(15);
  });

  it('sorts by name ascending', async () => {
    const names = ['Zeta Corp', 'Alpha Co', 'Beta Ltd'];
    for (let i = 0; i < names.length; i++) {
      await prisma.provider.create({
        data: {
          name: names[i],
          phone: `012${String(i).padStart(8, '0')}`,
        },
      });
    }

    const result = await getAllProvidersPaginated(prisma, {
      page: 1,
      orderProperty: 'name',
      orderDirection: 'asc',
      filter: [],
    } as any);

    expect(result.data[0].name).toBe('Alpha Co');
  });
});

describe('getAllProviders', () => {
  it('returns only id and name fields', async () => {
    await prisma.provider.create({
      data: { name: 'Minimal Provider', phone: '01099999990' },
    });

    const providers = await getAllProviders(prisma);

    expect(providers.length).toBeGreaterThan(0);
    const provider = providers[0];
    expect(provider).toHaveProperty('id');
    expect(provider).toHaveProperty('name');
    expect(provider).not.toHaveProperty('phone');
  });
});

describe('CRUD round-trip', () => {
  it('creates, updates, and deletes a provider', async () => {
    const created = await createProvider(prisma, {
      name: 'Create Me',
      phone: '01022222222',
    } as any);

    expect(created.name).toBe('Create Me');

    await updateProvider(prisma, created.id, {
      ...created,
      name: 'Updated Provider',
    });

    const updated = await getProviderById(prisma, created.id);
    expect(updated?.name).toBe('Updated Provider');

    await deleteProvider(prisma, created.id);

    const deleted = await getProviderById(prisma, created.id);
    expect(deleted).toBeNull();
  });
});
