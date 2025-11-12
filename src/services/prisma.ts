import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

const initPrisma = () => {
  prisma = new PrismaClient();
};

export const getPrisma = () => {
  if (!prisma) {
    initPrisma();
  }
  return prisma;
};
