import type { PrismaClient } from '@prisma/client';
import type { DataParams } from '@/models/params.ts';
import type { Customer } from '../../generated/prisma/client.ts';
import type { CustomerWhereInput } from '../../generated/prisma/models/Customer.ts';

export const getAllCustomersPaginated = async (
  prisma: PrismaClient,
  {
    page,
    orderDirection,
    orderProperty,
    filter,
  }: DataParams<Customer, CustomerWhereInput>,
) => {
  const data = await prisma.customer.findMany({
    where: { AND: filter },
    orderBy: orderProperty ? { [orderProperty]: orderDirection } : undefined,
    skip: (page - 1) * 10,
    take: 10,
  });
  const total = (await prisma.customer.count()) as number;
  return { data, total };
};

export const getAllCustomers = async (prisma: PrismaClient) => {
  const customers = await prisma.customer.findMany({});
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

export const createCustomer = (prisma: PrismaClient, customer: Customer) => {
  return prisma.customer.create({
    data: customer,
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
