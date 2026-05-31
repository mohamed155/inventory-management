import { unwrap } from '@/lib/ipc.ts';
import { useInventoryStore } from '@/store/inventory.store.ts';

const getInventoryId = () => useInventoryStore.getState().activeInventoryId ?? '';

export const dashboardKeys = {
  totalSales: (inventoryId: string) => ['dashboard', 'totalSales', inventoryId] as const,
  totalPurchases: (inventoryId: string) => ['dashboard', 'totalPurchases', inventoryId] as const,
  totalProfit: (inventoryId: string) => ['dashboard', 'totalProfit', inventoryId] as const,
  dueFromCustomers: (inventoryId: string) => ['dashboard', 'dueFromCustomers', inventoryId] as const,
  dueToProviders: (inventoryId: string) => ['dashboard', 'dueToProviders', inventoryId] as const,
  overduePayments: (inventoryId: string) => ['dashboard', 'overduePayments', inventoryId] as const,
  expiringProducts: (inventoryId: string, days?: number) => ['dashboard', 'expiringProducts', inventoryId, days] as const,
  lowStock: (inventoryId: string, threshold?: number) => ['dashboard', 'lowStock', inventoryId, threshold] as const,
  topPayingCustomers: (inventoryId: string) => ['dashboard', 'topPayingCustomers', inventoryId] as const,
  topPayingProviders: (inventoryId: string) => ['dashboard', 'topPayingProviders', inventoryId] as const,
  monthlyChart: (inventoryId: string) => ['dashboard', 'monthlyChart', inventoryId] as const,
};

export const getTotalSalesAmount = () =>
  window.electronAPI.getTotalSalesAmount(getInventoryId()).then(unwrap);

export const getTotalPurchasesAmount = () =>
  window.electronAPI.getTotalPurchasesAmount(getInventoryId()).then(unwrap);

export const getTotalProfit = () =>
  window.electronAPI.getTotalProfit(getInventoryId()).then(unwrap);

export const getDueFromCustomers = () =>
  window.electronAPI.getDueFromCustomers(getInventoryId()).then(unwrap);

export const getDueToProviders = () =>
  window.electronAPI.getDueToProviders(getInventoryId()).then(unwrap);

export const getAllOverduePayments = () =>
  window.electronAPI.getAllOverduePayments(getInventoryId()).then(unwrap);

export const getExpiringProducts = (days: number) =>
  window.electronAPI.getExpiringProducts(getInventoryId(), days).then(unwrap);

export const getLowStockProducts = (threshold: number) =>
  window.electronAPI.getLowStockProducts(getInventoryId(), threshold).then(unwrap);

export const getTopUpcomingPayingCustomers = () =>
  window.electronAPI.getTopUpcomingPayingCustomers(getInventoryId()).then(unwrap);

export const getTopUpcomingPayingProviders = () =>
  window.electronAPI.getTopUpcomingPayingProviders(getInventoryId()).then(unwrap);

export const getMonthlyChartData = () =>
  window.electronAPI.getMonthlyChartData(getInventoryId()).then(unwrap);
