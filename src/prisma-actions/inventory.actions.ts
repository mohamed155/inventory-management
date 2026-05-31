// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type { Inventory } from '../../generated/prisma/client.ts';

export const getAllInventories = (prisma: PrismaClient): Promise<Inventory[]> => {
  return prisma.inventory.findMany({ orderBy: { createdAt: 'asc' } });
};

export const getInventoryById = (
  prisma: PrismaClient,
  id: string,
): Promise<Inventory | null> => {
  return prisma.inventory.findUnique({ where: { id } });
};

export const getInventoriesCount = (prisma: PrismaClient): Promise<number> => {
  return prisma.inventory.count();
};

export const createInventory = (
  prisma: PrismaClient,
  name: string,
): Promise<Inventory> => {
  return prisma.inventory.create({ data: { name } });
};

export const updateInventory = (
  prisma: PrismaClient,
  id: string,
  name: string,
): Promise<Inventory> => {
  return prisma.inventory.update({ where: { id }, data: { name } });
};

export const deleteInventory = async (
  prisma: PrismaClient,
  id: string,
): Promise<void> => {
  const count = await prisma.inventory.count();
  if (count <= 1) {
    throw new Error('Cannot delete the last inventory');
  }
  await prisma.inventory.delete({ where: { id } });
};
