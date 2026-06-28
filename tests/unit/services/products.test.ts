import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubElectronAPI } from '../../setup/electron-api.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('products service', () => {
  it('getAllProductsPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProductsPaginated } = await import(
      '../../../src/services/products.ts'
    );
    const params = { page: 1, filter: [] } as any;
    await getAllProductsPaginated(params);
    expect(mock.getAllProductsPaginated).toHaveBeenCalledWith('', params);
  });

  it('getAllProducts delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProducts } = await import(
      '../../../src/services/products.ts'
    );
    await getAllProducts();
    expect(mock.getAllProducts).toHaveBeenCalledOnce();
  });

  it('getProductById delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { getProductById } = await import(
      '../../../src/services/products.ts'
    );
    await getProductById('prod-1');
    expect(mock.getProductById).toHaveBeenCalledWith('prod-1');
  });

  it('createProduct delegates with product data', async () => {
    const mock = stubElectronAPI();
    const { createProduct } = await import('../../../src/services/products.ts');
    const payload = { name: 'New Product' } as any;
    await createProduct(payload);
    expect(mock.createProduct).toHaveBeenCalledWith('', payload);
  });

  it('updateProduct delegates with id and data', async () => {
    const mock = stubElectronAPI();
    const { updateProduct } = await import('../../../src/services/products.ts');
    const payload = { name: 'Updated' } as any;
    await updateProduct('prod-id', payload);
    expect(mock.updateProduct).toHaveBeenCalledWith('prod-id', payload);
  });

  it('deleteProduct delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { deleteProduct } = await import('../../../src/services/products.ts');
    await deleteProduct('prod-del');
    expect(mock.deleteProduct).toHaveBeenCalledWith('prod-del');
  });

  it('getAllProductBatchesPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProductBatchesPaginated } = await import(
      '../../../src/services/products.ts'
    );
    const params = { page: 1, filter: [] } as any;
    await getAllProductBatchesPaginated(params);
    expect(mock.getAllProductBatchesPaginated).toHaveBeenCalledWith('', params);
  });

  it('getAllProductBatches delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllProductBatches } = await import(
      '../../../src/services/products.ts'
    );
    await getAllProductBatches();
    expect(mock.getAllProductBatches).toHaveBeenCalledOnce();
  });

  it('createProductBatch delegates with data', async () => {
    const mock = stubElectronAPI();
    const { createProductBatch } = await import(
      '../../../src/services/products.ts'
    );
    const payload = { name: 'Batch', quantity: 10 } as any;
    await createProductBatch(payload);
    expect(mock.createProductBatch).toHaveBeenCalledWith('', payload);
  });

  it('updateProductBatch delegates with id and data', async () => {
    const mock = stubElectronAPI();
    const { updateProductBatch } = await import(
      '../../../src/services/products.ts'
    );
    const payload = { quantity: 20 } as any;
    await updateProductBatch('batch-id', payload);
    expect(mock.updateProductBatch).toHaveBeenCalledWith('batch-id', payload);
  });

  it('deleteProductBatch delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { deleteProductBatch } = await import(
      '../../../src/services/products.ts'
    );
    await deleteProductBatch('batch-del');
    expect(mock.deleteProductBatch).toHaveBeenCalledWith('batch-del');
  });
});
