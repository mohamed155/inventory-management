import type { UserModel } from '@/models/user.ts';

export const signIn = async (username: string, password: string) => {
  const signIn = window.electronAPI.signIn;
  return await signIn(username, password);
};

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
