import { unwrap } from '@/lib/ipc.ts';
import type { DataParams } from '@/models/params.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';
import type { Provider } from '../../generated/prisma/browser.ts';
import type { ProviderWhereInput } from '../../generated/prisma/models/Provider.ts';

const getInventoryId = () => useInventoryStore.getState().activeInventoryId ?? '';

export const providerKeys = {
  all: (inventoryId: string) => ['providers', inventoryId] as const,
  paginated: (inventoryId: string, params: unknown) => ['providers', inventoryId, params] as const,
};

export const getAllProvidersPaginated = (
  params: DataParams<Provider, ProviderWhereInput>,
) => window.electronAPI.getAllProvidersPaginated(getInventoryId(), params).then(unwrap);

export const getAllProviders = () =>
  window.electronAPI.getAllProviders(getInventoryId()).then(unwrap);

export const getProviderById = (id: string) =>
  window.electronAPI.getProviderById(id).then(unwrap);

export const createProvider = (provider: Provider) =>
  window.electronAPI.createProvider(getInventoryId(), provider).then(unwrap);

export const updateProvider = (id: string, provider: Provider) =>
  window.electronAPI.updateProvider(id, provider).then(unwrap);

export const deleteProvider = (id: string) =>
  window.electronAPI.deleteProvider(id).then(unwrap);
