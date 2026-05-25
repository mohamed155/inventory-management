import bcrypt from 'bcryptjs';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  createUser,
  getUserById,
  getUserByUsername,
  getUsersCount,
  signIn,
} from '@/prisma-actions/users.action.ts';
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

describe('createUser', () => {
  it('hashes the password before storing', async () => {
    const user = await createUser(prisma, {
      firstname: 'Test',
      lastname: 'User',
      username: 'hashtest',
      password: 'plaintext123',
    } as any);

    expect(user.password).not.toBe('plaintext123');
    const isHashed = await bcrypt.compare('plaintext123', user.password);
    expect(isHashed).toBe(true);
  });

  it('stores user retrievable by username', async () => {
    await createUser(prisma, {
      firstname: 'Test',
      lastname: 'User',
      username: 'retrievetest',
      password: 'pass',
    } as any);

    const found = await getUserByUsername(prisma, 'retrievetest');
    expect(found).not.toBeNull();
    expect(found?.username).toBe('retrievetest');
  });
});

describe('signIn', () => {
  it('returns user object on correct credentials', async () => {
    await createUser(prisma, {
      firstname: 'Auth',
      lastname: 'User',
      username: 'authuser',
      password: 'correctpass',
    } as any);

    const result = await signIn(prisma, 'authuser', 'correctpass');
    expect(result).not.toBeNull();
    expect(result?.username).toBe('authuser');
  });

  it('returns null for wrong password', async () => {
    await createUser(prisma, {
      firstname: 'Auth',
      lastname: 'User',
      username: 'wrongpass',
      password: 'correctpass',
    } as any);

    const result = await signIn(prisma, 'wrongpass', 'wrongpass');
    expect(result).toBeNull();
  });

  it('returns null for non-existent username', async () => {
    const result = await signIn(prisma, 'nobody', 'anypass');
    expect(result).toBeNull();
  });
});

describe('getUsersCount', () => {
  it('returns 0 on empty database', async () => {
    const count = await getUsersCount(prisma);
    expect(count).toBe(0);
  });

  it('returns 1 after seeding one user', async () => {
    await createUser(prisma, {
      firstname: 'Count',
      lastname: 'Test',
      username: 'counttest',
      password: 'pass',
    } as any);

    const count = await getUsersCount(prisma);
    expect(count).toBe(1);
  });
});

describe('getUserById', () => {
  it('returns user for known id', async () => {
    const created = await createUser(prisma, {
      firstname: 'By',
      lastname: 'Id',
      username: 'byidtest',
      password: 'pass',
    } as any);

    const found = await getUserById(prisma, created.id);
    expect(found?.id).toBe(created.id);
  });

  it('returns null for unknown id', async () => {
    const found = await getUserById(prisma, 'no-such-id');
    expect(found).toBeNull();
  });
});
