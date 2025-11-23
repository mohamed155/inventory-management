import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
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

export const createUser = async (prisma: PrismaClient, user: User) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return prisma.user.create({
    data: { ...user, password: hashedPassword },
  });
};

export const signIn = async (
  prisma: PrismaClient,
  username: string,
  password: string,
) => {
  console.log(username, password);
  const user = await getUserByUsername(prisma, username);
  console.log(user);
  const isMatch = await bcrypt.compare(password, user?.password || '');
  console.log(isMatch);
  if (user && isMatch) {
    return user;
  }
  return null;
};
