import type { UserModel } from '@/models/user.ts';

export const createUser = async (user: UserModel) => {
  const createUser = window.electronAPI.createUser;
  return await createUser(user);
};

export const getUserByUsername = async (username: string) => {
  const getUserByUsername = window.electronAPI.getUserByUsername;
  return await getUserByUsername(username);
};

export const getUsersCount = async () => {
  const getUsersCount = window.electronAPI.getUsersCount;
  return await getUsersCount();
};

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};
