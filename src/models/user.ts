import type { User } from '../../generated/prisma/client.ts';

export type UserModel = Omit<User, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};
export type CurrentUser = Omit<User, 'password' | 'createdAt' | 'updatedAt'>;
