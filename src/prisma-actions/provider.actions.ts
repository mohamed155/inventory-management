import type { PrismaClient } from '@prisma/client';
import type { DataParams } from '@/models/params.ts';
import type { Provider } from '../../generated/prisma/client.ts';
import type { ProviderWhereInput } from '../../generated/prisma/models/Provider.ts';

export const getAllProvidersPaginated = async (
  prisma: PrismaClient,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Provider, ProviderWhereInput>,
) => {
  const data = await prisma.provider.findMany({
    where: { AND: filter },
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.provider.count()) as number;
  return { data, total };
};

export const getAllProviders = async (prisma: PrismaClient) => {
  const providers = await prisma.provider.findMany({});
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

export const createProvider = (prisma: PrismaClient, provider: Provider) => {
  return prisma.provider.create({
    data: provider,
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
