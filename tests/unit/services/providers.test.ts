import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubElectronAPI } from '../../setup/electron-api.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('providers service', () => {
  it('getAllProvidersPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProvidersPaginated } = await import(
      '../../../src/services/providers.ts'
    );
    const params = { page: 1, filter: [] } as any;
    await getAllProvidersPaginated(params);
    expect(mock.getAllProvidersPaginated).toHaveBeenCalledWith(params);
  });

  it('getAllProviders delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProviders } = await import(
      '../../../src/services/providers.ts'
    );
    await getAllProviders();
    expect(mock.getAllProviders).toHaveBeenCalledOnce();
  });

  it('getProviderById delegates with correct id', async () => {
    const mock = stubElectronAPI();
    const { getProviderById } = await import(
      '../../../src/services/providers.ts'
    );
    await getProviderById('prov-123');
    expect(mock.getProviderById).toHaveBeenCalledWith('prov-123');
  });

  it('createProvider delegates with provider data', async () => {
    const mock = stubElectronAPI();
    const { createProvider } = await import(
      '../../../src/services/providers.ts'
    );
    const payload = { name: 'New Prov' } as any;
    await createProvider(payload);
    expect(mock.createProvider).toHaveBeenCalledWith(payload);
  });

  it('updateProvider delegates with id and data', async () => {
    const mock = stubElectronAPI();
    const { updateProvider } = await import(
      '../../../src/services/providers.ts'
    );
    const payload = { name: 'Updated' } as any;
    await updateProvider('p-id', payload);
    expect(mock.updateProvider).toHaveBeenCalledWith('p-id', payload);
  });

  it('deleteProvider delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { deleteProvider } = await import(
      '../../../src/services/providers.ts'
    );
    await deleteProvider('p-del');
    expect(mock.deleteProvider).toHaveBeenCalledWith('p-del');
  });
});
