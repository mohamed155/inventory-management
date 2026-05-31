import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubElectronAPI } from '../../setup/electron-api.ts';

const ok = <T>(data: T) => ({ success: true as const, data });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dashboard service', () => {
  it('getTotalSalesAmount delegates to electronAPI', async () => {
    const mock = stubElectronAPI({
      getTotalSalesAmount: vi.fn().mockResolvedValue(ok(1500)),
    });
    const { getTotalSalesAmount } = await import(
      '../../../src/services/dashboard.ts'
    );
    const result = await getTotalSalesAmount();
    expect(mock.getTotalSalesAmount).toHaveBeenCalledOnce();
    expect(result).toBe(1500);
  });

  it('getTotalPurchasesAmount delegates to electronAPI', async () => {
    const mock = stubElectronAPI({
      getTotalPurchasesAmount: vi.fn().mockResolvedValue(ok(800)),
    });
    const { getTotalPurchasesAmount } = await import(
      '../../../src/services/dashboard.ts'
    );
    const result = await getTotalPurchasesAmount();
    expect(mock.getTotalPurchasesAmount).toHaveBeenCalledOnce();
    expect(result).toBe(800);
  });

  it('getTotalProfit delegates to electronAPI', async () => {
    const mock = stubElectronAPI({
      getTotalProfit: vi.fn().mockResolvedValue(ok(700)),
    });
    const { getTotalProfit } = await import(
      '../../../src/services/dashboard.ts'
    );
    const result = await getTotalProfit();
    expect(mock.getTotalProfit).toHaveBeenCalledOnce();
    expect(result).toBe(700);
  });

  it('getDueFromCustomers delegates to electronAPI', async () => {
    const mock = stubElectronAPI({
      getDueFromCustomers: vi.fn().mockResolvedValue(ok(200)),
    });
    const { getDueFromCustomers } = await import(
      '../../../src/services/dashboard.ts'
    );
    const result = await getDueFromCustomers();
    expect(mock.getDueFromCustomers).toHaveBeenCalledOnce();
    expect(result).toBe(200);
  });

  it('getDueToProviders delegates to electronAPI', async () => {
    const mock = stubElectronAPI({
      getDueToProviders: vi.fn().mockResolvedValue(ok(300)),
    });
    const { getDueToProviders } = await import(
      '../../../src/services/dashboard.ts'
    );
    const result = await getDueToProviders();
    expect(mock.getDueToProviders).toHaveBeenCalledOnce();
    expect(result).toBe(300);
  });

  it('getAllOverduePayments delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getAllOverduePayments } = await import(
      '../../../src/services/dashboard.ts'
    );
    await getAllOverduePayments();
    expect(mock.getAllOverduePayments).toHaveBeenCalledOnce();
  });

  it('getExpiringProducts passes days argument through', async () => {
    const mock = stubElectronAPI();
    const { getExpiringProducts } = await import(
      '../../../src/services/dashboard.ts'
    );
    await getExpiringProducts(30);
    expect(mock.getExpiringProducts).toHaveBeenCalledWith(30);
  });

  it('getLowStockProducts passes threshold argument through', async () => {
    const mock = stubElectronAPI();
    const { getLowStockProducts } = await import(
      '../../../src/services/dashboard.ts'
    );
    await getLowStockProducts(5);
    expect(mock.getLowStockProducts).toHaveBeenCalledWith(5);
  });

  it('getTopUpcomingPayingCustomers delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getTopUpcomingPayingCustomers } = await import(
      '../../../src/services/dashboard.ts'
    );
    await getTopUpcomingPayingCustomers();
    expect(mock.getTopUpcomingPayingCustomers).toHaveBeenCalledOnce();
  });

  it('getTopUpcomingPayingProviders delegates to electronAPI', async () => {
    const mock = stubElectronAPI();
    const { getTopUpcomingPayingProviders } = await import(
      '../../../src/services/dashboard.ts'
    );
    await getTopUpcomingPayingProviders();
    expect(mock.getTopUpcomingPayingProviders).toHaveBeenCalledOnce();
  });
});
