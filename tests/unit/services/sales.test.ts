import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubElectronAPI } from '../../setup/electron-api.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sales service', () => {
  it('getAllSalesPaginated delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllSalesPaginated } = await import(
      '../../../src/services/sales.ts'
    );
    const params = { page: 1, filter: {} } as any;
    await getAllSalesPaginated(params);
    expect(mock.getAllSalesPaginated).toHaveBeenCalledWith(params);
  });

  it('getAllSales delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllSales } = await import('../../../src/services/sales.ts');
    await getAllSales();
    expect(mock.getAllSales).toHaveBeenCalledOnce();
  });

  it('getSaleById delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { getSaleById } = await import('../../../src/services/sales.ts');
    await getSaleById('sale-1');
    expect(mock.getSaleById).toHaveBeenCalledWith('sale-1');
  });

  it('createSale delegates with SaleFormData', async () => {
    const mock = stubElectronAPI();
    const { createSale } = await import('../../../src/services/sales.ts');
    const formData = {
      userId: 'u1',
      customerId: 'c1',
      paidAmount: 50,
      products: [],
    } as any;
    await createSale(formData);
    expect(mock.createSale).toHaveBeenCalledWith(formData);
  });

  it('updateSale delegates with id and partial data', async () => {
    const mock = stubElectronAPI();
    const { updateSale } = await import('../../../src/services/sales.ts');
    const partial = { paidAmount: 150 } as any;
    await updateSale('sale-id', partial);
    expect(mock.updateSale).toHaveBeenCalledWith('sale-id', partial);
  });

  it('deleteSale delegates with the id', async () => {
    const mock = stubElectronAPI();
    const { deleteSale } = await import('../../../src/services/sales.ts');
    await deleteSale('sale-del');
    expect(mock.deleteSale).toHaveBeenCalledWith('sale-del');
  });

  it('getAllSaleItems delegates with saleId', async () => {
    const mock = stubElectronAPI();
    const { getAllSaleItems } = await import('../../../src/services/sales.ts');
    await getAllSaleItems('sale-items');
    expect(mock.getAllSaleItems).toHaveBeenCalledWith('sale-items');
  });
});
