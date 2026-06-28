// @ts-expect-error -- @prisma/client types are resolved at runtime in the Electron main process
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { User } from '../../generated/prisma/client.ts';

export type SafeUser = Omit<User, 'password'>;

const selectSafeUser = {
  id: true,
  firstname: true,
  lastname: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

const sanitizeUser = (user: User): SafeUser => {
  const { password: _password, ...safeUser } = user;
  return safeUser;
};

export const getAllUsers = (prisma: PrismaClient) => {
  return prisma.user.findMany({ select: selectSafeUser });
};

export const getUserById = (prisma: PrismaClient, id: string) => {
  return prisma.user.findUnique({
    where: { id },
    select: selectSafeUser,
  });
};

export const getUserByUsername = (prisma: PrismaClient, username: string) => {
  return prisma.user.findUnique({
    where: { username },
    select: selectSafeUser,
  });
};

const getUserByUsernameWithPassword = (
  prisma: PrismaClient,
  username: string,
) => {
  return prisma.user.findUnique({
    where: { username },
  });
};

export const getUsersCount = (prisma: PrismaClient) => {
  return prisma.user.count();
};

export const createUser = async (prisma: PrismaClient, user: User) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const createdUser = await prisma.user.create({
    data: {
      firstname: user.firstname,
      lastname: user.lastname,
      username: user.username,
      role: user.role,
      password: hashedPassword,
    },
  });
  return sanitizeUser(createdUser);
};

export const signIn = async (
  prisma: PrismaClient,
  username: string,
  password: string,
) => {
  const user = await getUserByUsernameWithPassword(prisma, username);
  const isMatch = await bcrypt.compare(password, user?.password || '');
  if (user && isMatch) {
    return sanitizeUser(user);
  }
  return null;
};

export const updateUser = async (
  prisma: PrismaClient,
  id: string,
  data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>,
) => {
  if (data.role && data.role !== 'admin') {
    const currentUser = await prisma.user.findUnique({ where: { id } });
    if (currentUser?.role === 'admin') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new Error('Cannot remove the last admin');
      }
    }
  }
  const updateData: typeof data = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10);
  } else {
    delete updateData.password;
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });
  return sanitizeUser(updatedUser);
};

export const deleteUser = async (prisma: PrismaClient, id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.role === 'admin') {
    const adminCount = await prisma.user.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      throw new Error('Cannot delete the last admin');
    }
  }
  const deletedUser = await prisma.user.delete({ where: { id } });
  return sanitizeUser(deletedUser);
};
