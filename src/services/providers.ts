import type { DataParams } from '@/models/params.ts';
import type { Provider } from '../../generated/prisma/browser.ts';
import type { ProviderWhereInput } from '../../generated/prisma/models/Provider.ts';

export const getAllProvidersPaginated = (
  params: DataParams<Provider, ProviderWhereInput>,
) => {
  const getAllProvidersPaginated = window.electronAPI.getAllProvidersPaginated;
  return getAllProvidersPaginated(params);
};

export const getAllProviders = () => {
  const getAllProviders = window.electronAPI.getAllProviders;
  return getAllProviders();
};

export const getProviderById = (id: string) => {
  const getProviderBtId = window.electronAPI.getProviderById;
  return getProviderBtId(id);
};

export const createProvider = (provider: Provider) => {
  const createProvider = window.electronAPI.createProvider;
  return createProvider(provider);
};

export const updateProvider = (id: string, provider: Provider) => {
  const updateProvider = window.electronAPI.updateProvider;
  return updateProvider(id, provider);
};

export const deleteProvider = (id: string) => {
  const deleteProvider = window.electronAPI.deleteProvider;
  return deleteProvider(id);
};
