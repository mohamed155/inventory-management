import type { User } from '../../generated/prisma/client.ts';

export type UserRole = 'admin' | 'assistant';

export type UserModel = Omit<User, 'createdAt' | 'updatedAt' | 'id'> & {
  id?: string;
};
export type CurrentUser = Omit<User, 'password' | 'createdAt' | 'updatedAt'>;
