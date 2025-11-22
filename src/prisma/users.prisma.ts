import type { PrismaClient } from '@prisma/client';
import type { User } from '../../generated/prisma/client.ts';

export const getAllUsers = (prisma: PrismaClient) => {
  return prisma.user.findMany();
};

export const getUserById = (prisma: PrismaClient, id: string) => {
  return prisma.user.findUnique({
    where: { id },
  });
};

export const getUserByUsername = (prisma: PrismaClient, username: string) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const getUsersCount = (prisma: PrismaClient) => {
  return prisma.user.count();
};

export const createUser = (prisma: PrismaClient, user: User) => {
  return prisma.user.create({
    data: user,
  });
};
