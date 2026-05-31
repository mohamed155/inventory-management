// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import type { DataParams } from '@/models/params.ts';
import type { Customer } from '../../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../../generated/prisma/models/Customer.ts';

export const getAllCustomersPaginated = async (
  prisma: PrismaClient,
  inventoryId: string,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Customer, CustomerWhereInput>,
) => {
  const where = {
    AND: [{ inventoryId }, ...(filter ? [filter as CustomerWhereInput] : [])],
  };
  const data = await prisma.customer.findMany({
    where,
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.customer.count({ where })) as number;
  return { data, total };
};

export const getAllCustomers = async (prisma: PrismaClient, inventoryId: string) => {
  const customers = await prisma.customer.findMany({ where: { inventoryId } });
  return customers.map((customer: Customer) => ({
    id: customer.id,
    firstname: customer.firstname,
    lastname: customer.lastname,
  }));
};

export const getCustomerById = (prisma: PrismaClient, id: string) => {
  return prisma.customer.findUnique({
    where: { id },
  });
};

export const createCustomer = (prisma: PrismaClient, inventoryId: string, customer: Customer) => {
  return prisma.customer.create({
    data: {
      firstname: customer.firstname,
      lastname: customer.lastname,
      phone: customer.phone,
      address: customer.address,
      inventoryId,
    },
  });
};

export const updateCustomer = (
  prisma: PrismaClient,
  id: string,
  customer: Customer,
) => {
  return prisma.customer.update({
    where: { id },
    data: customer,
  });
};

export const deleteCustomer = (prisma: PrismaClient, id: string) => {
  return prisma.customer.delete({
    where: { id },
  });
};
