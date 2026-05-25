import { unwrap } from '@/lib/ipc.ts';
import type { UserModel } from '@/models/user.ts';
import { useCurrentUserStore } from '@/store/user.store.ts';

export const signIn = (username: string, password: string) =>
  window.electronAPI.signIn(username, password).then(unwrap);

export const createUser = (user: UserModel) =>
  window.electronAPI.createUser(user).then(unwrap);

export const getUserByUsername = (username: string) =>
  window.electronAPI.getUserByUsername(username).then(unwrap);

export const getUsersCount = () =>
  window.electronAPI.getUsersCount().then(unwrap);

export const logout = () => {
  useCurrentUserStore.setState({ currentUser: null });
  localStorage.clear();
  window.location.hash = '/login';
};
