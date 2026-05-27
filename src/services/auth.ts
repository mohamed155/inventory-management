import { unwrap } from '@/lib/ipc.ts';
import type { UserModel } from '@/models/user.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

export const signIn = (username: string, password: string) =>
  window.electronAPI.signIn(username, password).then(unwrap);

export const createUser = (user: UserModel) =>
  window.electronAPI.createUser(user).then(unwrap);

export const getUsers = () => window.electronAPI.getUsers().then(unwrap);

export const updateUser = (id: string, data: Partial<UserModel>) =>
  window.electronAPI.updateUser(id, data).then(unwrap);

export const deleteUser = (id: string) =>
  window.electronAPI.deleteUser(id).then(unwrap);

export const getUserByUsername = (username: string) =>
  window.electronAPI.getUserByUsername(username).then(unwrap);

export const getUsersCount = () =>
  window.electronAPI.getUsersCount().then(unwrap);

export const logout = () => {
  useCurrentUserStore.setState({ currentUser: null });
  localStorage.removeItem('user');
  window.location.hash = '/login';
};
