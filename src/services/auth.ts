import { redirect } from 'react-router';
import type { User } from '@/models/user.ts';
import { getPrisma } from '@/services/prisma.ts';

export const isAuthenticated = () => {
  throw redirect('signup');
};

export const createUser = (user: User) => {
  const prisma = getPrisma();
  prisma.user.create({
    data: user,
  });
};
