import { unwrap } from '@/lib/ipc.ts';

export const inventoryKeys = {
  all: ['inventories'] as const,
};

export const getAllInventories = () =>
  window.electronAPI.getAllInventories().then(unwrap);

export const getInventoryById = (id: string) =>
  window.electronAPI.getInventoryById(id).then(unwrap);

export const getInventoriesCount = () =>
  window.electronAPI.getInventoriesCount().then(unwrap);

export const createInventory = (name: string) =>
  window.electronAPI.createInventory(name).then(unwrap);

export const updateInventory = (id: string, name: string) =>
  window.electronAPI.updateInventory(id, name).then(unwrap);

export const deleteInventory = (id: string) =>
  window.electronAPI.deleteInventory(id).then(unwrap);
