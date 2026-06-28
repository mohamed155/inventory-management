// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type { DataParams } from '@/models/params.ts';
import type { Provider } from '../../generated/prisma/client.ts';
import type { ProviderWhereInput } from '../../generated/prisma/models/Provider.ts';

export const getAllProvidersPaginated = async (
  prisma: PrismaClient,
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Provider, ProviderWhereInput>,
) => {
  const where = {
    AND: [{ inventoryId }, ...(filter ? [filter as ProviderWhereInput] : [])],
  };
  const data = await prisma.provider.findMany({
    where,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.provider.count({ where })) as number;
  return { data, total };
};

export const getAllProviders = async (
  prisma: PrismaClient,
  inventoryId: string,
) => {
  const providers = await prisma.provider.findMany({
    where: { inventoryId },
  });
  return providers.map((provider: Provider) => ({
    id: provider.id,
    name: provider.name,
  }));
};

export const getProviderById = (prisma: PrismaClient, id: string) => {
  return prisma.provider.findUnique({
    where: { id },
  });
};

export const createProvider = (
  prisma: PrismaClient,
  inventoryId: string,
  provider: Provider,
) => {
  return prisma.provider.create({
    data: {
      name: provider.name,
      phone: provider.phone,
      address: provider.address,
      inventory: { connect: { id: inventoryId } },
    },
  });
};

export const updateProvider = (
  prisma: PrismaClient,
  id: string,
  provider: Provider,
) => {
  return prisma.provider.update({
    where: { id },
    data: provider,
  });
};

export const deleteProvider = (prisma: PrismaClient, id: string) => {
  return prisma.provider.delete({
    where: { id },
  });
};
