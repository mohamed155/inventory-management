import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '@prisma/client';
import { env } from 'prisma/config';

let prisma: PrismaClient | null = null;

const initPrisma = () => {
  const adapter = new PrismaBetterSQLite3({ url: env('DATABASE_URL') });
  prisma = new PrismaClient({ adapter });
};

export const getPrisma = () => {
  if (!prisma) {
    initPrisma();
  }
  return prisma;
};
